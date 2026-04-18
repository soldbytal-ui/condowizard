import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/calls/transcribe
 *
 * Downloads a Twilio recording, transcribes with Whisper, analyzes with Claude.
 */
export async function POST(req: NextRequest) {
  try {
    const { recordingUrl, twilioAccountSid, twilioAuthToken, openaiApiKey, anthropicApiKey, leadContext } = await req.json();

    if (!recordingUrl || !openaiApiKey) {
      return NextResponse.json({ error: 'Missing recording URL or OpenAI key' }, { status: 400 });
    }

    // Step 1: Download recording from Twilio
    const audioUrl = recordingUrl + '.mp3';
    const headers: Record<string, string> = {};
    if (twilioAccountSid && twilioAuthToken) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
    }
    const audioRes = await fetch(audioUrl, { headers });
    if (!audioRes.ok) {
      return NextResponse.json({ error: `Failed to download recording: ${audioRes.status}` }, { status: 502 });
    }
    const audioBuffer = await audioRes.arrayBuffer();

    // Step 2: Transcribe with Whisper
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'recording.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}` },
      body: formData,
    });
    if (!whisperRes.ok) {
      const err = await whisperRes.json().catch(() => ({}));
      return NextResponse.json({ error: `Whisper error: ${err.error?.message || whisperRes.status}` }, { status: 502 });
    }
    const transcription = await whisperRes.json();

    // Step 3: Analyze with Claude (if API key provided)
    let analysis = null;
    if (anthropicApiKey && transcription.text) {
      const analysisPrompt = `You are analyzing a phone call between a real estate agent (Tal Shelef, Sales Representative at Rare Real Estate Inc.) and a potential buyer.

Lead context:
${JSON.stringify(leadContext || {}, null, 2)}

Call transcript:
${transcription.text}

Provide a JSON response with:
{
  "summary": "2-3 sentence summary of what was discussed",
  "keyTopics": ["topic1", "topic2"],
  "actionItems": ["action1", "action2"],
  "sentiment": "positive" | "neutral" | "negative",
  "engagementLevel": "high" | "medium" | "low",
  "suggestedStatus": "contacted" | "showing" | "offer" | "lost" | null,
  "notableQuotes": ["quote1"],
  "redFlags": [],
  "opportunities": [],
  "followUpRecommendation": "email" | "call" | "sms" | "none",
  "followUpTiming": "today" | "tomorrow" | "this_week" | "next_week" | "month"
}

Return only valid JSON, no other text.`;

      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            messages: [{ role: 'user', content: analysisPrompt }],
          }),
        });
        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const text = claudeData.content?.[0]?.text || '';
          try { analysis = JSON.parse(text); } catch { analysis = { summary: text }; }
        }
      } catch {
        // Claude analysis is best-effort — don't fail the whole request
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.text || '',
      segments: transcription.segments || [],
      duration: transcription.duration || 0,
      analysis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
