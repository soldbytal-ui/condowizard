import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/email/send
 *
 * Proxies email sending to the Resend API using the user's API key (BYOK).
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey, from, fromName, replyTo, to, subject, html, text } = await req.json();

    if (!apiKey || !to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields (apiKey, to, subject, html)' },
        { status: 400 }
      );
    }

    const fromAddress = fromName ? `${fromName} <${from}>` : from;
    const recipients = Array.isArray(to) ? to : [to];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        reply_to: replyTo || from,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Map common Resend errors to user-friendly messages
      const msg = data.message || data.name || 'Send failed';
      let userMessage = msg;
      if (res.status === 401 || res.status === 403) {
        userMessage = 'API key invalid or expired. Reconnect in Settings → Integrations.';
      } else if (msg.includes('not verified') || msg.includes('domain')) {
        userMessage = 'Sender domain not verified. Verify your domain at resend.com/domains.';
      } else if (res.status === 429) {
        userMessage = 'Rate limited. Try again in a minute. (Free tier: 100 emails/day)';
      }

      return NextResponse.json({ error: userMessage }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      messageId: data.id,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
