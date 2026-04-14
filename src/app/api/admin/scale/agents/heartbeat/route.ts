import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/scale/agents/heartbeat
 *
 * Designed to be called by Vercel Cron. Today the agent roster + task
 * queue live in the user's browser (localStorage), so the real execution
 * happens client-side via `runHeartbeat` in src/lib/scale-agents.ts. This
 * endpoint documents the contract + serves as the stub a future
 * server-resident agent store will hang off.
 *
 * When we move agents to Postgres we'll replace the empty agents[] with
 * a Prisma query and then call runHeartbeat for each due agent.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const expected = process.env.SCALE_AGENT_CRON_SECRET;

  // If a secret is configured, enforce it. Otherwise allow (dev).
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    mode: 'stub',
    message:
      'Agent heartbeats currently run in the browser from /admin/scale/agents. ' +
      'When agents are moved to server storage this endpoint will iterate the active roster and run runHeartbeat() for each due agent.',
    checkedAt: new Date().toISOString(),
    agentsDue: [],
    heartbeatsRun: 0,
    heartbeatsFailed: 0,
  });
}
