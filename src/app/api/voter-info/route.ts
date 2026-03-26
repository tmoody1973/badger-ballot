import { NextResponse } from "next/server";

const TOOLS_CONFIG = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
    // Playwright getByLabel — stable across page loads (no dynamic refs)
    code: (address: string, city: string, zip: string) =>
      `await page.getByLabel('Street Address*').fill('${address.replace(/'/g, "\\'")}');
await page.getByLabel('City*').fill('${city.replace(/'/g, "\\'")}');
await page.getByLabel('Zip*').fill('${zip}');
await page.getByRole('button', { name: 'Search' }).click();
await page.waitForTimeout(5000);`,
    codeLang: "node" as const,
    readPrompt: `Read the polling place results now visible on the page. Return ONLY:
Name: [polling place name]
Address: [full address]
Hours: [voting hours]
Ward: [ward number]
Election: [election date]`,
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-US/PreviewMyBallot",
    code: (address: string, city: string, zip: string) =>
      `await page.getByLabel('Street Address*').fill('${address.replace(/'/g, "\\'")}');
await page.getByLabel('City*').fill('${city.replace(/'/g, "\\'")}');
await page.getByLabel('Zip*').fill('${zip}');
await page.getByRole('button', { name: 'Search' }).click();
await page.waitForTimeout(10000);`,
    codeLang: "node" as const,
    readPrompt: `Read the sample ballot now visible. List every race and all candidates as a numbered list:
1. [Office]: [Candidate A], [Candidate B]
Return ONLY the list as plain text.`,
  },
  "registration": {
    url: "https://myvote.wi.gov/en-US/RegisterToVote",
    code: null as ((a: string, c: string, z: string) => string) | null,
    codeLang: "node" as const,
    readPrompt: null as string | null,
    // Registration uses a single prompt — no form to fill
    singlePrompt: (address: string, city: string, zip: string) =>
      `Tell me how to register to vote at ${address}, ${city}, WI ${zip}. Include online, by mail, and in-person options with deadlines.`,
  },
};

const FC_BASE = "https://api.firecrawl.dev/v2";

function fcHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { address, city, zip, action } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const resolvedCity = city || "Milwaukee";
    const resolvedZip = zip || "";
    const tool = (action ?? "polling-place") as keyof typeof TOOLS_CONFIG;
    const config = TOOLS_CONFIG[tool] ?? TOOLS_CONFIG["polling-place"];

    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
      return NextResponse.json({ success: false, error: "FIRECRAWL_API_KEY not set" }, { status: 500 });
    }

    console.log(`[voter-info] Tool: ${tool}, scraping ${config.url}...`);

    // Step 1: Scrape to get browser session
    const scrapeRes = await fetch(`${FC_BASE}/scrape`, {
      method: "POST",
      headers: fcHeaders(firecrawlKey),
      body: JSON.stringify({ url: config.url, formats: ["markdown"], timeout: 30000 }),
      signal: AbortSignal.timeout(35000),
    });

    if (!scrapeRes.ok) {
      console.error(`[voter-info] Scrape failed: ${scrapeRes.status}`);
      return NextResponse.json({ success: false, error: "Could not load page", rawContent: "" }, { status: 502 });
    }

    const scrapeId = (await scrapeRes.json())?.data?.metadata?.scrapeId;
    if (!scrapeId) {
      return NextResponse.json({ success: false, error: "No browser session", rawContent: "" }, { status: 502 });
    }

    console.log(`[voter-info] ScrapeId: ${scrapeId}`);

    let rawContent = "";

    if (config.code) {
      // Step 2a: CODE mode — fill form + click search (deterministic Playwright)
      console.log(`[voter-info] Running code: fill + click...`);
      const codeRes = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
        method: "POST",
        headers: fcHeaders(firecrawlKey),
        body: JSON.stringify({
          code: config.code(address, resolvedCity, resolvedZip),
          language: config.codeLang ?? "node",
          timeout: tool === "ballot" ? 60 : 30,
        }),
        signal: AbortSignal.timeout(tool === "ballot" ? 70000 : 40000),
      });

      if (!codeRes.ok) {
        const err = await codeRes.text().catch(() => "");
        console.error(`[voter-info] Code step failed: ${codeRes.status} ${err.slice(0, 200)}`);
        await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});
        return NextResponse.json({ success: false, error: "Could not fill form", rawContent: "" }, { status: 502 });
      }

      const codeResult = await codeRes.json();
      console.log(`[voter-info] Code done. exitCode: ${codeResult?.exitCode}, stdout: ${(codeResult?.stdout ?? "").length} chars`);

      // Step 2b: PROMPT mode — read results (AI interprets the loaded page)
      if (config.readPrompt) {
        console.log(`[voter-info] Reading results with prompt...`);
        const readTimeout = tool === "ballot" ? 60 : 50;
        const readRes = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
          method: "POST",
          headers: fcHeaders(firecrawlKey),
          body: JSON.stringify({ prompt: config.readPrompt, timeout: readTimeout }),
          signal: AbortSignal.timeout((readTimeout + 10) * 1000),
        });

        if (readRes.ok) {
          const readResult = await readRes.json();
          rawContent = readResult?.output || readResult?.stdout || "";
          console.log(`[voter-info] Read done: ${rawContent.length} chars`);
        } else {
          console.error(`[voter-info] Read failed: ${readRes.status}`);
        }
      }
    } else if ("singlePrompt" in config && config.singlePrompt) {
      // Registration — single prompt, no form
      const promptRes = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
        method: "POST",
        headers: fcHeaders(firecrawlKey),
        body: JSON.stringify({ prompt: config.singlePrompt(address, resolvedCity, resolvedZip), timeout: 45 }),
        signal: AbortSignal.timeout(55000),
      });

      if (promptRes.ok) {
        const result = await promptRes.json();
        rawContent = result?.output || result?.stdout || "";
      }
    }

    // Cleanup
    await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});

    console.log(`[voter-info] Done. Output: ${rawContent.length} chars`);

    return NextResponse.json({
      success: true,
      address,
      city: resolvedCity,
      zip: resolvedZip,
      tool,
      sourceUrl: config.url,
      rawContent: typeof rawContent === "string" ? rawContent.slice(0, 4000) : String(rawContent).slice(0, 4000),
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      daysUntilElection: Math.max(0, Math.ceil((new Date("2026-04-07").getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      links: {
        pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
        ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot",
        registration: "https://myvote.wi.gov/en-US/RegisterToVote",
        absentee: "https://myvote.wi.gov/en-US/VoteAbsenteeByMail",
        trackBallot: "https://myvote.wi.gov/en-US/TrackMyBallot",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[voter-info] Error:", message);
    return NextResponse.json({
      success: false, error: message, rawContent: "",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: { pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace", ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot", registration: "https://myvote.wi.gov/en-US/RegisterToVote" },
    }, { status: 500 });
  }
}
