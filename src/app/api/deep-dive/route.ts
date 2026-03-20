import { NextResponse } from "next/server";
import { getFirecrawl } from "@/lib/firecrawl";
import { getDeepDiveQueries } from "@/lib/query-templates";
import { synthesizeDeepDive } from "@/lib/synthesis";
import { CANDIDATES } from "@/data/candidates";

interface SearchSnippet {
  title: string;
  url: string;
  description: string;
}

export async function POST(req: Request) {
  try {
    const { candidate, angle } = await req.json();

    if (!candidate || !angle) {
      return NextResponse.json(
        { error: "candidate and angle are required" },
        { status: 400 },
      );
    }

    const candidateData = CANDIDATES.find(
      (c) =>
        c.id === candidate ||
        c.name.toLowerCase() === candidate.toLowerCase(),
    );

    const candidateName = candidateData?.name ?? candidate;

    const queries = getDeepDiveQueries(candidateName, angle);
    const firecrawl = getFirecrawl();

    const allResults = await Promise.all(
      queries.map(async (sq) => {
        try {
          const options: Record<string, unknown> = { limit: sq.limit };
          if (sq.tbs) {
            options.tbs = sq.tbs;
          }
          const result = await firecrawl.search(sq.query, options);
          const webResults = result.web ?? [];
          return webResults.map((r): SearchSnippet => ({
            title: ("title" in r ? r.title : "") ?? "",
            url: ("url" in r ? r.url : "") ?? "",
            description: ("description" in r ? r.description : "") ?? "",
          }));
        } catch (err) {
          console.error(`Firecrawl deep-dive error for "${sq.query}":`, err instanceof Error ? err.message : err);
          return [];
        }
      }),
    );

    // Deduplicate
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

    const searchResults = {
      official: allResults[0] ?? [],
      statements: allResults[1] ?? [],
      factchecks: allResults[2] ?? [],
    };

    const synthesis = await synthesizeDeepDive(
      candidateName,
      angle,
      searchResults,
    );

    return NextResponse.json({
      ...synthesis,
      source_count: deduped.length,
      sources: deduped.map((r) => ({ ...r, tier: "deep_dive" })),
      pass: 2,
      angle,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
