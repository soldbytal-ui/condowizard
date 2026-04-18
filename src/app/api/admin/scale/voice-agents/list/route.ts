import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/list
 * Fetches the list of ElevenLabs Conversational AI agents.
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    const res = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `ElevenLabs API error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'List failed' }, { status: 500 });
  }
}
