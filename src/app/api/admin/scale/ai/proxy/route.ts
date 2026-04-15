import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/scale/ai/proxy
 *
 * Server-side fallback for the Scale Model Router. When the user's
 * localStorage has no API key (e.g. fresh install), Scale can route
 * Anthropic calls through here and we'll sign them with the server's
 * ANTHROPIC_API_KEY env var.
 *
 * Request:  { provider, model, system, messages, max_tokens? }
 * Response: { text } on success, { error } on failure.
 */
interface ProxyRequest {
  provider?: string;
  model: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  max_tokens?: number;
}

/**
 * GET — lightweight health probe. Tells the UI whether a server-side
 * ANTHROPIC_API_KEY is configured (without making a paid call).
 */
export async function GET() {
  return NextResponse.json({
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}

export async function POST(req: NextRequest) {
  let body: ProxyRequest;
  try {
    body = (await req.json()) as ProxyRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const provider = body.provider || 'anthropic';

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No Anthropic API key available. Set ANTHROPIC_API_KEY on the server or paste a key in Settings → AI Provider.',
        },
        { status: 401 }
      );
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: body.model,
          max_tokens: body.max_tokens ?? 4000,
          system: body.system,
          messages: body.messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data?.error?.message || `Anthropic API ${res.status}` },
          { status: res.status }
        );
      }
      const text = (data.content || [])
        .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text ?? '' : ''))
        .join('');
      return NextResponse.json({ text });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: `Server proxy does not support provider "${provider}". Add a key in Settings to use OpenRouter directly.` },
    { status: 400 }
  );
}
