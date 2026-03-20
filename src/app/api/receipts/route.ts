import { NextResponse } from "next/server";
import { getFirecrawl } from "@/lib/firecrawl";
import { getQueryTemplates } from "@/lib/query-templates";
import { synthesizeReceipts } from "@/lib/synthesis";
import { CANDIDATES } from "@/data/candidates";
import type { CandidateType } from "@/types";

export async function POST(req: Request) {
  try {
    const { candidate, topic } = await req.json();

    if (!candidate) {
      return NextResponse.json(
        { error: "candidate is required" },
        { status: 400 },
      );
    }

    // Look up candidate info
    const candidateData = CANDIDATES.find(
      (c) =>
        c.id === candidate ||
        c.name.toLowerCase() === candidate.toLowerCase(),
    );

    const candidateType: CandidateType = candidateData?.type ?? "challenger";
    const candidateName = candidateData?.name ?? candidate;

    // Get query templates based on candidate type
    const templates = getQueryTemplates(candidateType, candidateName, topic);

    // Run parallel Firecrawl searches (Pass 1: no scrape, snippets only)
    const firecrawl = getFirecrawl();

    const searchPromises = templates.queries.map(async (query) => {
      try {
        const result = await firecrawl.search(query, { limit: 5 });
        const webResults = result.web ?? [];
        return webResults.map((r) => ({
          title: ("title" in r ? r.title : "") ?? "",
          url: ("url" in r ? r.url : "") ?? "",
          description: ("description" in r ? r.description : "") ?? "",
        }));
      } catch (err) {
        console.error("Firecrawl search error:", err instanceof Error ? err.message : err);
        return [];
      }
    });

    const [official, statements, factchecks] = await Promise.all(
      searchPromises,
    );

    const searchResults = { official, statements, factchecks };

    // Synthesize with Claude Sonnet
    const synthesis = await synthesizeReceipts(
      candidateName,
      candidateType,
      searchResults,
    );

    const sourceCount =
      (official?.length ?? 0) +
      (statements?.length ?? 0) +
      (factchecks?.length ?? 0);

    return NextResponse.json({
      ...synthesis,
      source_count: sourceCount,
      sources: [
        ...official.map((r) => ({ ...r, tier: "official" })),
        ...statements.map((r) => ({ ...r, tier: "statement" })),
        ...factchecks.map((r) => ({ ...r, tier: "factcheck" })),
      ],
      pass: 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
