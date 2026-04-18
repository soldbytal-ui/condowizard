import { NextRequest } from 'next/server';

/* eslint-disable no-var */
declare global { var __scaleCallStatuses: Map<string, CallStatus> | undefined; }
/* eslint-enable no-var */

interface CallStatus {
  callSid: string;
  status: string;
  duration: number;
  leadId: string;
  timestamp: string;
}

function getStore(): Map<string, CallStatus> {
  if (!globalThis.__scaleCallStatuses) {
    globalThis.__scaleCallStatuses = new Map();
  }
  return globalThis.__scaleCallStatuses;
}

/**
 * POST /api/admin/scale/calls/status-webhook
 *
 * Twilio posts call status updates here (initiated, ringing, answered, completed).
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId') || '';

    const formData = await req.formData();
    const callSid = (formData.get('CallSid') as string) || '';
    const callStatus = (formData.get('CallStatus') as string) || '';
    const callDuration = (formData.get('CallDuration') as string) || '0';

    if (callSid) {
      getStore().set(callSid, {
        callSid,
        status: callStatus,
        duration: parseInt(callDuration, 10),
        leadId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[status-webhook]', err);
  }

  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
