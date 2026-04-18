import { NextRequest } from 'next/server';

/**
 * POST/GET /api/admin/scale/calls/twiml
 *
 * Returns TwiML instructions: announce recording consent, then dial the lead.
 */
function handleTwiml(req: NextRequest): Response {
  const url = new URL(req.url);
  const leadPhone = url.searchParams.get('leadPhone') || '';
  const leadName = url.searchParams.get('leadName') || 'your contact';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This call is being recorded. Connecting you to ${escapeXml(leadName)} now.</Say>
  <Dial record="record-from-answer" recordingStatusCallback="${url.origin}/api/admin/scale/calls/recording-webhook">
    <Number>${escapeXml(leadPhone)}</Number>
  </Dial>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) { return handleTwiml(req); }
export async function GET(req: NextRequest) { return handleTwiml(req); }
