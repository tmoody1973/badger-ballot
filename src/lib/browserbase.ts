import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright-core";

interface BallotRace {
  office: string;
  candidates: string[];
  type: "candidate" | "referendum" | "judicial";
}

interface BallotResults {
  address: string;
  electionDate?: string;
  races: BallotRace[];
  rawText?: string;
}

interface PollingPlaceResults {
  address: string;
  pollingPlace?: string;
  pollingAddress?: string;
  hours?: string;
  rawText?: string;
}

function getBrowserbase(): Browserbase {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY not set");
  return new Browserbase({ apiKey });
}

export async function getWhatsOnMyBallot(address: {
  street: string;
  unit?: string;
  city: string;
  zip: string;
}): Promise<BallotResults> {
  const bb = getBrowserbase();

  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      viewport: { width: 1280, height: 900 },
    },
  });

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    await page.goto("https://myvote.wi.gov/en-us/Whats-On-My-Ballot", {
      waitUntil: "networkidle",
    });

    await page.fill("#SearchStreet", address.street);
    if (address.unit) {
      await page.fill("#SearchUnit", address.unit);
    }
    await page.fill("#SearchCity", address.city);
    await page.fill("#SearchZip", address.zip);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click("#SearchAddressButton"),
    ]);

    const results = await page.evaluate(() => {
      const races: { office: string; candidates: string[]; type: string }[] = [];

      const raceContainers = document.querySelectorAll(
        ".ballot-item, .contest, [class*='race'], [class*='contest'], .panel, .card"
      );

      raceContainers.forEach((container) => {
        const office = container.querySelector("h2, h3, h4, .office-title, .panel-heading")?.textContent?.trim() ?? "";
        const candidateEls = container.querySelectorAll(".candidate, li, .candidate-name, td");
        const candidates = Array.from(candidateEls)
          .map((el) => el.textContent?.trim() ?? "")
          .filter((t) => t.length > 2 && t.length < 100);

        if (office && office.length > 3) {
          races.push({ office, candidates, type: "candidate" });
        }
      });

      const rawText = (
        document.querySelector("main, #ContentPane, .ballot-content, #content") ??
        document.body
      )?.textContent?.trim();

      return { races, rawText: rawText?.substring(0, 4000) };
    });

    const electionDate = await page
      .$eval(".election-date, [class*='election']", (el) => el.textContent?.trim())
      .catch(() => undefined);

    return {
      address: `${address.street}, ${address.city}, WI ${address.zip}`,
      electionDate: electionDate ?? "Tuesday, April 7, 2026 — Spring Election",
      races: results.races as BallotRace[],
      rawText: results.rawText ?? undefined,
    };
  } finally {
    await browser.close();
  }
}

export async function getPollingPlace(address: {
  street: string;
  city: string;
  zip: string;
}): Promise<PollingPlaceResults> {
  const bb = getBrowserbase();

  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      viewport: { width: 1280, height: 900 },
    },
  });

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    await page.goto("https://myvote.wi.gov/en-us/Find-My-Polling-Place", {
      waitUntil: "networkidle",
    });

    await page.fill("#SearchStreet", address.street);
    await page.fill("#SearchCity", address.city);
    await page.fill("#SearchZip", address.zip);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.click("#SearchAddressButton"),
    ]);

    // Extract polling place info
    const rawText = await page.evaluate(() => {
      return (
        document.querySelector("main, #ContentPane, #content") ??
        document.body
      )?.textContent?.trim()?.substring(0, 4000) ?? "";
    });

    return {
      address: `${address.street}, ${address.city}, WI ${address.zip}`,
      rawText,
    };
  } finally {
    await browser.close();
  }
}
