import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable no-var */
declare global { var __scaleVoiceCallResults: Map<string, unknown> | undefined; }
/* eslint-enable no-var */

function getStore(): Map<string, unknown> {
  if (!globalThis.__scaleVoiceCallResults) globalThis.__scaleVoiceCallResults = new Map();
  return globalThis.__scaleVoiceCallResults;
}

/**
 * POST /api/admin/scale/voice-agents/webhook
 * Receives Vapi webhooks when calls end.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.message?.type || body.type || '';

    if (event === 'end-of-call-report' || event === 'call.ended') {
      const callId = body.message?.call?.id || body.call?.id || '';
      const store = getStore();
      store.set(callId, {
        callId,
        transcript: body.message?.transcript || body.transcript || '',
        duration: body.message?.call?.duration || body.call?.duration || 0,
        status: body.message?.call?.status || body.call?.status || 'completed',
        recordingUrl: body.message?.recordingUrl || body.recordingUrl || '',
        summary: body.message?.summary || '',
        timestamp: new Date().toISOString(),
      });
      // Keep only last 100
      if (store.size > 100) {
        const keys = Array.from(store.keys());
        for (let i = 0; i < keys.length - 100; i++) store.delete(keys[i]);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[voice-agents/webhook]', err);
    return NextResponse.json({ ok: true }); // Always 200 for webhooks
  }
}

/** GET to poll for call results */
export async function GET(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get('callId');
  if (!callId) return NextResponse.json({ result: null });
  const store = getStore();
  return NextResponse.json({ result: store.get(callId) || null });
}
