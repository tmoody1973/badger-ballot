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
      // Step 2: Navigate and fill form
      await firecrawl.browserExecute(sessionId, {
        language: "node",
        code: `
          await page.goto(${JSON.stringify(targetUrl)}, { waitUntil: "networkidle" });
          await page.waitForTimeout(2000);
          await page.fill("#SearchStreet", ${JSON.stringify(address)});
          await page.fill("#SearchCity", ${JSON.stringify(resolvedCity)});
          await page.fill("#SearchZip", ${JSON.stringify(resolvedZip)});
          await page.waitForTimeout(500);
          await Promise.all([
            page.waitForLoadState("networkidle"),
            page.click("#SearchAddressButton"),
          ]);
          await page.waitForTimeout(5000);
          console.log("Form submitted, URL: " + page.url());
        `,
      });

      // Step 3: Extract results in a separate call
      const extractResult = await firecrawl.browserExecute(sessionId, {
        language: "node",
        code: `
          const text = await page.evaluate(() => {
            const el = document.querySelector("main") || document.querySelector("#ContentPane") || document.body;
            return el ? el.innerText : "";
          });
          console.log(text.substring(0, 4000));
        `,
      });

      console.log(`[voter-info] Extract stdout length: ${extractResult.stdout?.length ?? 0}`);

      const rawContent = extractResult.stdout ?? extractResult.result ?? "";
      const races: Array<{ office: string; candidates: string[] }> = [];

      return NextResponse.json({
        success: true,
        address,
        city: resolvedCity,
        zip: resolvedZip,
        tool,
        sourceUrl: targetUrl,
        rawContent,
        races,
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
