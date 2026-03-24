import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function POST(req: Request) {
  try {
    const { address, city, zip } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const resolvedCity = city || "Milwaukee";
    const resolvedZip = zip || "";

    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    // Step 1: Scrape the page to get a scrapeId for interact
    const scrapeResult = await firecrawl.scrape(
      "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
      { formats: ["markdown"] },
    );

    const scrapeId = (scrapeResult as unknown as { metadata?: { scrapeId?: string } }).metadata?.scrapeId;

    if (!scrapeId) {
      return NextResponse.json({
        success: false,
        error: "Could not create browser session",
        rawContent: "",
        links: { pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place" },
      });
    }

    console.log(`[voter-info] ScrapeId: ${scrapeId}`);

    // Step 2: Fill form and submit
    await firecrawl.interact(scrapeId, {
      prompt: `Fill the Street Address field with "${address}", the City field with "${resolvedCity}", and the Zip field with "${resolvedZip}". Then click the Search button.`,
    });

    console.log(`[voter-info] Form submitted, waiting for results...`);

    // Step 3: Extract the polling place data from the results page
    const extractResult = await firecrawl.interact(scrapeId, {
      prompt: `Look at the current page. Tell me: 1) The name of the polling place, 2) The polling place address, 3) The polling place hours, 4) The ward number. If you see a "My Polling Place" section, read the data from there. Format your answer clearly.`,
    });

    console.log(`[voter-info] Extract result:`, JSON.stringify(extractResult).slice(0, 500));

    const output = (extractResult as unknown as { output?: string }).output ?? "";
    const stdout = (extractResult as unknown as { stdout?: string }).stdout ?? "";
    const rawContent = output || stdout || JSON.stringify(extractResult);

    // Stop the interaction session
    await firecrawl.stopInteraction(scrapeId).catch(() => {});

    return NextResponse.json({
      success: true,
      address,
      city: resolvedCity,
      zip: resolvedZip,
      sourceUrl: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
      rawContent,
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      daysUntilElection: Math.max(0, Math.ceil((new Date("2026-04-07").getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      links: {
        pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
        ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
        registration: "https://myvote.wi.gov/en-us/Register-To-Vote",
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
        registration: "https://myvote.wi.gov/en-us/Register-To-Vote",
      },
    });
  }
}
