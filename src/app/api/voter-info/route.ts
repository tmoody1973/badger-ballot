import { NextResponse } from "next/server";

// Three-step architecture: Scrape → Code (Playwright) → Claude parse
// Based on ASP.NET WebForms quirks of myvote.wi.gov:
// - pressSequentially() to fire keyboard events (not fill())
// - .blur() after each field to trigger ASP.NET validation
// - force: true on click to bypass invisible span wrappers
// - waitForLoadState('networkidle') for postback results
// - Extract document.body.innerText in code, parse with Claude separately

const TOOLS_CONFIG = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-US/FindMyPollingPlace",
    claudePrompt: `Extract the polling place information from this text. Return ONLY valid JSON:
{"name": "...", "address": "...", "hours": "...", "ward": "...", "election": "..."}
If no polling place was found, return {"error": "No results found"}`,
  },
  "ballot": {
    url: "https://myvote.wi.gov/en-US/PreviewMyBallot",
    claudePrompt: `Extract every race and candidate from this ballot text. Return ONLY valid JSON:
{"races": [{"office": "...", "candidates": ["...", "..."]}]}
Include EVERY race. If no ballot was found, return {"error": "No results found"}`,
  },
  "registration": {
    url: "https://myvote.wi.gov/en-US/RegisterToVote",
    claudePrompt: null,
  },
};

