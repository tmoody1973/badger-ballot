# Firecrawl Interact Pattern — Dynamic Form Automation for AI Agents

A reusable pattern for AI agents to fill forms, navigate dynamic websites, and extract structured data from government portals and other interactive sites that can't be scraped statically.

## The Problem

Many important data sources (voter registration portals, campaign finance databases, permit systems) live behind forms that require:
- Filling input fields with user-specific data
- Clicking submit buttons
- Waiting for server-side rendering
- Extracting results from dynamically loaded pages

Static scrapers (Firecrawl's standard `scrape`) can't handle these because the data isn't in the initial HTML — it only appears after form submission.

## The Solution: Firecrawl Interact

Firecrawl's `interact()` API combines browser automation with AI-driven page understanding. Instead of writing fragile CSS selectors or XPath queries, you describe what you want in natural language and the AI figures out how to do it.

### Three-Step Pattern

```typescript
import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// 1. SCRAPE — get a session ID
const scrapeResult = await firecrawl.scrape(targetUrl, { formats: ["markdown"] });
const scrapeId = scrapeResult.metadata?.scrapeId;

// 2. INTERACT — fill form + submit (prompt-based)
await firecrawl.interact(scrapeId, {
  prompt: 'Fill the Street Address field with "123 Main St", City with "Milwaukee", Zip with "53206". Click Search.',
});

// 3. INTERACT — extract results (prompt-based)
const result = await firecrawl.interact(scrapeId, {
  prompt: 'Tell me the polling place name, address, and hours.',
});

const data = result.output; // AI-generated structured answer

// 4. CLEANUP — stop the session
await firecrawl.stopInteraction(scrapeId);
```

### Why Two Interact Calls?

The first call fills the form and triggers navigation. The second call reads the results page. Splitting them ensures the page has fully loaded before extraction begins.

## Real-World Example: Wisconsin Voter Lookup

Ballot Badger uses this pattern to query myvote.wi.gov — Wisconsin's official voter portal. The site has three tools:

| Tool | URL | What it returns |
|------|-----|----------------|
| Polling Place | `/Find-My-Polling-Place` | Name, address, hours, ward |
| Ballot Preview | `/Whats-On-My-Ballot` | Every race and referendum |
| Registration | `/My-Voter-Info` | Registration status |

All three use the same form fields: `#SearchStreet`, `#SearchCity`, `#SearchZip`, `#SearchAddressButton`.

### Implementation

```typescript
// Config per tool
const TOOLS = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
    fillPrompt: (addr, city, zip) =>
      `Fill Street Address with "${addr}", City with "${city}", Zip with "${zip}". Click Search.`,
    extractPrompt: `Tell me the polling place name, address, hours, and ward number.`,
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
    fillPrompt: (addr, city, zip) =>
      `Fill Street Address with "${addr}", City with "${city}", Zip with "${zip}". Click Search.`,
    extractPrompt: `List every race and referendum on this ballot with candidates.`,
  },
};

// Execute
const scrape = await firecrawl.scrape(config.url, { formats: ["markdown"] });
await firecrawl.interact(scrape.metadata.scrapeId, { prompt: config.fillPrompt(addr, city, zip) });
const result = await firecrawl.interact(scrape.metadata.scrapeId, { prompt: config.extractPrompt });
await firecrawl.stopInteraction(scrape.metadata.scrapeId);
```

### Voice Agent Integration

When a user says "Where do I vote? I live at 1108 W Chambers St, Milwaukee 53206", the ElevenAgents voice agent:

1. Detects a voter info request
2. Calls the `lookup_voter_info` client tool with the address
3. The client tool calls `/api/voter-info` (our Next.js route)
4. The route uses Firecrawl interact() to query myvote.wi.gov
5. Results render as a `PollingPlaceCard` component on screen
6. The voice agent narrates: "Your polling place is Lafollette Elementary School at 3239 N 9th St. Polls are open 7 AM to 8 PM on April 7th."

## Key Learnings

1. **Prompt-based > Code-based**: Natural language prompts are more reliable than CSS selectors for government sites that may change their HTML structure.

2. **Two calls, not one**: Asking the AI to fill a form AND extract results in one prompt often fails because the page hasn't loaded yet. Split into fill → extract.

3. **Always stop sessions**: Each session costs 2 credits/minute. Call `stopInteraction()` in a finally block.

4. **60-second timeout needed**: Form submission + page load + extraction takes 30-40 seconds. Vercel Pro (60s timeout) or equivalent is required.

5. **Firecrawl SDK v4.17+**: The `interact()` and `stopInteraction()` methods were added in v4.17.0. Earlier versions don't have them.

## Reusing This Pattern

This pattern works for any site with a form-based lookup:
- County property records
- Business license lookups
- Court case searches
- Permit status checks
- University admissions portals
- Government benefits eligibility

The key insight: you don't need to know the site's HTML structure. You just describe what you see and what you want to do. The AI handles the rest.

## Dependencies

```json
{
  "@mendable/firecrawl-js": "^4.17.0"
}
```

No additional dependencies. No Playwright install. No Browserbase. No kernel.sh. Just the Firecrawl SDK you're already using.
