import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/voice-agents/create
 * Creates a Vapi assistant with the given configuration.
 */
export async function POST(req: NextRequest) {
  try {
    const { config, vapiPrivateKey } = await req.json();
    if (!vapiPrivateKey || !config?.name) {
      return NextResponse.json({ error: 'Missing Vapi key or agent name' }, { status: 400 });
    }

    const res = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiPrivateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          systemPrompt: config.systemPrompt || '',
          temperature: 0.7,
          maxTokens: 300,
        },
        voice: {
          provider: '11labs',
          voiceId: config.voiceId || 'EXAVITQu4vr4xnSDxMaL', // default: Sarah
          stability: 0.5,
          similarityBoost: 0.75,
        },
        firstMessage: config.firstMessage || "Hi, this is Tal's AI assistant calling from CondoWizard. Do you have a quick moment?",
        endCallMessage: config.endCallMessage || 'Thanks so much for your time. Have a great day!',
        endCallPhrases: ['goodbye', 'bye', 'talk later', 'thanks bye', 'have a good one'],
        silenceTimeoutSeconds: 15,
        maxDurationSeconds: config.maxDuration || 300,
        recordingEnabled: true,
        backgroundSound: 'office',
        backchannelingEnabled: true,
        responseDelaySeconds: 0.4,
        llmRequestDelaySeconds: 0.1,
      }),
    });

    const assistant = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: assistant.message || 'Failed to create assistant' }, { status: res.status });
    }
    return NextResponse.json({ success: true, assistant });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Create failed' }, { status: 500 });
  }
}
