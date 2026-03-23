/**
 * Fireplexity-pattern search: Firecrawl v2 + Groq synthesis
 * Based on github.com/firecrawl/fireplexity
 *
 * One pipeline: search → score → synthesize → structured output
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { CandidateType } from "@/types";
import { getQueryTemplates } from "./query-templates";

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
  const groqKey = process.env.GROQ_API_KEY;

  if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY not set");

  // Step 1: Firecrawl v2 search with full content (Fireplexity pattern)
  const templates = getQueryTemplates(candidateType, candidateName, topic);

  // Use Firecrawl v2 direct API call like Fireplexity does
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

  const allResults = await Promise.all(searchPromises);

  // Deduplicate by URL
  const seen = new Set<string>();
  const sources: Array<{ url: string; title: string; description: string; markdown: string }> = [];
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
    .slice(0, 10000);

  // Step 3: Synthesis — use Groq if available, fall back to Claude
  let synthesis = "";
  let structured: Record<string, unknown> = {};

  if (groqKey) {
    // Groq path — fast inference
    const groq = createGroq({ apiKey: groqKey });

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.

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

Rules: Only include data found in the search results. Extract dollar amounts aggressively. Use sourceUrls from the results. Return ONLY valid JSON.`,
      prompt: `Research: ${candidateName} (type: ${candidateType})\n\nSources:\n${context}`,
      temperature: 0,
      // @ts-expect-error -- AI SDK version compatibility
      maxTokens: 2000,
    });

    synthesis = result.text;
  } else {
    // Claude fallback
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic();

    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a nonpartisan civic research analyst. Return ONLY valid JSON with candidate data including votes, donors, factChecks, endorsements, platform, news, and summary.`,
      messages: [{ role: "user", content: `Research: ${candidateName} (type: ${candidateType})\n\nSources:\n${context}` }],
    });

    synthesis = result.content[0].type === "text" ? result.content[0].text : "{}";
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
