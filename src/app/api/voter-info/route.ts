import { NextResponse } from "next/server";

const TOOLS_CONFIG = {
  "polling-place": {
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-US/FindMyPollingPlace. Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for results. Tell me the polling place name, full address, polling hours, and ward number. Format with clear labels.`,
  },
  "ballot": {
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-US/PreviewMyBallot. Fill the Street Address field with "${address}". Fill the City field with "${city}". Fill the Zip field with "${zip}". Click the Search button. Wait for the sample ballot to fully load — you should see "SAMPLE BALLOT FOR MY NEXT ELECTION". List every race showing the office name and ALL candidate names. Format as a numbered list.`,
  },
  "registration": {
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-US/RegisterToVote and tell me how to register to vote at ${address}, ${city}, WI ${zip}. Include registration deadlines and requirements.`,
  },
};

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { address, city, zip, action } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const resolvedCity = city || "Milwaukee";
    const resolvedZip = zip || "";
    const tool = (action ?? "polling-place") as keyof typeof TOOLS_CONFIG;
    const config = TOOLS_CONFIG[tool] ?? TOOLS_CONFIG["polling-place"];

    const groqKey = process.env.GROQ_API_KEY;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    if (!groqKey || !firecrawlKey) {
      return NextResponse.json({ success: false, error: "Missing API keys" });
    }

    const prompt = config.prompt(address, resolvedCity, resolvedZip);

    console.log(`[voter-info] Using Groq + Firecrawl MCP for ${tool}`);

    // Groq Responses API with Firecrawl MCP — handles scrape+interact internally
    const response = await fetch("https://api.groq.com/api/openai/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        input: prompt,
        tools: [
          {
            server_label: "firecrawl",
            server_url: `https://mcp.firecrawl.dev/${firecrawlKey}/v2/mcp`,
            type: "mcp",
            require_approval: "never",
          },
        ],
        temperature: 0.1,
        top_p: 0.4,
      }),
      signal: AbortSignal.timeout(110000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[voter-info] Groq error: ${response.status} ${errorText.slice(0, 300)}`);
      return NextResponse.json({
        success: false,
        error: `Groq API error: ${response.status}`,
        rawContent: "",
        links: {
          pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
          ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot",
        },
      });
    }

    const result = await response.json();
    const rawContent = result.output_text ?? result.output ?? "";

    console.log(`[voter-info] Got ${typeof rawContent === 'string' ? rawContent.length : 0} chars from Groq+Firecrawl`);

    return NextResponse.json({
      success: true,
      address,
      city: resolvedCity,
      zip: resolvedZip,
      tool,
      sourceUrl: tool === "ballot"
        ? "https://myvote.wi.gov/en-US/PreviewMyBallot"
        : "https://myvote.wi.gov/en-US/FindMyPollingPlace",
      rawContent: typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      daysUntilElection: Math.max(0, Math.ceil((new Date("2026-04-07").getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      links: {
        pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
        ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot",
        registration: "https://myvote.wi.gov/en-US/RegisterToVote",
        absentee: "https://myvote.wi.gov/en-US/VoteAbsenteeByMail",
        trackBallot: "https://myvote.wi.gov/en-US/TrackMyBallot",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[voter-info] Error:", message);

    return NextResponse.json({
      success: false,
      error: message,
      rawContent: "",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: {
        pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
        ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot",
        registration: "https://myvote.wi.gov/en-US/RegisterToVote",
      },
    });
  }
}
