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
    // Strategy: Go to registrants page → search candidate name → click their profile → get contributions
    const escapedName = candidateName.replace(/'/g, "\\'");
    // Use last name for more reliable search
    const lastName = candidateName.split(" ").pop()?.replace(/'/g, "\\'") ?? escapedName;

    const playwrightCode = `
      // Navigate to registrants search page
      await page.goto('https://campaignfinance.wi.gov/browse-data/registrants');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find the search input — "Search by Registrant name, Candidate name, Treasurer..."
      const searchInput = page.locator('input[placeholder*="Search by"], input[type="search"], input[type="text"]').last();
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.click();
      await searchInput.fill('${lastName}');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      // Look for the candidate in the results table
      const rows = page.locator('table tbody tr, [role="row"]');
      const rowCount = await rows.count();

      let candidateUrl = '';
      let candidateInfo = '';

      // Find the row containing our candidate's name and click the link
      for (let i = 0; i < Math.min(rowCount, 20); i++) {
        const rowText = await rows.nth(i).textContent() || '';
        if (rowText.toLowerCase().includes('${lastName.toLowerCase()}')) {
          candidateInfo = rowText.slice(0, 500);

          // Try to find a clickable link in this row
          const link = rows.nth(i).locator('a').first();
          if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
            const href = await link.getAttribute('href');
            if (href) {
              candidateUrl = href.startsWith('http') ? href : 'https://campaignfinance.wi.gov' + href;
              await link.click();
              await page.waitForTimeout(3000);
              break;
            }
          }
          break;
        }
      }

      // Get the final page URL and content
      const finalUrl = page.url();
      const bodyText = await page.locator('body').textContent() || '';

      // Try to extract table data if present
      const tables = await page.locator('table').count();
      let tableData = '';
      if (tables > 0) {
        for (let t = 0; t < Math.min(tables, 3); t++) {
          const tbl = await page.locator('table').nth(t).textContent() || '';
          if (tbl.includes('$') || tbl.includes('Contribution') || tbl.includes('Amount')) {
            tableData += tbl.slice(0, 2000) + '\\n---\\n';
          }
        }
      }

      return {
        url: finalUrl,
        candidateUrl,
        candidateInfo,
        rowCount,
        hasTable: tables > 0,
        tableData: tableData.slice(0, 3000),
        textPreview: bodyText.slice(0, 3000),
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
