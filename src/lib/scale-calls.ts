/**
 * Scale Calls — client-side helpers for Twilio voice calling.
 * Handles call initiation, status polling, transcription, and analysis.
 */

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  userPhone: string;
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  error?: string;
}

export interface RecordingData {
  recordingUrl: string;
  recordingSid: string;
  duration: number;
  callSid: string;
}

export interface CallStatus {
  callSid: string;
  status: string;
  duration: number;
}

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
  duration?: number;
  analysis?: CallAnalysis;
  error?: string;
}

export interface CallAnalysis {
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementLevel: 'high' | 'medium' | 'low';
  suggestedStatus: string | null;
  notableQuotes: string[];
  redFlags: string[];
  opportunities: string[];
  followUpRecommendation: 'email' | 'call' | 'sms' | 'none';
  followUpTiming: string;
}

/** Get Twilio config from localStorage. */
export function getTwilioConfig(): TwilioConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('scale-integrations');
    if (!raw) return null;
    const store = JSON.parse(raw);
    const t = store.twilio;
    if (!t?.accountSid || !t?.authToken || !t?.phoneNumber || !t?.userPhone) return null;
    return { accountSid: t.accountSid, authToken: t.authToken, phoneNumber: t.phoneNumber, userPhone: t.userPhone };
  } catch { return null; }
}

/** Check if Twilio is connected. */
export function isTwilioConnected(): boolean {
  return getTwilioConfig() !== null;
}

/** Get OpenAI API key from localStorage. */
function getOpenAIKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('scale-integrations');
    if (!raw) return null;
    return JSON.parse(raw).openai?.apiKey || null;
  } catch { return null; }
}

/** Get Anthropic API key from Scale model config. */
function getAnthropicKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('scale-model-config');
    if (!raw) return null;
    return JSON.parse(raw).apiKey || null;
  } catch { return null; }
}

/** Initiate a call via the API proxy. */
export async function initiateCall(leadPhone: string, leadId: string, leadName: string): Promise<CallResult> {
  const config = getTwilioConfig();
  if (!config) return { success: false, error: 'Twilio not connected. Go to Settings → Integrations.' };

  try {
    const res = await fetch('/api/admin/scale/calls/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        leadPhone,
        leadId,
        leadName,
      }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Call failed' };
  }
}

/** Poll for call status and recording. */
export async function pollCallStatus(callSid: string): Promise<{ recording: RecordingData | null; status: CallStatus | null }> {
  try {
    const res = await fetch(`/api/admin/scale/calls/recordings?callSid=${callSid}`);
    return await res.json();
  } catch {
    return { recording: null, status: null };
  }
}

/** Transcribe and analyze a recording. */
export async function transcribeRecording(
  recordingUrl: string,
  leadContext: Record<string, unknown>
): Promise<TranscriptionResult> {
  const config = getTwilioConfig();
  const openaiKey = getOpenAIKey();
  const anthropicKey = getAnthropicKey();

  if (!openaiKey) {
    return { success: false, error: 'OpenAI (Whisper) not connected. Add your API key in Settings → Integrations.' };
  }

  try {
    const res = await fetch('/api/admin/scale/calls/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordingUrl,
        twilioAccountSid: config?.accountSid,
        twilioAuthToken: config?.authToken,
        openaiApiKey: openaiKey,
        anthropicApiKey: anthropicKey,
        leadContext,
      }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Transcription failed' };
  }
}

/** Format seconds as "Xm Ys". */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
