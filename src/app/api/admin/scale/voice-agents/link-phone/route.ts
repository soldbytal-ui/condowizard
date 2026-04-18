import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/link-phone
 * Registers a Twilio phone number with ElevenLabs for outbound AI calls.
 */
export async function POST(req: NextRequest) {
  try {
    const { elevenLabsApiKey, twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = await req.json();

    if (!elevenLabsApiKey || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const res = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers/create', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        label: 'Scale CondoWizard',
        phone_number: twilioPhoneNumber,
        provider: 'twilio',
        sid: twilioAccountSid,
        token: twilioAuthToken,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (error as Record<string, unknown>).detail || `Failed (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, phoneNumberId: data.phone_number_id || data.id, data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Link failed' }, { status: 500 });
  }
}
