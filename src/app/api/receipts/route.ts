import { NextResponse } from "next/server";
import { getFirecrawl } from "@/lib/firecrawl";
import { getQueryTemplates } from "@/lib/query-templates";
import { synthesizeReceipts } from "@/lib/synthesis";
import { CANDIDATES } from "@/data/candidates";
import type { CandidateType } from "@/types";

interface SearchSnippet {
  title: string;
  url: string;
  description: string;
}

// Extract article body from markdown, skipping navigation/ads/footers
function extractArticleBody(markdown: string): string {
  // Remove common noise patterns
  let clean = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[.*?Skip.*?\]\(.*?\)/g, "") // Skip links
    .replace(/\[.*?Subscribe.*?\]\(.*?\)/gi, "") // Subscribe CTAs
    .replace(/\[.*?Newsletter.*?\]\(.*?\)/gi, "") // Newsletter CTAs
    .replace(/\[.*?Sign up.*?\]\(.*?\)/gi, "") // Sign up CTAs
    .replace(/#{1,6}\s*(?:Related|Share|Follow|Tags|Categories|Comments|About|Contact)\b[^\n]*/gi, "") // Section headers
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .trim();

  // Find the substantive content — look for paragraphs with dollar signs or candidate names
  const lines = clean.split("\n");
  const substantiveLines: string[] = [];
  let foundContent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip short lines (navigation, buttons)
    if (trimmed.length < 30 && !trimmed.startsWith("#")) continue;
    // Look for lines with dollar amounts or political content
    if (/\$[\d,]+|raised|donated|contributed|campaign|candidate|governor|senator|endorsement/i.test(trimmed)) {
      foundContent = true;
    }
    if (foundContent) {
      substantiveLines.push(trimmed);
    }
  }

  const body = substantiveLines.join("\n").slice(0, 4000);
  return body || clean.slice(0, 3000);
}

export async function POST(req: Request) {
  try {
    const { candidate, topic } = await req.json();

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

    const candidateType: CandidateType = candidateData?.type ?? "challenger";
    const candidateName = candidateData?.name ?? candidate;

    const templates = getQueryTemplates(candidateType, candidateName, topic);
    const firecrawl = getFirecrawl();

    // Run all searches in parallel with per-query limits and tbs
    // Second query (index 1) is always the finance query — use scrapeOptions for full content
    const allResults = await Promise.all(
      templates.queries.map(async (sq, index) => {
        try {
          const options: Record<string, unknown> = { limit: sq.limit };
          if (sq.tbs) {
            options.tbs = sq.tbs;
          }
          // For the finance query (index 1), get full markdown content
          if (index === 1) {
            options.scrapeOptions = { formats: ["markdown"] };
          }
          const result = await firecrawl.search(sq.query, options);
          const webResults = result.web ?? [];
          return webResults.map((r): SearchSnippet => {
            const markdown = "markdown" in r ? (r.markdown as string) : "";
            const description = ("description" in r ? r.description : "") ?? "";
            return {
              title: ("title" in r ? r.title : "") ?? "",
              url: ("url" in r ? r.url : "") ?? "",
              description: markdown
                ? extractArticleBody(markdown)
                : description,
            };
          });
        } catch (err) {
          console.error(`Firecrawl error for "${sq.query}":`, err instanceof Error ? err.message : err);
          return [];
        }
      }),
    );

    // Deduplicate by URL across all results
    const seen = new Set<string>();
    const deduped: SearchSnippet[] = [];
    for (const batch of allResults) {
      for (const r of batch) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          deduped.push(r);
        }
      }
    }

    // Split into categories for synthesis (first 3 queries map to official/statements/factchecks)
    const official = allResults[0] ?? [];
    const donors = allResults[1] ?? [];
    const factchecks = allResults[2] ?? [];
    const news = allResults[3] ?? [];
    const platform = allResults[4] ?? [];

    const searchResults = {
      official: [...official, ...platform],
      statements: [...donors, ...news],
      factchecks,
    };

    const synthesis = await synthesizeReceipts(
      candidateName,
      candidateType,
      searchResults,
    );

    return NextResponse.json({
      ...synthesis,
      source_count: deduped.length,
      sources: deduped.map((r) => ({ ...r, tier: "search" })),
      pass: 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
