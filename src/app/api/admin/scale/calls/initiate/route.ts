import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

/**
 * POST /api/admin/scale/calls/initiate
 *
 * Initiates a Twilio call: dials the user's phone first, then connects to the lead.
 * Both sides are recorded. Recording is sent to the recording-webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const { accountSid, authToken, phoneNumber, userPhone, leadPhone, leadId, leadName } = await req.json();

    if (!accountSid || !authToken || !userPhone || !leadPhone) {
      return NextResponse.json({ error: 'Missing credentials or phone numbers' }, { status: 400 });
    }

    const client = twilio(accountSid, authToken);
    const baseUrl = getBaseUrl(req);

    const call = await client.calls.create({
      to: userPhone,
      from: phoneNumber,
      url: `${baseUrl}/api/admin/scale/calls/twiml?leadPhone=${encodeURIComponent(leadPhone)}&leadName=${encodeURIComponent(leadName || 'your contact')}`,
      record: true,
      recordingStatusCallback: `${baseUrl}/api/admin/scale/calls/recording-webhook?leadId=${encodeURIComponent(leadId || '')}`,
      recordingStatusCallbackMethod: 'POST',
      statusCallback: `${baseUrl}/api/admin/scale/calls/status-webhook?leadId=${encodeURIComponent(leadId || '')}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Call initiation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}
