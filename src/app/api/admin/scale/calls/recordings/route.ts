import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/scale/calls/recordings?callSid=CA...
 *
 * Client polls this endpoint to check if a recording is ready for a given callSid.
 */
export async function GET(req: NextRequest) {
  const callSid = req.nextUrl.searchParams.get('callSid');
  if (!callSid) {
    return NextResponse.json({ error: 'Missing callSid' }, { status: 400 });
  }

  const recordings = globalThis.__scaleCallRecordings as Map<string, unknown> | undefined;
  const statuses = globalThis.__scaleCallStatuses as Map<string, unknown> | undefined;

  const recording = recordings?.get(callSid) || null;
  const status = statuses?.get(callSid) || null;

  return NextResponse.json({ recording, status });
}
