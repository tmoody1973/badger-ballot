import Anthropic from "@anthropic-ai/sdk";

let anthropicInstance: Anthropic | null = null;

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

Given search results about a candidate or ballot measure, extract and return structured JSON with the findings.

Return ONLY valid JSON matching this schema:
{
  "candidate": {
    "name": string,
    "party": string,
    "office": string,
    "currentRole": string,
    "keyFact": string,
    "type": string
  },
  "votes": [{ "bill": string, "vote": string, "context": string, "date": string?, "source": string }],
  "donors": { "donors": [{ "name": string, "amount": string, "type": string, "cycle": string }], "totalRaised": string?, "source": string } | null,
  "factChecks": [{ "claim": string, "rating": string, "source": string, "year": string }],
  "endorsements": [{ "endorser": string, "type": string, "context": string }],
  "platform": [{ "issue": string, "position": string, "source": string }],
  "summary": {
    "officialSources": number,
    "newsSources": number,
    "factCheckSources": number,
    "keyFinding": string
  }
}

Rules:
- Only include data you actually found in the search results. Do not fabricate.
- If a category has no data, use an empty array or null.
- For votes, use exact vote values: "Yea", "Nay", "Objected", "Abstain", "Sponsored", "Not Voting".
- For fact checks, use PolitiFact ratings when available: "True", "Mostly True", "Half True", "Mostly False", "False", "Pants on Fire".
- Always cite the source name (e.g., "Congress.gov", "OpenSecrets", "PolitiFact").
- Keep the keyFinding to one clear sentence.`;

export async function synthesizeReceipts(
  candidateName: string,
  candidateType: string,
  searchResults: SearchResults,
): Promise<Record<string, unknown>> {
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Research: ${candidateName} (type: ${candidateType})\n\nSearch results:\n${JSON.stringify(searchResults, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ??
    text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr.trim());
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
    max_tokens: 2000,
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

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ??
    text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr.trim());
}
