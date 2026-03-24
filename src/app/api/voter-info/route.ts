import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export async function POST(req: Request) {
  try {
    const { address, city, zip, action } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const resolvedCity = city || "Milwaukee";
    const resolvedZip = zip || "";
    const tool = action ?? "ballot";

    const urls: Record<string, string> = {
      "polling-place": "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
      "ballot": "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
    };
    const targetUrl = urls[tool] ?? urls["ballot"];

    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    // Step 1: Create a Firecrawl Browser session
    const session = await firecrawl.browser({ ttl: 120, activityTtl: 60 });
    const sessionId = session.id;
    console.log(`[voter-info] Firecrawl Browser session:`, JSON.stringify(session).slice(0, 300));

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: `Browser session creation failed: ${JSON.stringify(session).slice(0, 200)}`,
        rawContent: "",
        links: { pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place" },
      });
    }

    try {
      // Step 2: Navigate to the page
      const navResult = await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser goto "${targetUrl}"`,
      });
      console.log(`[voter-info] Nav:`, navResult.stdout?.slice(0, 100));

      // Wait for page load
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser wait --load networkidle`,
      });

      // Step 3: Fill form using @ref IDs from snapshot
      // @e30 = Street, @e32 = City, @e33 = Zip, @e35 = Search button
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser fill @e30 "${address.replace(/"/g, '\\"')}"`,
      });
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser fill @e32 "${resolvedCity.replace(/"/g, '\\"')}"`,
      });
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser fill @e33 "${resolvedZip.replace(/"/g, '\\"')}"`,
      });

      // Click Search button (@e35)
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser click @e35`,
      });

      // Wait for results page
      await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser eval "new Promise(r => setTimeout(r, 5000))"`,
      });

      // Step 4: Get the page text after form submission
      const textResult = await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser text`,
      });

      // Also snapshot for structure
      const snap = await firecrawl.browserExecute(sessionId, {
        language: "bash",
        code: `agent-browser snapshot`,
      });

      console.log(`[voter-info] Text: ${textResult.stdout?.length ?? 0} chars`);

      const rawContent = textResult.stdout || snap.stdout || "";
      const races: Array<{ office: string; candidates: string[] }> = [];

      return NextResponse.json({
        success: true,
        address,
        city: resolvedCity,
        zip: resolvedZip,
        tool,
        sourceUrl: targetUrl,
        rawContent: typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
        races,
        _debug: {
          navResult: navResult ? { stdout: navResult.stdout?.slice(0, 200), stderr: navResult.stderr?.slice(0, 200), success: navResult.success } : null,
          snapResult: snap ? { stdout: snap.stdout?.slice(0, 500), stderr: snap.stderr?.slice(0, 200), success: snap.success } : null,
          textResult: textResult ? { stdout: textResult.stdout?.slice(0, 200), stderr: textResult.stderr?.slice(0, 200), success: textResult.success, result: String(textResult.result ?? "").slice(0, 200) } : null,
        },
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
    } finally {
      await firecrawl.deleteBrowser(sessionId).catch(() => {});
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[voter-info] Error:", message);

    return NextResponse.json({
      success: false,
      error: message,
      rawContent: "Visit myvote.wi.gov directly to check your voter info.",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: {
        pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
        ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
        registration: "https://myvote.wi.gov/en-us/Register-To-Vote",
      },
    });
  }
}
