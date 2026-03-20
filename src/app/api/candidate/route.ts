import { NextResponse } from "next/server";
import { CANDIDATES } from "@/data/candidates";

export async function POST(req: Request) {
  try {
    const { candidate } = await req.json();

    // If no candidate specified, return full directory
    if (!candidate) {
      return NextResponse.json({
        candidates: CANDIDATES,
        total: CANDIDATES.length,
      });
    }

    // Find specific candidate
    const found = CANDIDATES.find(
      (c) =>
        c.id === candidate ||
        c.name.toLowerCase() === candidate.toLowerCase(),
    );

    if (!found) {
      return NextResponse.json(
        { error: `Candidate "${candidate}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      candidate: found,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
