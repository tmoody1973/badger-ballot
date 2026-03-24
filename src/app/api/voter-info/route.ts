import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

const TOOLS: Record<string, { url: string; fillPrompt: string; extractPrompt: string }> = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
    fillPrompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}", the City field with "${city}", and the Zip field with "${zip}". Then click the Search button.`,
    extractPrompt: `Look at the current page. Tell me: 1) The name of the polling place, 2) The polling place address, 3) The polling place hours, 4) The ward number. Format your answer clearly with labels.`,
  } as unknown as { url: string; fillPrompt: string; extractPrompt: string },
  "ballot": {
    url: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
    fillPrompt: (address: string, city: string, zip: string) =>
      `Fill the Street Address field with "${address}", the City field with "${city}", and the Zip field with "${zip}". Then click the Search button.`,
    extractPrompt: `Look at the current page. List every race and referendum on this ballot. For each race, tell me the office name and all candidates. For referendums, tell me the question. Format as a clear list.`,
  } as unknown as { url: string; fillPrompt: string; extractPrompt: string },
  "registration": {
    url: "https://myvote.wi.gov/en-us/My-Voter-Info",
    fillPrompt: (address: string, city: string, zip: string) =>
      `This is a voter info lookup page. Fill in the name or address fields with "${address}, ${city}, ${zip}" and search. If it asks for first/last name, try searching by address instead.`,
    extractPrompt: `Look at the current page. Tell me if the voter is registered, their registration status, and any other voter information shown. Format clearly.`,
  } as unknown as { url: string; fillPrompt: string; extractPrompt: string },
};

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
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    // Step 1: Scrape the page to get a scrapeId
    const scrapeResult = await firecrawl.scrape(config.url, { formats: ["markdown"] });
    const scrapeId = (scrapeResult as unknown as { metadata?: { scrapeId?: string } }).metadata?.scrapeId;

    if (!scrapeId) {
      return NextResponse.json({
        success: false,
        error: "Could not create browser session",
        rawContent: "",
        links: {
          pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
          ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
          registration: "https://myvote.wi.gov/en-us/My-Voter-Info",
        },
      });
    }

    console.log(`[voter-info] Tool: ${tool}, ScrapeId: ${scrapeId}`);

    // Step 2: Fill form and submit
    const fillFn = config.fillPrompt as unknown as (a: string, c: string, z: string) => string;
    await firecrawl.interact(scrapeId, {
      prompt: fillFn(address, resolvedCity, resolvedZip),
    });

    console.log(`[voter-info] Form submitted for ${tool}`);

    // Step 3: Extract data from results
    const extractResult = await firecrawl.interact(scrapeId, {
      prompt: config.extractPrompt,
    });

    const output = (extractResult as unknown as { output?: string }).output ?? "";
    const stdout = (extractResult as unknown as { stdout?: string }).stdout ?? "";
    const rawContent = output || stdout || "";

    // Stop session
    await firecrawl.stopInteraction(scrapeId).catch(() => {});

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
