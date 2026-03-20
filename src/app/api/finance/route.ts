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
    // Strategy: Use transactions page with searchTerm URL param — this shows actual contributions
    const lastName = candidateName.split(" ").pop() ?? candidateName;
    const searchUrl = `https://campaignfinance.wi.gov/browse-data/transactions?searchTerm=${encodeURIComponent(lastName)}&transactionType=Contribution`;

    const playwrightCode = `
      // Go directly to transactions filtered by candidate name + contributions
      await page.goto('${searchUrl}');
      await page.waitForLoadState('networkidle');
      // Wait for the dynamic table to render — this is a Next.js RSC app
      await page.waitForTimeout(8000);
      // Wait specifically for table rows with dollar amounts
      await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000); // Extra wait for data to populate

      // Extract VISIBLE text (innerText), not raw HTML/RSC chunks
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText) || '';

      // Get stats section if visible
      let stats = '';
      const statsSection = page.locator('text=Stats for this search').first();
      if (await statsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Try to expand stats
        await statsSection.click().catch(() => {});
        await page.waitForTimeout(1000);
        const statsParent = page.locator('[class*="stats"], [class*="Stats"]').first();
        stats = await statsParent.innerText().catch(() => '') || '';
      }

      // Get the contributions table
      const table = page.locator('table').first();
      let tableData = '';
      if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
        tableData = await table.innerText() || '';
      }

      // Also try the "Top 10 Donors" section if it exists
      let topDonors = '';
      const donorsSection = page.locator('text=Top 10').first();
      if (await donorsSection.isVisible({ timeout: 1000 }).catch(() => false)) {
        await donorsSection.click().catch(() => {});
        await page.waitForTimeout(1000);
        topDonors = await page.locator('[class*="chart"], [class*="list"]').first().innerText().catch(() => '') || '';
      }

      return {
        url,
        stats: stats.slice(0, 1000),
        tableData: tableData.slice(0, 3000),
        topDonors: topDonors.slice(0, 1000),
        textPreview: bodyText.slice(0, 2000),
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
        stats?: string;
        topDonors?: string;
      };
      sourceUrl = result?.url ?? "";

      // Step 2: Use kernel's extracted data (the site is a JS app — Firecrawl can't re-scrape it)
      // kernel.sh already rendered the JavaScript, so its text extraction is the source of truth
      const parts = [
        result?.stats ? `STATS:\n${result.stats}` : "",
        result?.topDonors ? `TOP DONORS:\n${result.topDonors}` : "",
        result?.tableData ? `TRANSACTIONS:\n${result.tableData}` : "",
      ].filter(Boolean);

      if (parts.length > 0) {
        firecrawlContent = `Source: Wisconsin Ethics Commission (campaignfinance.wi.gov)\nCandidate: ${candidateName}\n\n${parts.join("\n\n---\n\n")}`;
      } else {
        // kernel rendered the page but no structured data found
        // Fall back to Firecrawl search for news articles about this candidate's finance
        firecrawlContent = result?.textPreview || "";

        if (firecrawlContent.length < 500) {
          const firecrawl = getFirecrawl();
          const searchResult = await firecrawl.search(
            `"${candidateName}" campaign finance donors Wisconsin 2026`,
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
        }
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
