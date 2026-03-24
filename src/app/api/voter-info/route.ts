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
      await page.waitForTimeout(3000);

      // Find and fill the address field
      const addressInput = page.locator('input[id*="ddress"], input[placeholder*="address" i], input[name*="address" i], input[aria-label*="address" i]').first();
      if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addressInput.fill('${escapedAddress}');
      } else {
        // Try any visible text input
        const anyInput = page.locator('input[type="text"]:visible').first();
        if (await anyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await anyInput.fill('${escapedAddress}');
        }
      }

      await page.waitForTimeout(500);

      ${escapedCity ? `
      // Fill city
      const cityInput = page.locator('input[id*="ity"], input[placeholder*="city" i], input[name*="city" i]').first();
      if (await cityInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await cityInput.fill('${escapedCity}');
      }
      ` : ""}

      ${escapedZip ? `
      // Fill zip
      const zipInput = page.locator('input[id*="ip"], input[placeholder*="zip" i], input[name*="zip" i]').first();
      if (await zipInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await zipInput.fill('${escapedZip}');
      }
      ` : ""}

      // Submit
      const submitBtn = page.locator('button:has-text("Search"), button:has-text("Find"), input[type="submit"], button[type="submit"]').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(5000);

      // Extract the visible results
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText) || '';

      // Try to extract structured data
      let pollingPlace = '';
      let ballotInfo = '';
      let registrationInfo = '';

      // Look for polling place info
      const pollingSection = page.locator('text=Polling Place, text=Your polling, text=Where you vote').first();
      if (await pollingSection.isVisible({ timeout: 1000 }).catch(() => false)) {
        const parent = pollingSection.locator('..').first();
        pollingPlace = await parent.innerText().catch(() => '') || '';
      }

      // Look for ballot preview
      const ballotSection = page.locator('text=Ballot, text=Your ballot, text=On your ballot').first();
      if (await ballotSection.isVisible({ timeout: 1000 }).catch(() => false)) {
        const parent = ballotSection.locator('..').first();
        ballotInfo = await parent.innerText().catch(() => '') || '';
      }

      return {
        url,
        tool: '${tool}',
        address: '${escapedAddress}',
        pollingPlace: pollingPlace.slice(0, 1000),
        ballotInfo: ballotInfo.slice(0, 2000),
        registrationInfo: registrationInfo.slice(0, 500),
        bodyText: bodyText.slice(0, 3000),
      };
    `;

    console.log(`[voter-info] kernel.sh navigating myvote.wi.gov (${tool}) for ${address}...`);
    const browserResult = await runBrowserAutomation(playwrightCode, 45);

    if (browserResult.success) {
      const result = browserResult.result as {
        url?: string;
        tool?: string;
        address?: string;
        pollingPlace?: string;
        ballotInfo?: string;
        registrationInfo?: string;
        bodyText?: string;
      };

      return NextResponse.json({
        success: true,
        address,
        city,
        zip,
        tool,
        sourceUrl: result?.url ?? targetUrl,
        pollingPlace: result?.pollingPlace ?? null,
        ballotInfo: result?.ballotInfo ?? null,
        registrationInfo: result?.registrationInfo ?? null,
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
