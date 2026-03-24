import { NextResponse } from "next/server";
import { CANDIDATES } from "@/data/candidates";
import type { CandidateType } from "@/types";
import { fireplexitySearch } from "@/lib/fireplexity";
import { toOpenUILang } from "@/lib/openui/to-openui-lang";

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

    // Fireplexity pipeline: Firecrawl v2 search + Groq/Claude synthesis
    const result = await fireplexitySearch(candidateName, candidateType, topic);

    // Generate OpenUI Lang from structured data
    const openui = toOpenUILang({
      ...result.structured,
      source_count: result.sourceCount,
    } as Record<string, unknown>);

    return NextResponse.json({
      ...result.structured,
      source_count: result.sourceCount,
      sources: result.sources,
      openui,
      pass: 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
