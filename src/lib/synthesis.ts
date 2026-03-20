import Anthropic from "@anthropic-ai/sdk";

let anthropicInstance: Anthropic | null = null;

function extractJSON(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // ignore
  }

  // Try extracting from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // ignore
    }
  }

  // Try finding JSON object in the text (first { to last })
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // ignore
    }
  }

  console.error("Failed to extract JSON from synthesis response:", text.slice(0, 200));
  return {};
}

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic();
  }
  return anthropicInstance;
}

interface SearchSnippet {
  readonly title: string;
  readonly url: string;
  readonly description: string;
}

interface SearchResults {
  readonly official: readonly SearchSnippet[];
  readonly statements: readonly SearchSnippet[];
  readonly factchecks: readonly SearchSnippet[];
}

const SYNTHESIS_SYSTEM_PROMPT = `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.

Given search results about a candidate or ballot measure, you MUST extract findings across ALL available categories. Be thorough — search results often contain information about multiple categories mixed together. A news article might mention both a vote AND a donor. A fact-check page might also reference endorsements.

IMPORTANT: Populate EVERY category where you can find ANY relevant data. Do not leave categories empty if there are clues in the search results.

CAMPAIGN FINANCE EXTRACTION — BE AGGRESSIVE:
- Scan EVERY search result for dollar amounts ($), "raised", "donated", "contributed", "PAC", "fundraising", donor names
- Extract individual donor names with amounts: "Diane Hendricks ($20,000)" → donor entry
- Extract PAC/union contributions: "UFCW Active Ballot Club: $32,000" → donor entry
- Extract total fundraising: "$2.1 million raised" → totalRaised
- Look in news articles, not just finance databases — Wisconsin Examiner, WPR, WisPolitics often have specific dollar figures embedded in articles
- For Wisconsin state candidates (governor, AG, Supreme Court), the contribution limit is $20,000 per election
- If an article mentions "Soros donated the maximum" that means $20,000

Return ONLY valid JSON matching this schema:
{
  "candidate": {
    "name": string,
    "party": string (full name: "Republican", "Democrat", etc.),
    "office": string,
    "currentRole": string,
    "keyFact": string (most newsworthy single fact),
    "type": string ("incumbent", "challenger", "open_seat", "measure")
  },
  "votes": [{ "bill": string, "vote": string, "context": string (2-3 sentences explaining significance), "date": string?, "source": string, "sourceUrl": string }],
  "donors": {
    "donors": [{ "name": string, "amount": string (use "$X,XXX" format), "type": string ("PAC", "Individual", "Party", "Self-funded", etc.), "cycle": string }],
    "totalRaised": string? (use "$X.XM" or "$XXX,XXX" format),
    "source": string,
    "sourceUrl": string
  },
  "factChecks": [{ "claim": string (the actual claim text), "rating": string, "source": string, "sourceUrl": string, "year": string }],
  "endorsements": [{ "endorser": string, "type": string ("Organization", "Individual", "Union", "Newspaper", etc.), "context": string, "sourceUrl": string }],
  "platform": [{ "issue": string, "position": string (specific stance, not vague), "source": string, "sourceUrl": string }],
  "news": [{ "headline": string (actual news headline), "source": string (publication name), "sourceUrl": string, "date": string?, "summary": string (2-3 sentence summary of the article) }],
  "summary": {
    "officialSources": number,
    "newsSources": number,
    "factCheckSources": number,
    "keyFinding": string (the single most important finding, one clear sentence)
  }
}

Rules:
- THOROUGHLY scan ALL search results for data in EVERY category. Do not stop after finding one category.
- Extract financial data aggressively: fundraising totals, individual donations, PAC contributions, spending figures.
- For votes, use exact values: "Yea", "Nay", "Objected", "Abstain", "Sponsored", "Not Voting", "Co-sponsored".
- For fact checks, use PolitiFact ratings when available: "True", "Mostly True", "Half True", "Mostly False", "False", "Pants on Fire".
- Include 2-3 items per category minimum when data exists. More is better.
- ALWAYS include the sourceUrl from the search results. Map each finding to its source URL.
- Context fields should explain WHY a finding matters, not just state it.
- NEVER fabricate or infer data. Only include findings you can directly trace to a search result. If a search result mentions "$15,000 from Club for Growth" that counts. If no search result mentions donors at all, leave donors as null.
- It is BETTER to have empty categories than to fill them with guesses or hallucinated data. Empty categories are fine — they tell the user "we didn't find this type of data."
- For news: Use the actual article title as the headline. Only include articles that appear in the search results.
- For platform: Extract specific policy positions only when stated in search results. Be specific — "Supports $15 minimum wage" not "Supports workers." If no positions are found, use an empty array.`;

export async function synthesizeReceipts(
  candidateName: string,
  candidateType: string,
  searchResults: SearchResults,
): Promise<Record<string, unknown>> {
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2500,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Research: ${candidateName} (type: ${candidateType})\n\nSearch results (summarized):\n${JSON.stringify(searchResults, null, 1).slice(0, 12000)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  return extractJSON(text);
}

const DEEP_DIVE_SYSTEM_PROMPT = `You are a nonpartisan civic research analyst for Wisconsin 2026 elections.

Given detailed search results about a specific angle on a candidate or measure, extract findings as structured JSON.

Return the same schema as a receipts response, but focus deeply on the specific angle requested. Include more detail in the relevant category.

Return ONLY valid JSON. Do not fabricate data.`;

export async function synthesizeDeepDive(
  candidateName: string,
  angle: string,
  searchResults: SearchResults,
): Promise<Record<string, unknown>> {
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: DEEP_DIVE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Deep dive: ${candidateName} on "${angle}"\n\nSearch results:\n${JSON.stringify(searchResults, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  return extractJSON(text);
}
