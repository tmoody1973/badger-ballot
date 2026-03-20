import { NextResponse } from "next/server";
import { getFirecrawl } from "@/lib/firecrawl";

export async function GET() {
  try {
    const hasKey = !!process.env.FIRECRAWL_API_KEY;
    const keyPrefix = process.env.FIRECRAWL_API_KEY?.slice(0, 6) ?? "MISSING";

    if (!hasKey) {
      return NextResponse.json({ error: "FIRECRAWL_API_KEY not set", keyPrefix });
    }

    const firecrawl = getFirecrawl();
    const result = await firecrawl.search("Tom Tiffany Wisconsin", { limit: 2 });
    const webResults = result.web ?? [];

    return NextResponse.json({
      keyPrefix,
      resultKeys: Object.keys(result),
      webCount: webResults.length,
      firstResult: webResults[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
