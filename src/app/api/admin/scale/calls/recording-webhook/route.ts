import { NextRequest } from 'next/server';

/* eslint-disable no-var */
declare global { var __scaleCallRecordings: Map<string, RecordingData> | undefined; }
/* eslint-enable no-var */

interface RecordingData {
  recordingUrl: string;
  recordingSid: string;
  duration: number;
  callSid: string;
  leadId: string;
  timestamp: string;
}

function getStore(): Map<string, RecordingData> {
  if (!globalThis.__scaleCallRecordings) {
    globalThis.__scaleCallRecordings = new Map();
  }
  return globalThis.__scaleCallRecordings;
}

/**
 * POST /api/admin/scale/calls/recording-webhook
 *
 * Twilio sends recording metadata here when a call recording is ready.
 * We store it in an in-memory map so the client can poll for it.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId') || '';

    const formData = await req.formData();
    const recordingUrl = (formData.get('RecordingUrl') as string) || '';
    const recordingSid = (formData.get('RecordingSid') as string) || '';
    const recordingDuration = (formData.get('RecordingDuration') as string) || '0';
    const callSid = (formData.get('CallSid') as string) || '';

    if (recordingUrl) {
      const store = getStore();
      store.set(callSid, {
        recordingUrl,
        recordingSid,
        duration: parseInt(recordingDuration, 10),
        callSid,
        leadId,
        timestamp: new Date().toISOString(),
      });

      // TODO: Move to Supabase once schema is added
      // Clean up old entries (keep last 50)
      if (store.size > 50) {
        const keys = Array.from(store.keys());
        for (let i = 0; i < keys.length - 50; i++) store.delete(keys[i]);
      }
    }
  } catch (err) {
    console.error('[recording-webhook]', err);
  }

  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
