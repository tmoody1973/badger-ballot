import { NextResponse } from "next/server";

const TOOLS_CONFIG = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
    fillPrompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for the page to fully update with results before confirming.`,
    readPrompt: () =>
      `Read the polling place results now visible on the page. Tell me:
Name: [polling place name]
Address: [full address]
Hours: [voting hours]
Ward: [ward number]
Election: [election date if shown]
Return ONLY these fields as plain text.`,
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-US/PreviewMyBallot",
    fillPrompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for the sample ballot to fully load — you should see "SAMPLE BALLOT FOR MY NEXT ELECTION" and a list of races. Then list every race showing the office name and ALL candidate names. Format as a numbered list.`,
    readPrompt: null as (() => string) | null, // single step — ballot needs full timeout
  },
  "registration": {
    url: "https://myvote.wi.gov/en-US/RegisterToVote",
    fillPrompt: (address: string, city: string, zip: string) =>
      `Tell me how to register to vote at ${address}, ${city}, WI ${zip}.`,
    readPrompt: null as (() => string) | null,
  },
};

const FC_BASE = "https://api.firecrawl.dev/v2";

function fcHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export const maxDuration = 120;

async function interact(
  scrapeId: string,
  key: string,
  prompt: string,
  timeoutS: number,
  signalMs: number,
): Promise<{ ok: boolean; content: string; error?: string }> {
  const res = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
    method: "POST",
    headers: fcHeaders(key),
    body: JSON.stringify({ prompt, timeout: timeoutS }),
    signal: AbortSignal.timeout(signalMs),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, content: "", error: `${res.status}: ${err.slice(0, 200)}` };
  }
  const result = await res.json();
  return { ok: true, content: result?.output || result?.stdout || "" };
}

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

    console.log(`[voter-info] ScrapeId: ${scrapeId}, filling form...`);

    // Step 2: Fill form + click search (ballot needs longer — single step does fill+wait+read)
    const fillTimeout = tool === "ballot" ? 80 : 45;
    const fillSignal = tool === "ballot" ? 90000 : 55000;
    const fillResult = await interact(scrapeId, firecrawlKey, config.fillPrompt(address, resolvedCity, resolvedZip), fillTimeout, fillSignal);

    if (!fillResult.ok) {
      console.error(`[voter-info] Fill failed: ${fillResult.error}`);
      await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});
      return NextResponse.json({ success: false, error: "Could not fill form", rawContent: "" }, { status: 502 });
    }

    console.log(`[voter-info] Form filled (${fillResult.content.length} chars). Reading results...`);

    // Step 3: Read results (skip for registration)
    let rawContent = fillResult.content;
    if (config.readPrompt) {
      const readResult = await interact(scrapeId, firecrawlKey, config.readPrompt(), 45, 55000);
      if (readResult.ok && readResult.content.length > 0) {
        rawContent = readResult.content;
      }
      console.log(`[voter-info] Read: ${readResult.content.length} chars, ok: ${readResult.ok}`);
    }

    // Step 4: Cleanup
    await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});

    console.log(`[voter-info] Done. Output: ${String(rawContent).length} chars`);

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
