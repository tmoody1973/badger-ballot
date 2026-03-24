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
      // Step 2: Execute Playwright code remotely in Firecrawl's sandbox
      const result = await firecrawl.browserExecute(sessionId, {
        language: "node",
        code: `
          await page.goto(${JSON.stringify(targetUrl)}, {
            waitUntil: "networkidle",
          });

          await page.waitForTimeout(2000);

          // Fill the address form using exact field IDs from myvote.wi.gov
          await page.fill("#SearchStreet", ${JSON.stringify(address)});
          await page.fill("#SearchCity", ${JSON.stringify(resolvedCity)});
          await page.fill("#SearchZip", ${JSON.stringify(resolvedZip)});

          await page.waitForTimeout(500);

          // Submit and wait for results
          await Promise.all([
            page.waitForLoadState("networkidle"),
            page.click("#SearchAddressButton"),
          ]);

          // Wait for results to render
          await page.waitForSelector("main, #ContentPane", { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(2000);

          // Extract the results
          const url = page.url();
          const bodyText = await page.evaluate(() => {
            const main = document.querySelector("main, #ContentPane, .ballot-content, #content");
            return (main || document.body)?.innerText || "";
          });

          // Try structured extraction for ballot items
          const structured = await page.evaluate(() => {
            const races = Array.from(
              document.querySelectorAll(".contest, .ballot-item, [class*='contest'], .panel, .card")
            ).map((race) => ({
              office: (race.querySelector("h2, h3, h4, [class*='title'], .panel-heading")?.textContent?.trim()) ?? "",
              candidates: Array.from(
                race.querySelectorAll(".candidate, li, [class*='candidate'], td")
              ).map((c) => c.textContent?.trim() ?? "")
                .filter((c) => c.length > 2 && c.length < 100),
            })).filter(r => r.office.length > 3);

            return { races };
          });

          return {
            url,
            bodyText: bodyText?.substring(0, 4000) ?? "",
            races: structured.races,
          };
        `,
      });

      console.log(`[voter-info] Execute result:`, JSON.stringify(result).slice(0, 500));

      // Parse result — may be in result.result or result.stdout
      let rawContent = "";
      let races: Array<{ office: string; candidates: string[] }> = [];

      if (result.result) {
        try {
          const parsed = typeof result.result === "string" ? JSON.parse(result.result) : result.result;
          rawContent = (parsed as Record<string, unknown>).bodyText as string ?? "";
          races = ((parsed as Record<string, unknown>).races as Array<{ office: string; candidates: string[] }>) ?? [];
        } catch {
          rawContent = String(result.result);
        }
      }
      if (!rawContent && result.stdout) {
        rawContent = result.stdout;
      }

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
