import { NextResponse } from "next/server";
import { runBrowserAutomation } from "@/lib/kernel";

export async function POST(req: Request) {
  try {
    const { address, city, zip, action } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 },
      );
    }

    // Determine which myvote.wi.gov tool to use
    const tool = action ?? "polling-place"; // polling-place | ballot | registration
    const urls: Record<string, string> = {
      "polling-place": "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
      "ballot": "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
      "registration": "https://myvote.wi.gov/en-us/Register-To-Vote",
    };
    const targetUrl = urls[tool] ?? urls["polling-place"];

    const escapedAddress = address.replace(/'/g, "\\'");
    const escapedCity = city ? city.replace(/'/g, "\\'") : "";
    const escapedZip = zip ? zip.replace(/'/g, "\\'") : "";

    const playwrightCode = `
      await page.goto('${targetUrl}');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // myvote.wi.gov has specific form field IDs
      // #SearchStreet, #SearchCity, #SearchZip are the key fields
      await page.fill('#SearchStreet', '${escapedAddress}');
      await page.fill('#SearchCity', '${escapedCity || "Milwaukee"}');
      await page.fill('#SearchZip', '${escapedZip || ""}');

      await page.waitForTimeout(500);

      // Submit the form and wait for navigation (kernel.sh docs pattern)
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"], input[type="submit"]'),
      ]);

      // Extra wait for any AJAX content
      await page.waitForTimeout(3000);

      // Extract visible text from the results page
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText) || '';

      return {
        url,
        tool: '${tool}',
        address: '${escapedAddress}',
        bodyText: bodyText.slice(0, 4000),
      };
    `;

    console.log(`[voter-info] kernel.sh navigating myvote.wi.gov (${tool}) for ${address}...`);
    const browserResult = await runBrowserAutomation(playwrightCode, 45);

    if (browserResult.success) {
      const result = browserResult.result as {
        url?: string;
        bodyText?: string;
      };

      return NextResponse.json({
        success: true,
        address,
        city: city || "Milwaukee",
        zip,
        tool,
        sourceUrl: result?.url ?? targetUrl,
        rawContent: result?.bodyText ?? "",
        nextElection: "Tuesday, April 7, 2026 — Spring Election",
      });
    } else {
      // kernel.sh failed — provide helpful fallback
      return NextResponse.json({
        success: false,
        address,
        tool,
        sourceUrl: targetUrl,
        error: browserResult.error,
        rawContent: `We couldn't look up your info automatically. Visit myvote.wi.gov directly:\n\n• Find your polling place: https://myvote.wi.gov/en-US/FindMyPollingPlace\n• Preview your ballot: https://myvote.wi.gov/en-US/PreviewMyBallot\n• Check registration: https://myvote.wi.gov/en-US/RegisterToVote\n• Track your ballot: https://myvote.wi.gov/en-US/TrackMyBallot`,
        nextElection: "Tuesday, April 7, 2026 — Spring Election",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
