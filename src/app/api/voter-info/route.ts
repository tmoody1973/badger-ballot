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
      await page.waitForTimeout(3000);

      // Fill form fields using JavaScript directly for reliability
      await page.evaluate((addr, city, zip) => {
        const streetEl = document.getElementById('SearchStreet');
        const cityEl = document.getElementById('SearchCity');
        const zipEl = document.getElementById('SearchZip');
        if (streetEl) { (streetEl as HTMLInputElement).value = addr; streetEl.dispatchEvent(new Event('input', {bubbles: true})); }
        if (cityEl) { (cityEl as HTMLInputElement).value = city; cityEl.dispatchEvent(new Event('input', {bubbles: true})); }
        if (zipEl) { (zipEl as HTMLInputElement).value = zip; zipEl.dispatchEvent(new Event('input', {bubbles: true})); }
      }, '${escapedAddress}', '${escapedCity || "Milwaukee"}', '${escapedZip || "53206"}');

      await page.waitForTimeout(1000);

      // Submit the form via JavaScript
      await page.evaluate(() => {
        const form = document.getElementById('Form') || document.querySelector('form');
        if (form) (form as HTMLFormElement).submit();
      });

      // Wait for navigation
      await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000);

      // Get the final URL and page text
      const url = page.url();
      const bodyText = await page.evaluate(() => {
        return document.body ? document.body.innerText : '';
      }) || '';

      // Also get the HTML for debugging
      const html = await page.evaluate(() => {
        return document.body ? document.body.innerHTML.substring(0, 2000) : '';
      }) || '';

      return {
        url,
        tool: '${tool}',
        address: '${escapedAddress}',
        bodyText: bodyText.substring(0, 4000),
        htmlPreview: html,
      };
    `;

    console.log(`[voter-info] kernel.sh navigating myvote.wi.gov (${tool}) for ${address}...`);
    const browserResult = await runBrowserAutomation(playwrightCode, 45);

    if (browserResult.success) {
      const result = browserResult.result as {
        url?: string;
        bodyText?: string;
        htmlPreview?: string;
      };

      return NextResponse.json({
        success: true,
        address,
        city: city || "Milwaukee",
        zip,
        tool,
        sourceUrl: result?.url ?? targetUrl,
        rawContent: result?.bodyText ?? "",
        htmlPreview: result?.htmlPreview ?? "",
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