function buildPlaywrightCode(address: string, city: string, zip: string, waitMs: number): string {
  // Escape single quotes in address/city for the JS string
  const safeAddr = address.replace(/'/g, "\\'");
  const safeCity = city.replace(/'/g, "\\'");

  return `
    // Wait for form to render
    const addrInput = page.getByLabel('Street Address*');
    await addrInput.waitFor({ state: 'visible', timeout: 15000 });

    // Clear and type with pressSequentially — fires ASP.NET keyboard events
    await addrInput.click();
    await addrInput.fill('');
    await addrInput.pressSequentially('${safeAddr}', { delay: 30 });
    await addrInput.evaluate(el => el.dispatchEvent(new Event('blur')));

    const cityInput = page.getByLabel('City*');
    await cityInput.click();
    await cityInput.fill('');
    await cityInput.pressSequentially('${safeCity}', { delay: 30 });
    await cityInput.evaluate(el => el.dispatchEvent(new Event('blur')));

    const zipInput = page.getByLabel('Zip*');
    await zipInput.click();
    await zipInput.fill('');
    await zipInput.pressSequentially('${zip}', { delay: 30 });
    await zipInput.evaluate(el => el.dispatchEvent(new Event('blur')));

    // Wait for ASP.NET validation to enable the button
    await page.waitForTimeout(1500);

    // Click Search with force:true — bypasses invisible ASP.NET span wrappers
    const searchBtn = page.getByRole('button', { name: 'Search' });
    await searchBtn.click({ force: true });

    // Wait for postback results to fully load
    await page.waitForLoadState('networkidle', { timeout: ${waitMs} });
    await page.waitForTimeout(2000);

    // Extract raw page text — deterministic, no AI interpretation
    const content = await page.evaluate(() => document.body.innerText);
    JSON.stringify({ content });
  `;
}

const FC_BASE = "https://api.firecrawl.dev/v2";

function fcHeaders(key: string) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

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

    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
      return NextResponse.json({ success: false, error: "FIRECRAWL_API_KEY not set" }, { status: 500 });
    }

    console.log(`[voter-info] Tool: ${tool}, loading ${config.url}...`);

    // === Step 1: Scrape — load page + bypass Cloudflare ===
    const scrapeRes = await fetch(`${FC_BASE}/scrape`, {
      method: "POST",
      headers: fcHeaders(firecrawlKey),
      body: JSON.stringify({ url: config.url, formats: ["markdown"], timeout: 45000 }),
      signal: AbortSignal.timeout(50000),
    });

    if (!scrapeRes.ok) {
      console.error(`[voter-info] Scrape failed: ${scrapeRes.status}`);
      return NextResponse.json({ success: false, error: "Could not load page", rawContent: "" }, { status: 502 });
    }

    const scrapeId = (await scrapeRes.json())?.data?.metadata?.scrapeId;
    if (!scrapeId) {
      return NextResponse.json({ success: false, error: "No browser session", rawContent: "" }, { status: 502 });
    }

    console.log(`[voter-info] Session: ${scrapeId}`);

    let rawContent = "";

    if (tool === "registration") {
      // Registration — no form, just a prompt
      const promptRes = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
        method: "POST",
        headers: fcHeaders(firecrawlKey),
        body: JSON.stringify({
          prompt: `Tell me how to register to vote at ${address}, ${resolvedCity}, WI ${resolvedZip}. Include online, by mail, and in-person options.`,
          timeout: 45,
        }),
        signal: AbortSignal.timeout(55000),
      });
      if (promptRes.ok) {
        const result = await promptRes.json();
        rawContent = result?.output || result?.stdout || "";
      }
    } else {
      // === Step 2: Code — deterministic Playwright fills form + extracts text ===
      const waitMs = tool === "ballot" ? 45000 : 30000;
      const codeTimeout = tool === "ballot" ? 90 : 60;
      const code = buildPlaywrightCode(address, resolvedCity, resolvedZip, waitMs);

      console.log(`[voter-info] Executing Playwright code (timeout: ${codeTimeout}s)...`);

      const codeRes = await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, {
        method: "POST",
        headers: fcHeaders(firecrawlKey),
        body: JSON.stringify({ code, language: "node", timeout: codeTimeout }),
        signal: AbortSignal.timeout((codeTimeout + 15) * 1000),
      });

      if (!codeRes.ok) {
        const err = await codeRes.text().catch(() => "");
        console.error(`[voter-info] Code failed: ${codeRes.status} ${err.slice(0, 200)}`);
        await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});
        return NextResponse.json({ success: false, error: "Could not fill form", rawContent: "" }, { status: 502 });
      }

      const codeResult = await codeRes.json();
      console.log(`[voter-info] Code done. exit: ${codeResult?.exitCode}, stdout: ${(codeResult?.stdout ?? "").length}c, result: ${(codeResult?.result ?? "").length}c`);

      // Extract the page text from the code result
      let pageText = "";
      try {
        // The code returns JSON.stringify({ content }) as the last expression
        const parsed = JSON.parse(codeResult?.result || "{}");
        pageText = parsed.content || "";
      } catch {
        // Fall back to stdout
        pageText = codeResult?.stdout || "";
      }

      if (!pageText && codeResult?.result) {
        pageText = codeResult.result;
      }

      console.log(`[voter-info] Page text: ${pageText.length} chars`);

      // === Step 3: Claude parses raw text into structured data ===
      if (pageText && config.claudePrompt) {
        try {
          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const anthropic = new Anthropic();

          const claudeRes = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: config.claudePrompt,
            messages: [{ role: "user", content: `Extract data from this page text:\n\n${pageText.slice(0, 8000)}` }],
          });

          const claudeText = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "";
          console.log(`[voter-info] Claude parsed: ${claudeText.length} chars: ${claudeText.slice(0, 200)}`);

          // Extract JSON from Claude response (may be wrapped in ```json ... ```)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsedJson: any = {};
          try {
            const jsonMatch = claudeText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
            if (jsonMatch) {
              parsedJson = JSON.parse(jsonMatch[1].trim());
            } else {
              parsedJson = JSON.parse(claudeText.trim());
            }
          } catch {
            console.error("[voter-info] Failed to parse Claude JSON:", claudeText.slice(0, 100));
          }

          // For polling place, format as labeled text for the card parser
          if (tool === "polling-place") {
            try {
              const data = parsedJson;
              if (data.name) {
                rawContent = `Name: ${data.name}\nAddress: ${data.address}\nHours: ${data.hours}\nWard: ${data.ward}\nElection: ${data.election}`;
              } else {
                rawContent = pageText.slice(0, 4000);
              }
            } catch {
              rawContent = pageText.slice(0, 4000);
            }
          } else if (tool === "ballot") {
            try {
              const data = parsedJson;
              if (data.races?.length) {
                rawContent = data.races
                  .map((r: { office: string; candidates: string[] }, i: number) =>
                    `${i + 1}. ${r.office}: ${r.candidates.join(", ")}`)
                  .join("\n");
              } else {
                rawContent = pageText.slice(0, 4000);
              }
            } catch {
              rawContent = pageText.slice(0, 4000);
            }
          }
        } catch (claudeErr) {
          console.error("[voter-info] Claude parse failed:", claudeErr);
          rawContent = pageText.slice(0, 4000);
        }
      } else {
        rawContent = pageText.slice(0, 4000);
      }
    }

    // Cleanup session
    await fetch(`${FC_BASE}/scrape/${scrapeId}/interact`, { method: "DELETE", headers: { Authorization: `Bearer ${firecrawlKey}` } }).catch(() => {});

    console.log(`[voter-info] Done. Output: ${rawContent.length} chars`);

    return NextResponse.json({
      success: true,
      address,
      city: resolvedCity,
      zip: resolvedZip,
      tool,
      sourceUrl: config.url,
      rawContent: typeof rawContent === "string" ? rawContent.slice(0, 4000) : String(rawContent).slice(0, 4000),
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
      success: false, error: message, rawContent: "",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: { pollingPlace: "https://myvote.wi.gov/en-US/FindMyPollingPlace", ballot: "https://myvote.wi.gov/en-US/PreviewMyBallot", registration: "https://myvote.wi.gov/en-US/RegisterToVote" },
    }, { status: 500 });
  }
}
