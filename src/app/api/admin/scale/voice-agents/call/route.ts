import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/call
 * Initiates an outbound call via Vapi with a specific assistant.
 */
export async function POST(req: NextRequest) {
  try {
    const { vapiPrivateKey, assistantId, leadPhone, leadContext, phoneNumberId } = await req.json();
    if (!vapiPrivateKey || !assistantId || !leadPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiPrivateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        ...(phoneNumberId ? { phoneNumberId } : {}),
        customer: {
          number: leadPhone,
          name: leadContext?.name || '',
        },
        assistantOverrides: {
          variableValues: {
            leadName: leadContext?.name || '',
            projectName: leadContext?.interest || '',
            neighborhood: leadContext?.neighborhood || 'Toronto',
            budget: leadContext?.budget || '',
          },
        },
      }),
    });

    const call = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: call.message || 'Call failed' }, { status: res.status });
    }
    return NextResponse.json({ success: true, call });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Call failed' }, { status: 500 });
  }
}
