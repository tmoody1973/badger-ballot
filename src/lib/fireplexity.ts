/**
 * Fireplexity-pattern search: Firecrawl v2 + Claude synthesis
 * Based on github.com/firecrawl/fireplexity
 *
 * Pipeline: search + finance scrape → score → synthesize → structured output
 */

import type { CandidateType } from "@/types";
import { getQueryTemplates, KNOWN_FINANCE_URLS } from "./query-templates";

// Content selection — adapted from Fireplexity's content-selection.ts
function selectRelevantContent(content: string, query: string, maxLength = 2000): string {
  const paragraphs = content.split("\n\n").filter((p) => p.trim());

  const intro = paragraphs.slice(0, 2).join("\n\n");

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !["what", "when", "where", "which", "how", "why", "does", "with", "from", "about", "their", "this", "that"].includes(w));

  const relevantParagraphs = paragraphs
    .slice(2, -2)
    .map((paragraph, index) => ({
      text: paragraph,
      score: keywords.filter((kw) => paragraph.toLowerCase().includes(kw)).length,
      index,
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map((p) => p.text);

  const conclusion = paragraphs.length > 2 ? paragraphs[paragraphs.length - 1] : "";

  let result = intro;
  if (relevantParagraphs.length > 0) {
    result += "\n\n" + relevantParagraphs.join("\n\n");
  }
  if (conclusion) {
    result += "\n\n" + conclusion;
  }

  return result.length > maxLength ? result.slice(0, maxLength - 3) + "..." : result;
}

interface FireplexityResult {
  candidate: string;
  synthesis: string;
  structured: Record<string, unknown>;
  sources: Array<{ url: string; title: string; description: string }>;
  sourceCount: number;
}

export async function fireplexitySearch(
  candidateName: string,
  candidateType: CandidateType,
  topic?: string,
): Promise<FireplexityResult> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY not set");

  const FC_BASE = "https://api.firecrawl.dev/v2";
  const fcHeaders = { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" };

  // Step 1: Firecrawl v2 search + finance URL scrape in parallel
  const templates = getQueryTemplates(candidateType, candidateName, topic);
  const candidateId = candidateName.split(" ").pop()?.toLowerCase() ?? "";

  // Scrape Transparency USA donor page if we have a URL
  const financePromise = KNOWN_FINANCE_URLS[candidateId]
    ? (async () => {
        try {
          const res = await fetch(`${FC_BASE}/scrape`, {
            method: "POST",
            headers: fcHeaders,
            body: JSON.stringify({ url: KNOWN_FINANCE_URLS[candidateId], formats: ["markdown"], timeout: 20000 }),
            signal: AbortSignal.timeout(25_000),
          });
          if (!res.ok) return null;
          const result = await res.json();
          const md = result?.data?.markdown ?? "";
          // Only use if the page has substantial donor data (tables, dollar amounts)
          const hasDonorData = md.length > 500 && (md.includes("$") || md.toLowerCase().includes("contribution"));
          return hasDonorData ? {
            url: KNOWN_FINANCE_URLS[candidateId],
            title: `${candidateName} — Donor Records (Transparency USA)`,
            description: "", markdown: md.slice(0, 4000),
          } : null;
        } catch { return null; }
      })()
    : Promise.resolve(null);

  const searchPromises = templates.queries.map(async (sq) => {
    try {
      const response = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: sq.query,
          sources: ["web", "news"],
          limit: sq.limit,
          scrapeOptions: {
            formats: ["markdown"],
            onlyMainContent: true,
          },
          ...(sq.tbs ? { tbs: sq.tbs } : {}),
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) return [];

      const result = await response.json();
      const data = result.data || {};
      const webResults = data.web || [];
      const newsResults = data.news || [];

      return [
        ...webResults.map((r: Record<string, unknown>) => ({
          url: (r.url as string) ?? "",
          title: (r.title as string) ?? "",
          description: (r.description as string) ?? "",
          markdown: (r.markdown as string) ?? "",
        })),
        ...newsResults.map((r: Record<string, unknown>) => ({
          url: (r.url as string) ?? "",
          title: (r.title as string) ?? "",
          description: (r.snippet as string) ?? (r.description as string) ?? "",
          markdown: "",
        })),
      ];
    } catch {
      return [];
    }
  });

  const [allResults, financeResult] = await Promise.all([
    Promise.all(searchPromises),
    financePromise,
  ]);

  // Deduplicate by URL — finance data first (highest priority)
  const seen = new Set<string>();
  const sources: Array<{ url: string; title: string; description: string; markdown: string }> = [];
  if (financeResult && financeResult.url) {
    seen.add(financeResult.url);
    sources.push(financeResult);
  }
  for (const batch of allResults) {
    for (const r of batch) {
      if (r.url && !seen.has(r.url)) {
        seen.add(r.url);
        sources.push(r);
      }
    }
  }

  // Step 2: Content scoring (Fireplexity pattern)
  const query = `${candidateName} ${topic ?? ""} Wisconsin 2026`;
  const context = sources
    .map((source, index) => {
      const content = source.markdown || source.description || "";
      const relevant = selectRelevantContent(content, query, 1500);
      return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevant}`;
    })
    .join("\n\n---\n\n")
    .slice(0, 12000);

  // Step 3: Synthesis — Claude Haiku (fast + reliable structured extraction)
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic();

  const synthesisPrompt = `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.

Given search results about a candidate, return a JSON object with these fields:
{
  "candidate": { "name": string, "party": string, "office": string, "currentRole": string, "keyFact": string, "type": string },
  "votes": [{ "bill": string, "vote": string, "context": string, "date": string?, "source": string, "sourceUrl": string }],
  "donors": { "donors": [{ "name": string, "amount": string, "type": string, "cycle": string }], "totalRaised": string?, "source": string, "sourceUrl": string } | null,
  "factChecks": [{ "claim": string, "rating": string, "source": string, "sourceUrl": string, "year": string }],
  "endorsements": [{ "endorser": string, "type": string, "context": string, "sourceUrl": string }],
  "platform": [{ "issue": string, "position": string, "source": string, "sourceUrl": string }],
  "news": [{ "headline": string, "source": string, "sourceUrl": string, "date": string?, "summary": string }],
  "summary": { "officialSources": number, "newsSources": number, "factCheckSources": number, "keyFinding": string }
}

CRITICAL RULES:
- Extract EVERY dollar amount, donor name, PAC, and financial figure you find.
- For votes, use: "Yea", "Nay", "Not Voting", "Sponsored", "Co-sponsored".
- Include 2-3+ items per category when data exists.
- ALWAYS include sourceUrl from the search results.
- Context fields should explain WHY a finding matters.
- Return ONLY valid JSON. No markdown, no explanation.`;

  let synthesis = "";
  let structured: Record<string, unknown> = {};

  const result = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: synthesisPrompt,
    messages: [{ role: "user", content: `Research: ${candidateName} (type: ${candidateType})\n\nSources:\n${context}` }],
  });

  synthesis = result.content[0].type === "text" ? result.content[0].text : "{}";
  console.log(`[fireplexity] Synthesis: ${synthesis.length} chars, stop: ${result.stop_reason}, content_types: ${result.content.map((c: { type: string }) => c.type).join(",")}`);
  if (synthesis.length === 0) {
    console.error("[fireplexity] EMPTY synthesis! Result:", JSON.stringify(result).slice(0, 500));
  }

  // Parse JSON from synthesis
  try {
    const jsonMatch = synthesis.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonMatch) {
      structured = JSON.parse(jsonMatch[1].trim());
    } else {
      const firstBrace = synthesis.indexOf("{");
      const lastBrace = synthesis.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        structured = JSON.parse(synthesis.slice(firstBrace, lastBrace + 1));
      }
    }
  } catch {
    structured = {};
  }

  return {
    candidate: candidateName,
    synthesis,
    structured,
    sources: sources.map((s) => ({ url: s.url, title: s.title, description: s.description })),
    sourceCount: sources.length,
  };
}
