import { NextResponse } from "next/server";
import { runBrowserAutomation } from "@/lib/kernel";
import { getFirecrawl } from "@/lib/firecrawl";

export async function POST(req: Request) {
  try {
    const { address, city, zip } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 },
      );
    }

    // kernel.sh navigates myvote.wi.gov
    const escapedAddress = address.replace(/'/g, "\\'");
    const escapedCity = city ? city.replace(/'/g, "\\'") : "";

    const playwrightCode = `
      // Navigate to MyVote WI polling place finder
      await page.goto('https://myvote.wi.gov/en-us/Find-My-Polling-Place');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Fill in the address field
      const addressSelectors = [
        'input[id*="Address" i]',
        'input[placeholder*="address" i]',
        'input[name*="address" i]',
        'input[type="text"]',
      ];

      let filled = false;
      for (const sel of addressSelectors) {
        const input = page.locator(sel).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          await input.fill('${escapedAddress}');
          filled = true;
          break;
        }
      }

      ${escapedCity ? `
      // Fill city if available
      const citySelectors = ['input[id*="City" i]', 'input[name*="city" i]', 'input[placeholder*="city" i]'];
      for (const sel of citySelectors) {
        const input = page.locator(sel).first();
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill('${escapedCity}');
          break;
        }
      }
      ` : ""}

      ${zip ? `
      // Fill zip if available
      const zipSelectors = ['input[id*="Zip" i]', 'input[name*="zip" i]', 'input[placeholder*="zip" i]'];
      for (const sel of zipSelectors) {
        const input = page.locator(sel).first();
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill('${zip}');
          break;
        }
      }
      ` : ""}

      // Click search/submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Search")',
        'button:has-text("Find")',
        'a:has-text("Search")',
      ];

      for (const sel of submitSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          break;
        }
      }

      await page.waitForTimeout(4000);

      const url = page.url();
      const bodyText = await page.locator('body').textContent();

      return {
        url,
        filled,
        textPreview: bodyText?.slice(0, 3000) ?? '',
      };
    `;

    console.log(`[voter-info] Starting kernel.sh automation for ${address}...`);
    const browserResult = await runBrowserAutomation(playwrightCode, 45);

    let content = "";
    let sourceUrl = "";

    if (browserResult.success) {
      const result = browserResult.result as {
        url?: string;
        textPreview?: string;
        filled?: boolean;
      };
      sourceUrl = result?.url ?? "";

      // Firecrawl scrapes the results page
      if (sourceUrl && sourceUrl !== "about:blank") {
        try {
          const firecrawl = getFirecrawl();
          const scrapeResult = await firecrawl.scrape(sourceUrl, {
            formats: ["markdown"],
          });
          content = scrapeResult.markdown?.slice(0, 4000) ?? "";
        } catch {
          content = result?.textPreview ?? "";
        }
      } else {
        content = result?.textPreview ?? "";
      }
    } else {
      // Fallback: direct the user to myvote.wi.gov
      content = `Unable to automate lookup. Please visit myvote.wi.gov directly to check your registration and find your polling place.`;
    }

    return NextResponse.json({
      address,
      city: city ?? null,
      zip: zip ?? null,
      source: browserResult.success ? "myvote.wi.gov" : "fallback",
      sourceUrl,
      content,
      kernelSuccess: browserResult.success,
      error: browserResult.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
