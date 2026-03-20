import { NextResponse } from "next/server";
import { runBrowserAutomation } from "@/lib/kernel";
import { getFirecrawl } from "@/lib/firecrawl";
import { CANDIDATES } from "@/data/candidates";

export async function POST(req: Request) {
  try {
    const { candidate } = await req.json();

    if (!candidate) {
      return NextResponse.json(
        { error: "candidate is required" },
        { status: 400 },
      );
    }

    const candidateData = CANDIDATES.find(
      (c) =>
        c.id === candidate ||
        c.name.toLowerCase() === candidate.toLowerCase(),
    );
    const candidateName = candidateData?.name ?? candidate;

    // Step 1: kernel.sh navigates the WI Campaign Finance site
    const playwrightCode = `
      // Navigate to WI Campaign Finance search
      await page.goto('https://campaignfinance.wi.gov/browse-data');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for search input and type candidate name
      const searchSelectors = [
        'input[type="search"]',
        'input[type="text"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="name" i]',
        'input[aria-label*="search" i]',
      ];

      let searched = false;
      for (const sel of searchSelectors) {
        const input = page.locator(sel).first();
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          await input.fill('${candidateName.replace(/'/g, "\\'")}');
          await page.keyboard.press('Enter');
          searched = true;
          break;
        }
      }

      if (!searched) {
        // Try clicking any search button/link first
        const searchLink = page.locator('a:has-text("Search"), button:has-text("Search")').first();
        if (await searchLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchLink.click();
          await page.waitForTimeout(2000);
          // Try again
          const input = page.locator('input[type="text"], input[type="search"]').first();
          if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
            await input.fill('${candidateName.replace(/'/g, "\\'")}');
            await page.keyboard.press('Enter');
            searched = true;
          }
        }
      }

      await page.waitForTimeout(3000);

      // Get results page URL and visible text
      const url = page.url();
      const bodyText = await page.locator('body').textContent();

      // Try to find any results table or data
      const tables = await page.locator('table').count();
      let tableData = '';
      if (tables > 0) {
        tableData = await page.locator('table').first().textContent() || '';
      }

      return {
        url,
        searched,
        hasTable: tables > 0,
        textPreview: bodyText?.slice(0, 3000) ?? '',
        tableData: tableData.slice(0, 2000),
      };
    `;

    console.log(`[finance] Starting kernel.sh automation for ${candidateName}...`);
    const browserResult = await runBrowserAutomation(playwrightCode, 45);

    let firecrawlContent = "";
    let sourceUrl = "";

    if (browserResult.success) {
      const result = browserResult.result as {
        url?: string;
        textPreview?: string;
        tableData?: string;
        hasTable?: boolean;
      };
      sourceUrl = result?.url ?? "";

      // Step 2: If we got a results URL, Firecrawl scrapes it for clean data
      if (sourceUrl && sourceUrl !== "about:blank") {
        try {
          const firecrawl = getFirecrawl();
          const scrapeResult = await firecrawl.scrape(sourceUrl, {
            formats: ["markdown"],
          });
          firecrawlContent = scrapeResult.markdown?.slice(0, 5000) ?? "";
        } catch {
          // Firecrawl scrape failed — use kernel's text extraction
          firecrawlContent = result?.tableData || result?.textPreview || "";
        }
      } else {
        firecrawlContent = result?.tableData || result?.textPreview || "";
      }
    } else {
      // kernel.sh failed — fall back to Firecrawl search + scrape
      console.log(`[finance] kernel.sh failed, falling back to Firecrawl search`);
      const firecrawl = getFirecrawl();

      // Search for finance articles
      const searchResult = await firecrawl.search(
        `"${candidateName}" campaign finance donors Wisconsin 2026 ethics commission`,
        { limit: 3, scrapeOptions: { formats: ["markdown"] } },
      );

      const webResults = searchResult.web ?? [];
      firecrawlContent = webResults
        .map((r) => {
          const md = "markdown" in r ? (r.markdown as string) : "";
          const desc = ("description" in r ? r.description : "") ?? "";
          return md ? md.slice(0, 2000) : desc;
        })
        .join("\n\n---\n\n");
      sourceUrl = webResults[0]
        ? ("url" in webResults[0] ? webResults[0].url : "") ?? ""
        : "";
    }

    return NextResponse.json({
      candidate: candidateName,
      source: browserResult.success ? "official_filing" : "firecrawl_fallback",
      sourceUrl,
      content: firecrawlContent,
      kernelSuccess: browserResult.success,
      error: browserResult.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
