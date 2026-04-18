import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/call/outbound
 * Initiates an outbound call via ElevenLabs Conversational AI + Twilio.
 */
export async function POST(req: NextRequest) {
  try {
    const { elevenLabsApiKey, agentId, agentPhoneNumberId, leadPhone, leadContext } = await req.json();

    if (!elevenLabsApiKey || !agentId || !leadPhone) {
      return NextResponse.json({ error: 'Missing ElevenLabs key, agent ID, or lead phone' }, { status: 400 });
    }

    const res = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId || undefined,
        to_number: leadPhone,
        conversation_initiation_client_data: {
          dynamic_variables: {
            leadName: leadContext?.name || '',
            projectName: leadContext?.interest || 'CondoWizard pre-construction',
            neighborhood: leadContext?.neighborhood || 'Toronto',
            budget: leadContext?.budget || 'your price range',
            timeline: leadContext?.timeline || 'flexible timeline',
          },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (error as Record<string, unknown>).detail || (error as Record<string, unknown>).message || `ElevenLabs API error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      conversationId: data.conversation_id || data.id || '',
      callSid: data.callSid || data.conversation_id || '',
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Call failed' }, { status: 500 });
  }
}
