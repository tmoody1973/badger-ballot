import { NextResponse } from "next/server";

const TOOLS_CONFIG = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
    prompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for results to load. Tell me the polling place name, full address, polling hours, and ward number. Format with clear labels.`,
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-US/PreviewMyBallot",
    prompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for the sample ballot to fully load. You should see "SAMPLE BALLOT FOR MY NEXT ELECTION". List every race showing the office name and ALL candidate names. Format as a numbered list.`,
  },
  "registration": {
    url: "https://myvote.wi.gov/en-US/RegisterToVote",
    prompt: (address: string, city: string, zip: string) =>
      `Tell me how to register to vote at ${address}, ${city}, WI ${zip}.`,
  },
};

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
      return NextResponse.json({ success: false, error: "FIRECRAWL_API_KEY not set" });
    }

    console.log(`[voter-info] Tool: ${tool}, scraping ${config.url}...`);

    // Step 1: Scrape the page via direct API (bypasses SDK 5s timeout)
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: config.url,
        formats: ["markdown"],
        timeout: 30000,
      }),
      signal: AbortSignal.timeout(35000),
    });

    const scrapeResult = await scrapeResponse.json();
    const scrapeId = scrapeResult?.data?.metadata?.scrapeId;

    if (!scrapeId) {
      console.error("[voter-info] No scrapeId:", JSON.stringify(scrapeResult).slice(0, 200));
      return NextResponse.json({
        success: false,
        error: "Could not start browser session",
        rawContent: "",
        links: { pollingPlace: config.url },
      });
    }

    console.log(`[voter-info] ScrapeId: ${scrapeId}, interacting...`);

    // Step 2: Interact via direct API (bypasses SDK 5s timeout)
    const interactPrompt = config.prompt(address, resolvedCity, resolvedZip);
    const interactResponse = await fetch(`https://api.firecrawl.dev/v2/scrape/${scrapeId}/interact`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: interactPrompt, timeout: 90 }),
      signal: AbortSignal.timeout(100000),
    });

    const interactResult = await interactResponse.json();
    const output = interactResult?.output ?? "";
    const stdout = interactResult?.stdout ?? "";
    const rawContent = output || stdout || "";

    console.log(`[voter-info] Done. Output: ${output.length} chars`);

    // Step 3: Stop the session
    await fetch(`https://api.firecrawl.dev/v2/scrape/${scrapeId}/interact`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${firecrawlKey}` },
    }).catch(() => {});

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
      success: false,
      error: message,
      rawContent: "",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: {
        pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
        ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot",
        registration: "https://myvote.wi.gov/en-US/RegisterToVote",
      },
    });
  }
}
