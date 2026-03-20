import FirecrawlApp from "@mendable/firecrawl-js";

let firecrawlInstance: FirecrawlApp | null = null;

export function getFirecrawl(): FirecrawlApp {
  if (!firecrawlInstance) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }
    firecrawlInstance = new FirecrawlApp({ apiKey });
  }
  return firecrawlInstance;
}
