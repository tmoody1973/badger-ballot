import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getDeepDiveQueries, KNOWN_FINANCE_URLS } from "@/lib/query-templates";
import { CANDIDATES } from "@/data/candidates";

const FC_BASE = "https://api.firecrawl.dev/v2";

function fcHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { candidate, angle } = await req.json();

    if (!candidate || !angle) {
      return NextResponse.json({ error: "candidate and angle are required" }, { status: 400 });
    }

    const candidateData = CANDIDATES.find(
      (c) => c.id === candidate || c.name.toLowerCase() === candidate.toLowerCase(),
    );
    const candidateName = candidateData?.name ?? candidate;
    const candidateId = candidateData?.id ?? candidate.toLowerCase().replace(/\s+/g, "-");

    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!firecrawlKey) {
      return NextResponse.json({ error: "FIRECRAWL_API_KEY not set" }, { status: 500 });
    }

    const isFinance = /donor|money|fund|pac|contribut|finance|raised/i.test(angle);

    console.log(`[deep-dive] ${candidateName} / ${angle} (finance: ${isFinance})`);

    // === Run search queries + optional finance URL scrape in parallel ===
    const queries = getDeepDiveQueries(candidateName, angle);

    const searchPromises = queries.map(async (sq) => {
      try {
        const response = await fetch(`${FC_BASE}/search`, {
          method: "POST",
          headers: fcHeaders(firecrawlKey),
          body: JSON.stringify({
            query: sq.query,
            sources: ["web", "news"],
            limit: sq.limit,
            ...(sq.tbs ? { tbs: sq.tbs } : {}),
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) return [];
        const result = await response.json();
        const web = result.data?.web ?? [];
        const news = result.data?.news ?? [];
        return [
          ...web.map((r: Record<string, unknown>) => ({
            url: (r.url as string) ?? "",
            title: (r.title as string) ?? "",
            description: (r.description as string) ?? "",
            markdown: (r.markdown as string) ?? "",
          })),
          ...news.map((r: Record<string, unknown>) => ({
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

    // Scrape the known finance URL if this is a donor deep dive
    const financePromise = isFinance && KNOWN_FINANCE_URLS[candidateId]
      ? (async () => {
          try {
            console.log(`[deep-dive] Scraping finance URL: ${KNOWN_FINANCE_URLS[candidateId]}`);
            const response = await fetch(`${FC_BASE}/scrape`, {
              method: "POST",
              headers: fcHeaders(firecrawlKey),
              body: JSON.stringify({
                url: KNOWN_FINANCE_URLS[candidateId],
                formats: ["markdown"],
                timeout: 20000,
              }),
              signal: AbortSignal.timeout(25_000),
            });
            if (!response.ok) return null;
            const result = await response.json();
            const markdown = result?.data?.markdown ?? "";
            console.log(`[deep-dive] Finance scrape: ${markdown.length} chars`);
            return {
              url: KNOWN_FINANCE_URLS[candidateId],
              title: `${candidateName} — Donor Records (Transparency USA)`,
              description: "",
              markdown: markdown.slice(0, 5000),
            };
          } catch {
            return null;
          }
        })()
      : Promise.resolve(null);

    const [allSearchResults, financeResult] = await Promise.all([
      Promise.all(searchPromises),
      financePromise,
    ]);

    // Deduplicate by URL
    const seen = new Set<string>();
    const sources: Array<{ url: string; title: string; description: string; markdown: string }> = [];

    // Finance data first (highest priority for donor deep dives)
    if (financeResult && financeResult.url) {
      seen.add(financeResult.url);
      sources.push(financeResult);
    }

    for (const batch of allSearchResults) {
      for (const r of batch) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          sources.push(r);
        }
      }
    }

    console.log(`[deep-dive] ${sources.length} sources (${financeResult ? "with" : "without"} finance scrape)`);

    // Build context for synthesis
    const context = sources
      .map((s, i) => {
        const content = s.markdown || s.description || "";
        return `[${i + 1}] ${s.title}\nURL: ${s.url}\n${content.slice(0, 2000)}`;
      })
      .join("\n\n---\n\n")
      .slice(0, 12000);

    // Synthesize with Groq (fast) or Claude (fallback)
    let structured: Record<string, unknown> = {};

    if (groqKey) {
      const groq = createGroq({ apiKey: groqKey });
      const result = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.
This is a DEEP DIVE on "${angle}" for ${candidateName}. Go deeper than a surface scan.

For donor/finance deep dives:
- Extract EVERY dollar amount, donor name, PAC contribution you can find
- Include individual donors, PACs, party committees, self-funding
- Note contribution limits: $20,000/election for WI state races, $3,300/election for federal
- Flag any large or notable contributions

For news/policy deep dives:
- Extract specific dates, quotes, and details
- Include context on why each finding matters
- Note any contradictions or pattern changes over time

Return ONLY valid JSON with this schema:
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

Rules: Only include data found in the search results. Be aggressive extracting dollar amounts. Return ONLY valid JSON.`,
        prompt: `Deep dive: ${candidateName} — "${angle}"\n\nSources:\n${context}`,
        temperature: 0,
        // @ts-expect-error -- AI SDK version compatibility
        maxTokens: 3000,
      });

      try {
        const text = result.text;
        const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
        if (jsonMatch) {
          structured = JSON.parse(jsonMatch[1].trim());
        } else {
          const firstBrace = text.indexOf("{");
          const lastBrace = text.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            structured = JSON.parse(text.slice(firstBrace, lastBrace + 1));
          }
        }
      } catch {
        structured = {};
      }
    } else {
      // Claude fallback
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic();
      const result = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: `You are a nonpartisan civic research analyst. Deep dive on "${angle}" for ${candidateName}. Return ONLY valid JSON with candidate, votes, donors, factChecks, endorsements, platform, news, summary.`,
        messages: [{ role: "user", content: `Deep dive sources:\n${context}` }],
      });
      const text = result.content[0].type === "text" ? result.content[0].text : "{}";
      try {
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          structured = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        }
      } catch {
        structured = {};
      }
    }

    return NextResponse.json({
      ...structured,
      source_count: sources.length,
      sources: sources.map((s) => ({ url: s.url, title: s.title, description: s.description, tier: "deep_dive" })),
      pass: 2,
      angle,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[deep-dive] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
