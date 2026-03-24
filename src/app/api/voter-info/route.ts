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
      "polling-place": "https://myvote.wi.gov/en-US/FindMyPollingPlace",
      "ballot": "https://myvote.wi.gov/en-US/PreviewMyBallot",
      "registration": "https://myvote.wi.gov/en-US/RegisterToVote",
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

      // Click the search button - "Find My Polling Place"
      const submitBtn = page.locator('button:has-text("Find My Polling Place"), button:has-text("Search"), input[type="submit"]').first();
      await submitBtn.click();

      // Wait for results to load
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');

      // Extract the visible results
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
