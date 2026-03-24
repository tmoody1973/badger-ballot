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

    // Step 2: Use interact with a PROMPT — same as the playground
    const interactResult = await firecrawl.interact(scrapeId, {
      prompt: `Fill in the polling place search form with this address: Street Address: "${address}", City: "${resolvedCity}", Zip: "${resolvedZip}". Then click the Search button and wait for results. After the results load, tell me the polling place name, address, hours, and ward number.`,
    });

    console.log(`[voter-info] Interact result:`, JSON.stringify(interactResult).slice(0, 500));

    const output = (interactResult as unknown as { output?: string }).output ?? "";
    const rawContent = output || JSON.stringify(interactResult);

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
