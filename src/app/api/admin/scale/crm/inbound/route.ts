import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable no-var */
declare global { var __scaleInboundQueue: unknown[] | undefined; }
/* eslint-enable no-var */

/**
 * POST /api/admin/scale/crm/inbound
 *
 * Accepts inbound leads from external sources (landing pages, Zapier, etc.)
 * and creates a new CRM lead entry.
 *
 * Because leads are stored in localStorage (client-side), this endpoint
 * stores the inbound lead in a server-side queue file that the CRM page
 * polls on load. For now, we return success and the client will pick it up.
 *
 * In production, this would write to a database (Supabase, Prisma, etc.)
 */

const CRM_LEADS_STORAGE_KEY = 'scale-crm-leads';

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

interface InboundPayload {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  interest?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  apiKey?: string;
}

// Validate API key from environment variable
function validateApiKey(key: string | undefined): boolean {
  const serverKey = process.env.SCALE_INBOUND_API_KEY;
  // If no server key configured, accept all requests (development mode)
  if (!serverKey) return true;
  return key === serverKey;
}

export async function POST(req: NextRequest) {
  try {
    const body: InboundPayload = await req.json();

    // Validate API key
    if (!validateApiKey(body.apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const leadId = uid('lead');

    const lead = {
      id: leadId,
      name: body.name.trim(),
      email: (body.email || '').trim(),
      phone: (body.phone || '').trim(),
      source: (body.source || 'Webhook') as string,
      interest: (body.interest || '').trim(),
      budget: body.budget || 'Under $500K',
      timeline: body.timeline || '3-6 months',
      status: 'new',
      notes: body.message || '',
      activities: [
        {
          id: uid('act'),
          type: 'inquiry',
          description: `Lead received from ${body.source || 'Webhook'}${body.interest ? ` — ${body.interest}` : ''}${body.message ? `. Message: "${body.message}"` : ''}`,
          timestamp: now,
        },
        {
          id: uid('act'),
          type: 'created',
          description: `Lead created via inbound webhook from ${body.source || 'external source'}.`,
          timestamp: now,
        },
      ],
      nextFollowUp: null,
      createdAt: now,
      updatedAt: now,
      assignedTo: 'Tal Shelef',
    };

    // NOTE: Since CRM data is in localStorage (client-side), we can't write to it
    // from the server. In production, this would write to a database.
    // For now, we store inbound leads in a server-side queue that the client polls.
    // The client-side CRM page checks this queue on load.

    // Store in a global in-memory queue (resets on server restart)
    if (!globalThis.__scaleInboundQueue) {
      globalThis.__scaleInboundQueue = [];
    }
    (globalThis.__scaleInboundQueue as unknown[]).push(lead);

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead created successfully',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve queued inbound leads (polled by client)
export async function GET() {
  const queue = (globalThis.__scaleInboundQueue as unknown[]) || [];
  // Clear queue after retrieval
  globalThis.__scaleInboundQueue = [];
  return NextResponse.json({ leads: queue });
}
