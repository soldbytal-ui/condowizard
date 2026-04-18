import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/call/outbound
 * Initiates an outbound call via ElevenLabs Conversational AI + Twilio.
 *
 * Requires:
 * - elevenLabsApiKey: ElevenLabs API key
 * - elevenLabsPhoneNumberId: phone_number_id from link-phone step (NOT the raw Twilio number)
 * - agentId: ElevenLabs agent ID (from their dashboard or create API)
 * - leadPhone: lead's phone number (E.164 or raw digits)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { elevenLabsApiKey, elevenLabsPhoneNumberId, agentId, leadPhone, leadContext } = body;

    // Validate all required fields with clear error messages
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key missing. Go to Settings → Integrations → ElevenLabs.' }, { status: 400 });
    }
    if (!elevenLabsPhoneNumberId) {
      return NextResponse.json({ error: 'Phone number not linked to ElevenLabs. Go to Settings and click "Link phone number" under ElevenLabs.' }, { status: 400 });
    }
    if (!agentId) {
      return NextResponse.json({ error: 'No voice agent selected. Create or import an agent first.' }, { status: 400 });
    }
    if (!leadPhone) {
      return NextResponse.json({ error: 'Lead has no phone number.' }, { status: 400 });
    }

    // Ensure phone is in E.164 format
    const digits = leadPhone.replace(/\D/g, '');
    const formattedPhone = leadPhone.startsWith('+') ? leadPhone : `+1${digits}`;

    const res = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: elevenLabsPhoneNumberId,
        to_number: formattedPhone,
        conversation_initiation_client_data: {
          dynamic_variables: {
            leadName: leadContext?.name || 'there',
            projectName: leadContext?.interest || 'CondoWizard pre-construction',
            neighborhood: leadContext?.neighborhood || 'Toronto',
            budget: leadContext?.budget || 'your price range',
            timeline: leadContext?.timeline || 'flexible',
          },
        },
      }),
    });

    const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));

    if (!res.ok) {
      // Extract the most useful error message from ElevenLabs response
      const detail = data.detail;
      const errorMsg = typeof detail === 'string' ? detail
        : typeof detail === 'object' && detail?.message ? detail.message
        : data.error || data.message || `ElevenLabs API error (${res.status})`;

      return NextResponse.json({ error: errorMsg, status: res.status }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      conversationId: data.conversation_id || data.id || '',
      callSid: data.callSid || data.conversation_id || '',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error initiating call';
    console.error('[voice-agents/call/outbound]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
