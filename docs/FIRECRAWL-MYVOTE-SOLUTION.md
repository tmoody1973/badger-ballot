# Firecrawl Interact: Reliable Form Automation on myvote.wi.gov

How we solved the unreliable voter lookup on Wisconsin's official election site.

## The Problem

myvote.wi.gov is built on ASP.NET WebForms, a legacy Microsoft framework with quirks that break standard scraping:

1. **Cloudflare protection** — the site sits behind a managed challenge. Raw HTTP requests fail. Firecrawl's browser handles this but needs time to pass.
2. **ASP.NET WebForms validation** — the form uses `__VIEWSTATE` and client-side JavaScript validators that listen for real keyboard events (`keydown`, `keypress`, `input`, `blur`). If these events don't fire, the form thinks it's still empty and the Search button stays disabled.
3. **Postback architecture** — clicking Search triggers a full page postback (not AJAX), which takes 5-30 seconds to return results.

## What Didn't Work

### Prompt-based interact (unreliable)
```
prompt: "Fill the Street Address field with '1108 W Chambers St'.
         Fill City with 'Milwaukee'. Click Search. Read results."
```
- Firecrawl's AI agent interprets the prompt non-deterministically
- Sometimes fills the form but doesn't click Search
- Sometimes clicks but returns the DOM accessibility tree instead of results
- Sometimes works perfectly — ~30% success rate

### `page.fill()` in code mode (intermittent)
```javascript
await page.fill('[aria-label="Street Address*"]', '1108 W Chambers St');
```
- `fill()` directly sets `input.value` in the DOM
- Does NOT fire keyboard events (`keydown`, `keypress`, `input`)
- ASP.NET validators never see the input, form thinks fields are empty
- Search button stays disabled or ignores the click

## What Works: Three-Step Architecture

### Step 1: Scrape — Load page + bypass Cloudflare

```typescript
const scrapeRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
    formats: ["markdown"],
    timeout: 45000
  }),
});
const scrapeId = (await scrapeRes.json())?.data?.metadata?.scrapeId;
```

This loads the page in Firecrawl's headless browser, passes Cloudflare, and gives us a session ID for subsequent interact calls.

### Step 2: Code mode — Fill form + click with deterministic Playwright

```typescript
const code = `
  // Wait for form to render
  const addrInput = page.getByLabel('Street Address*');
  await addrInput.waitFor({ state: 'visible', timeout: 15000 });

  // pressSequentially types each character, firing all keyboard events
  // This is critical for ASP.NET WebForms validation
  await addrInput.click();
  await addrInput.fill('');  // clear first
  await addrInput.pressSequentially('1108 W Chambers St', { delay: 30 });
  await addrInput.evaluate(el => el.dispatchEvent(new Event('blur')));

  const cityInput = page.getByLabel('City*');
  await cityInput.click();
  await cityInput.fill('');
  await cityInput.pressSequentially('Milwaukee', { delay: 30 });
  await cityInput.evaluate(el => el.dispatchEvent(new Event('blur')));

  const zipInput = page.getByLabel('Zip*');
  await zipInput.click();
  await zipInput.fill('');
  await zipInput.pressSequentially('53206', { delay: 30 });
  await zipInput.evaluate(el => el.dispatchEvent(new Event('blur')));

  // Wait for ASP.NET validation to enable the button
  await page.waitForTimeout(1500);

  // force: true bypasses invisible ASP.NET span wrappers around buttons
  const searchBtn = page.getByRole('button', { name: 'Search' });
  await searchBtn.click({ force: true });

  // networkidle waits for the postback to fully complete
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Extract raw page text — deterministic, no AI interpretation
  const content = await page.evaluate(() => document.body.innerText);
  JSON.stringify({ content });
`;

const codeRes = await fetch(`https://api.firecrawl.dev/v2/scrape/${scrapeId}/interact`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ code, language: "node", timeout: 60 }),
});
const codeResult = await codeRes.json();
const pageText = JSON.parse(codeResult.result).content;
```

Key decisions:
- **`pressSequentially()` instead of `fill()`** — fires `keydown`, `keypress`, `input` events on every character. ASP.NET's validators respond to these events.
- **`.blur()` after each field** — dispatches the `blur` event, which is ASP.NET's standard trigger for field validation. Without this, the form thinks the field hasn't been touched.
- **`force: true` on click** — ASP.NET wraps buttons in invisible `<span>` elements that confuse Playwright's actionability checks. Forcing the click bypasses this.
- **`getByLabel()` selectors** — stable across page loads. Element IDs and `@ref` numbers change every session.
- **`waitForLoadState('networkidle')`** — waits until there are no network connections for 500ms. This guarantees the postback results have loaded, unlike `waitForTimeout()` which is just guessing.
- **`document.body.innerText`** — extracts the rendered text content deterministically. No AI interpretation at this stage.

### Step 3: Claude parses raw text into structured JSON

```typescript
const Anthropic = (await import("@anthropic-ai/sdk")).default;
const anthropic = new Anthropic();

const claudeRes = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2000,
  system: `Extract polling place info. Return ONLY valid JSON:
    {"name": "...", "address": "...", "hours": "...", "ward": "...", "election": "..."}`,
  messages: [{ role: "user", content: `Extract data:\n\n${pageText}` }],
});
```

Separating text extraction (code) from text interpretation (Claude) is critical. The code step is deterministic — it always gets the page text. The Claude step is reliable because it's parsing plain text, not navigating a browser.

## Timeout Budget

For Vercel with `maxDuration: 120`:

| Step | Polling Place | Ballot |
|------|---------------|--------|
| Scrape (Cloudflare + page load) | ~10s | ~10s |
| Code (type + click + wait) | ~15s | ~25s |
| Claude parse | ~3s | ~3s |
| **Total** | **~28s** | **~38s** |
| Buffer | 92s | 82s |

## Consistency Results

After implementing this approach:
- Polling place: **6/6 tests passed** (3 local, 3 production)
- Ballot: **4/4 tests passed** (1 local, 3 production)

Previous prompt-based approach: ~30% success rate.

## URLs

The correct myvote.wi.gov URLs use camelCase (not hyphenated):
- `https://myvote.wi.gov/en-US/FindMyPollingPlace`
- `https://myvote.wi.gov/en-US/PreviewMyBallot`
- `https://myvote.wi.gov/en-US/RegisterToVote`

## Integration with Voice Agent

The voter lookup is non-blocking. When the ElevenLabs voice agent triggers `lookup_polling_place` or `lookup_ballot`:

1. Client tool returns immediately — voice agent keeps talking
2. Status bar shows "Looking up your polling place..."
3. API runs the 3-step pipeline in background (30-60 seconds)
4. When results arrive, the card renders on screen
5. Status updates to "Found your polling place info."

The voice agent fills the wait time by telling the user about the election date, photo ID requirements, and absentee voting options.
