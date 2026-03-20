# Kernel.sh + Firecrawl Civic Data Tools — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the voice agent the ability to access official Wisconsin government databases in real time — campaign finance filings, voter registration lookup, polling places, and ballot information — using kernel.sh for browser automation and Firecrawl for data extraction.

**Architecture:** kernel.sh creates a headless browser, executes Playwright code to navigate dynamic government sites (form filling, clicking, waiting), then Firecrawl scrapes the resulting page for clean structured data. Three new server tools are exposed to the ElevenAgents voice agent. The UI renders new component types (FinanceFilingCard, VoterInfoCard, BallotLookupCard).

**Tech Stack:** kernel.sh SDK (`@onkernel/sdk`), Firecrawl SDK (already installed), Next.js API routes, ElevenAgents server tools

---

## Architecture Overview

```
Voice Agent: "What are Tiffany's official donor filings?"
  │
  ├── Server tool: lookup_finance
  │   └── API route: /api/finance
  │       ├── kernel.sh: navigate campaignfinance.wi.gov
  │       │   → search "Tom Tiffany" → click results → get URL
  │       ├── Firecrawl: scrape the results page → clean markdown
  │       └── Claude: synthesize → structured donor data
  │
  ├── Server tool: check_voter_info
  │   └── API route: /api/voter-info
  │       ├── kernel.sh: navigate myvote.wi.gov
  │       │   → enter address → click search → get results
  │       ├── Firecrawl: scrape results → polling place, ballot
  │       └── Claude: synthesize → voter info card
  │
  └── Client tools: render new UI components
      ├── show_finance_filing → FinanceFilingCard
      ├── show_voter_info → VoterInfoCard
      └── show_ballot → BallotCard
```

## What the Agent Can Do (New Capabilities)

1. **"Show me Tiffany's official donor filings"** → navigates campaignfinance.wi.gov, extracts actual WI Ethics Commission data
2. **"Am I registered to vote at 123 Main St, Madison?"** → navigates myvote.wi.gov, checks registration
3. **"What's on my ballot?"** → navigates myvote.wi.gov with address, shows all races + measures
4. **"Where do I vote?"** → navigates myvote.wi.gov, returns polling place address + hours

---

## Task 1: Install kernel.sh SDK + Create Browser Helper

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/lib/kernel.ts` (browser automation helper)
- Create: `.env.example` (add KERNEL_API_KEY)

- [ ] **Step 1: Install kernel.sh SDK**

```bash
npm install @onkernel/sdk
```

- [ ] **Step 2: Add KERNEL_API_KEY to .env.local and Vercel**

```env
KERNEL_API_KEY=your_kernel_api_key
```

- [ ] **Step 3: Create kernel.ts browser helper**

```typescript
// src/lib/kernel.ts
import Kernel from "@onkernel/sdk";

let kernelInstance: Kernel | null = null;

function getKernel(): Kernel {
  if (!kernelInstance) {
    kernelInstance = new Kernel({ apiKey: process.env.KERNEL_API_KEY });
  }
  return kernelInstance;
}

