import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

const TOOLS: Record<string, { url: string; extractPrompt: string }> = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
    extractPrompt: "Tell me the polling place name, address, hours, and ward number. Format clearly with labels.",
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
    extractPrompt: "List every race and referendum on this ballot with all candidates. Format as a clear list.",
  },
  "registration": {
    url: "https://myvote.wi.gov/en-us/My-Voter-Info",
    extractPrompt: "Tell me the voter registration status and any voter information shown.",
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
    const tool = action ?? "polling-place";
    const config = TOOLS[tool] ?? TOOLS["polling-place"];

    // Create Firecrawl client with extended timeout (55 seconds)
    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY!,
      timeoutMs: 55000,
    } as ConstructorParameters<typeof FirecrawlApp>[0]);

    // Step 1: Scrape via direct API call to bypass SDK 5s timeout
    console.log(`[voter-info] Scraping ${config.url} via direct API...`);
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: config.url,
        formats: ["markdown"],
        timeout: 30000,
        waitFor: 5000,
      }),
      signal: AbortSignal.timeout(35000),
    });

    const scrapeResult = await scrapeResponse.json();
    const scrapeId = scrapeResult?.data?.metadata?.scrapeId ?? scrapeResult?.metadata?.scrapeId ?? scrapeResult?.scrapeId;
    console.log(`[voter-info] Scrape response keys: ${JSON.stringify(Object.keys(scrapeResult))}, scrapeId: ${scrapeId}`);
    if (!scrapeId) {
      return NextResponse.json({
        success: false,
        error: "Could not start browser session for myvote.wi.gov",
        rawContent: "",
        links: { pollingPlace: config.url },
      });
    }

    console.log(`[voter-info] ScrapeId: ${scrapeId}, starting interact...`);

    // Step 2: Call interact API directly to bypass SDK 5s timeout
    const fillPrompt = `Fill the Street Address field with "${address}", the City field with "${resolvedCity}", and the Zip field with "${resolvedZip}". Click the Search button. Wait for the results page to load. Then ${config.extractPrompt.toLowerCase()}`;

    console.log(`[voter-info] Calling interact API directly...`);
    const interactResponse = await fetch(`https://api.firecrawl.dev/v2/scrape/${scrapeId}/interact`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: fillPrompt, timeout: 50 }),
      signal: AbortSignal.timeout(55000),
    });

    const interactResult = await interactResponse.json();
    const output = interactResult?.output ?? "";
    const stdout = interactResult?.stdout ?? "";

    console.log(`[voter-info] Done. Output: ${output.length} chars, Stdout: ${stdout.length} chars`);

    // Stop session
    await fetch(`https://api.firecrawl.dev/v2/scrape/${scrapeId}/interact`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    }).catch(() => {});

    // Use output (AI answer) if available, otherwise use stdout
    const rawContent = output || (stdout.length < 2000 ? stdout : "");

    return NextResponse.json({
      success: true,
      address,
      city: resolvedCity,
      zip: resolvedZip,
      tool,
      sourceUrl: config.url,
      rawContent,
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      daysUntilElection: Math.max(0, Math.ceil((new Date("2026-04-07").getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      links: {
        pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
        ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
        registration: "https://myvote.wi.gov/en-us/My-Voter-Info",
        absentee: "https://myvote.wi.gov/en-us/Vote-Absentee-By-Mail",
        trackBallot: "https://myvote.wi.gov/en-us/Track-My-Ballot",
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
        pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
        ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
        registration: "https://myvote.wi.gov/en-us/My-Voter-Info",
      },
    });
  }
}
