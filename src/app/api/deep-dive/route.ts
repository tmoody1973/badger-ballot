import { NextResponse } from "next/server";
import { getFirecrawl } from "@/lib/firecrawl";
import { getDeepDiveQueries } from "@/lib/query-templates";
import { synthesizeDeepDive } from "@/lib/synthesis";
import { CANDIDATES } from "@/data/candidates";

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

    // Get focused queries for the deep dive
    const queries = getDeepDiveQueries(candidateName, angle);

    const firecrawl = getFirecrawl();

    // Run 1-2 focused searches
    const searchPromises = queries.map(async (query) => {
      try {
        const result = await firecrawl.search(query, { limit: 5 });
        const webResults = result.web ?? [];
        return webResults.map((r) => ({
          title: ("title" in r ? r.title : "") ?? "",
          url: ("url" in r ? r.url : "") ?? "",
          description: ("description" in r ? r.description : "") ?? "",
        }));
      } catch {
        return [];
      }
    });

    const results = await Promise.all(searchPromises);

    const searchResults = {
      official: results[0] ?? [],
      statements: results[1] ?? [],
      factchecks: [],
    };

    // Synthesize with Claude Sonnet (deep dive prompt)
    const synthesis = await synthesizeDeepDive(
      candidateName,
      angle,
      searchResults,
    );

    const sourceCount = results.reduce((sum, r) => sum + r.length, 0);

    return NextResponse.json({
      ...synthesis,
      source_count: sourceCount,
      sources: results
        .flat()
        .map((r) => ({ ...r, tier: "deep_dive" })),
      pass: 2,
      angle,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