// Create a browser session, run Playwright code, return results
export async function runBrowserAutomation(
  playwrightCode: string,
  timeoutSec: number = 60,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const kernel = getKernel();

  try {
    // Create a headless browser session
    const session = await kernel.browsers.create({ type: "headless" });

    // Execute Playwright code in the browser VM
    const response = await kernel.browsers.playwright.execute(
      session.id,
      { code: playwrightCode, timeout_sec: timeoutSec },
    );

    // Clean up browser session
    await kernel.browsers.delete(session.id);

    return { success: true, result: response.result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json src/lib/kernel.ts .env.example
git commit -m "feat: add kernel.sh SDK and browser automation helper"
```

---

## Task 2: Campaign Finance Lookup API Route

**Files:**
- Create: `src/app/api/finance/route.ts`

This route navigates campaignfinance.wi.gov, searches for a candidate, and extracts their filing data.

- [ ] **Step 1: Create /api/finance route**

```typescript
// src/app/api/finance/route.ts
import { NextResponse } from "next/server";
import { runBrowserAutomation } from "@/lib/kernel";
import { getFirecrawl } from "@/lib/firecrawl";
import { CANDIDATES } from "@/data/candidates";

export async function POST(req: Request) {
  try {
    const { candidate } = await req.json();

    if (!candidate) {
      return NextResponse.json({ error: "candidate is required" }, { status: 400 });
    }

    const candidateData = CANDIDATES.find(
      (c) => c.id === candidate || c.name.toLowerCase() === candidate.toLowerCase(),
    );
    const candidateName = candidateData?.name ?? candidate;

    // Step 1: kernel.sh navigates the campaign finance site
    const playwrightCode = `
      // Navigate to WI Campaign Finance search
      await page.goto('https://campaignfinance.wi.gov/browse-data/search');
      await page.waitForLoadState('networkidle');

      // Search for the candidate
      const searchInput = page.getByPlaceholder('Search').first()
        || page.locator('input[type="text"]').first();
      await searchInput.fill('${candidateName.replace(/'/g, "\\'")}');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      // Get the current URL (results page)
      const url = page.url();

      // Also try to extract visible text data
      const pageText = await page.locator('body').textContent();

      return { url, textLength: pageText?.length ?? 0, pageUrl: url };
    `;

    const browserResult = await runBrowserAutomation(playwrightCode, 30);

    if (!browserResult.success) {
      // Fallback: use Firecrawl search for finance data
      const firecrawl = getFirecrawl();
      const result = await firecrawl.search(
        `"${candidateName}" campaign finance donors Wisconsin 2026`,
        { limit: 5, scrapeOptions: { formats: ["markdown"] } }
      );

      const webResults = result.web ?? [];
      return NextResponse.json({
        candidate: candidateName,
        source: "firecrawl_search",
        results: webResults.map((r) => ({
          title: ("title" in r ? r.title : "") ?? "",
          url: ("url" in r ? r.url : "") ?? "",
          content: ("markdown" in r ? (r.markdown as string)?.slice(0, 2000) : ("description" in r ? r.description : "")) ?? "",
        })),
      });
    }

    // Step 2: Firecrawl scrapes the results page for clean data
    const resultUrl = (browserResult.result as { url?: string })?.url;

    if (resultUrl && resultUrl !== 'about:blank') {
      const firecrawl = getFirecrawl();
      try {
        const scrapeResult = await firecrawl.scrapeUrl(resultUrl, {
          formats: ["markdown"],
        });

        return NextResponse.json({
          candidate: candidateName,
          source: "official_filing",
          sourceUrl: resultUrl,
          content: scrapeResult.markdown?.slice(0, 5000) ?? "",
          raw: browserResult.result,
        });
      } catch {
        return NextResponse.json({
          candidate: candidateName,
          source: "kernel_navigation",
          sourceUrl: resultUrl,
          content: "Navigation succeeded but scraping failed. URL available for manual review.",
          raw: browserResult.result,
        });
      }
    }

    return NextResponse.json({
      candidate: candidateName,
      source: "kernel_navigation",
      raw: browserResult.result,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test locally**

```bash
curl -s -X POST http://localhost:3000/api/finance \
  -H "Content-Type: application/json" \
  -d '{"candidate": "tiffany"}' | python3 -m json.tool | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/finance/route.ts
git commit -m "feat: campaign finance lookup via kernel.sh + Firecrawl"
```

---

## Task 3: Voter Info Lookup API Route

**Files:**
- Create: `src/app/api/voter-info/route.ts`

This route navigates myvote.wi.gov, enters an address, and extracts voter registration status, polling place, and ballot info.

- [ ] **Step 1: Create /api/voter-info route**

```typescript
// src/app/api/voter-info/route.ts
import { NextResponse } from "next/server";
import { runBrowserAutomation } from "@/lib/kernel";
import { getFirecrawl } from "@/lib/firecrawl";

export async function POST(req: Request) {
  try {
    const { address, city, zip } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    // kernel.sh navigates myvote.wi.gov
    const playwrightCode = `
      await page.goto('https://myvote.wi.gov/en-us/Find-My-Polling-Place');
      await page.waitForLoadState('networkidle');

      // Fill in address
      const addressInput = page.locator('input[id*="Address"], input[placeholder*="address"]').first();
      if (addressInput) {
        await addressInput.fill('${address.replace(/'/g, "\\'")}');
      }

      ${city ? `
      const cityInput = page.locator('input[id*="City"], input[placeholder*="city"]').first();
      if (cityInput) await cityInput.fill('${city.replace(/'/g, "\\'")}');
      ` : ""}

      // Click search/submit
      const searchBtn = page.locator('button:has-text("Search"), input[type="submit"]').first();
      if (searchBtn) await searchBtn.click();
      await page.waitForTimeout(3000);

      const url = page.url();
      const bodyText = await page.locator('body').textContent();

      return {
        url,
        textPreview: bodyText?.slice(0, 2000) ?? "",
      };
    `;

    const browserResult = await runBrowserAutomation(playwrightCode, 30);

    if (!browserResult.success) {
      return NextResponse.json({
        error: "Browser automation failed",
        detail: browserResult.error,
        fallback: "Visit myvote.wi.gov directly to check your registration and polling place.",
      });
    }

    // Firecrawl scrapes the results
    const resultUrl = (browserResult.result as { url?: string })?.url;

    if (resultUrl) {
      try {
        const firecrawl = getFirecrawl();
        const scrapeResult = await firecrawl.scrapeUrl(resultUrl, {
          formats: ["markdown"],
        });

        return NextResponse.json({
          address,
          city,
          source: "myvote.wi.gov",
          sourceUrl: resultUrl,
          content: scrapeResult.markdown?.slice(0, 3000) ?? "",
          raw: browserResult.result,
        });
      } catch {
        return NextResponse.json({
          address,
          source: "kernel_navigation",
          sourceUrl: resultUrl,
          content: (browserResult.result as { textPreview?: string })?.textPreview ?? "",
        });
      }
    }

    return NextResponse.json({
      address,
      source: "kernel_navigation",
      raw: browserResult.result,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test locally**

```bash
curl -s -X POST http://localhost:3000/api/voter-info \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St", "city": "Madison"}' | python3 -m json.tool | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/voter-info/route.ts
git commit -m "feat: voter info lookup via kernel.sh + myvote.wi.gov"
```

---

## Task 4: New UI Components

**Files:**
- Create: `src/components/FinanceFilingCard.tsx`
- Create: `src/components/VoterInfoCard.tsx`
- Modify: `src/types/index.ts` (add new RenderedComponent types)
- Modify: `src/components/ComponentRenderer.tsx` (add new sections)

- [ ] **Step 1: Create FinanceFilingCard component**

A card showing official campaign finance filing data with donor breakdown from the WI Ethics Commission.

- [ ] **Step 2: Create VoterInfoCard component**

A card showing voter registration status, polling place, and what's on the ballot for a specific address.

- [ ] **Step 3: Add to types and ComponentRenderer**

Add `"financeFiling"` and `"voterInfo"` to the `RenderedComponent` union type. Add sections in ComponentRenderer with headers "Official Filings" and "Your Voter Info".

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/types/
git commit -m "feat: FinanceFilingCard and VoterInfoCard components"
```

---

## Task 5: Register New Server Tools in ElevenAgents

**Files:**
- Modify: `docs/ELEVENLABS-AGENT-SETUP.md` (add new tools)
- Script: API calls to create tools on the agent

New server tools for the voice agent:

### `lookup_finance`
- URL: `https://badger-ballot.vercel.app/api/finance`
- Description: "Access official Wisconsin Ethics Commission campaign finance filings. Use when the user asks about official donor records, filings, or detailed campaign finance data."
- Body: `{ candidate: string }`
- Timeout: 45 seconds

### `check_voter_info`
- URL: `https://badger-ballot.vercel.app/api/voter-info`
- Description: "Look up voter registration, polling place, and ballot information on myvote.wi.gov. Use when the user provides their address or asks about registration, polling places, or what's on their ballot."
- Body: `{ address: string, city?: string, zip?: string }`
- Timeout: 45 seconds

### New client tools:

- `show_finance_filing` — renders FinanceFilingCard
- `show_voter_info` — renders VoterInfoCard

- [ ] **Step 1: Create tools via API script**
- [ ] **Step 2: Attach to agent**
- [ ] **Step 3: Update system prompt to include new tools**
- [ ] **Step 4: Commit**

---

## Task 6: Update Agent System Prompt

Add to the system prompt:

```
### When the user asks about official campaign finance filings:
1. Call lookup_finance with the candidate name
2. Narrate the official filing data — specific donors, amounts, filing dates
3. Call show_finance_filing to display the data
4. Note that this comes from official WI Ethics Commission records

### When the user provides their address or asks about voting:
1. Call check_voter_info with their address
2. Tell them: registration status, polling place, what's on their ballot
3. Call show_voter_info to display the information
4. Always direct them to myvote.wi.gov for final confirmation
```

---

## Task 7: Deploy + Test End-to-End

- [ ] **Step 1: Add KERNEL_API_KEY to Vercel env vars**
- [ ] **Step 2: Deploy to Vercel**
- [ ] **Step 3: Test finance lookup via voice: "Show me Tiffany's official donor filings"**
- [ ] **Step 4: Test voter info via voice: "Am I registered to vote at 123 Main St, Madison?"**
- [ ] **Step 5: Record demo video showing both capabilities**

---

## Priority Order

1. **Task 1** — kernel.sh setup (15 min)
2. **Task 2** — Campaign finance route (30 min) ← most impressive for demo
3. **Task 4** — UI components (20 min)
4. **Task 5** — Register tools (15 min)
5. **Task 6** — Update prompt (10 min)
6. **Task 7** — Deploy + test (15 min)
7. **Task 3** — Voter info route (30 min) ← stretch goal

**Total estimate:** ~2.5 hours for Tasks 1-6, Task 3 is bonus

---

## Demo Script (for hackathon video)

```
"Watch what happens when I ask about campaign money..."
User: "Show me Tom Tiffany's official donor filings"
Agent: "Let me dig into the official records..."
  → Screen shows: Digging progress with "Accessing WI Ethics Commission..."
  → kernel.sh navigates campaignfinance.wi.gov in the background
  → Firecrawl extracts the filing data
  → Agent narrates: "According to the official Ethics Commission filings..."
  → FinanceFilingCard appears with individual donors and amounts
  → "That's real government data, accessed live, right now."
```
