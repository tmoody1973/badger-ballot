import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

const TOOLS: Record<string, { url: string; prompt: string }> = {
  "polling-place": {
    url: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-us/Find-My-Polling-Place. Fill the Street Address field with "${address}", City with "${city}", Zip with "${zip}". Click the Search button. Wait for results. Tell me the polling place name, address, hours, and ward number.`,
  } as unknown as { url: string; prompt: string },
  "ballot": {
    url: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-us/Whats-On-My-Ballot. Fill the Street Address field with "${address}", City with "${city}", Zip with "${zip}". Click the Search button. Wait for results. List every race and candidate on this ballot.`,
  } as unknown as { url: string; prompt: string },
  "registration": {
    url: "https://myvote.wi.gov/en-us/My-Voter-Info",
    prompt: (address: string, city: string, zip: string) =>
      `Go to https://myvote.wi.gov/en-us/My-Voter-Info. Search for voter at address "${address}, ${city}, WI ${zip}". Tell me the voter registration status.`,
  } as unknown as { url: string; prompt: string },
};

export async function POST(req: Request) {
  try {
    const { address, city, zip, action } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const resolvedCity = city || "Milwaukee";
    const resolvedZip = zip || "";
    const tool = action ?? "polling-place";
    const config = TOOLS[tool] ?? TOOLS["polling-place"];

    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    // Create a browser session
    const session = await firecrawl.browser({ ttl: 120, activityTtl: 60 });
    const sessionId = session.id;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Browser session failed", rawContent: "" });
    }

    console.log(`[voter-info] Browser session: ${sessionId}, tool: ${tool}`);

    try {
      // Build the prompt
      const promptFn = config.prompt as unknown as (a: string, c: string, z: string) => string;
      const prompt = promptFn(address, resolvedCity, resolvedZip);

      // Execute with node — navigate, fill, submit, extract in one go
      const result = await firecrawl.browserExecute(sessionId, {
        language: "node",
        code: `
          // Navigate
          await page.goto("${config.url}", { waitUntil: "networkidle" });
          await page.waitForTimeout(3000);

          // Fill form
          await page.fill("#SearchStreet", ${JSON.stringify(address)});
          await page.fill("#SearchCity", ${JSON.stringify(resolvedCity)});
          await page.fill("#SearchZip", ${JSON.stringify(resolvedZip)});
          await page.waitForTimeout(500);

          // Submit
          await page.click("#SearchAddressButton");
          await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
          await page.waitForTimeout(5000);

          // Extract visible text
          const text = await page.evaluate(() => {
            const main = document.querySelector("main") || document.body;
            return main.innerText;
          });

          console.log(text.substring(0, 4000));
        `,
      });

      const rawContent = result.stdout ?? result.result ?? "";
      console.log(`[voter-info] Got ${typeof rawContent === 'string' ? rawContent.length : 0} chars`);

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
          pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
          ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
          registration: "https://myvote.wi.gov/en-us/My-Voter-Info",
          absentee: "https://myvote.wi.gov/en-us/Vote-Absentee-By-Mail",
          trackBallot: "https://myvote.wi.gov/en-us/Track-My-Ballot",
        },
      });
    } finally {
      await firecrawl.deleteBrowser(sessionId).catch(() => {});
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[voter-info] Error:", message);

    return NextResponse.json({
      success: false,
      error: message,
      rawContent: "",
      nextElection: "Tuesday, April 7, 2026 — Spring Election",
      links: {
        pollingPlace: "https://myvote.wi.gov/en-us/Find-My-Polling-Place",
        ballot: "https://myvote.wi.gov/en-us/Whats-On-My-Ballot",
        registration: "https://myvote.wi.gov/en-us/My-Voter-Info",
      },
    });
  }
}
