import { NextResponse } from "next/server";

export async function GET() {
  try {
    const agentId = process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs credentials not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: { "xi-api-key": apiKey },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
