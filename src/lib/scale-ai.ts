/**
 * Scale AI — shared wrapper used by the Campaigns generator and Agent Brain chat.
 * Routes requests to either the Anthropic Messages API or an OpenAI-compatible
 * chat/completions endpoint (OpenRouter) based on the provider the user picked
 * in /admin/scale/settings.
 */

export type ScaleProvider = 'anthropic' | 'openrouter' | 'openrouter_free';

export interface ScaleModelConfig {
  provider: ScaleProvider;
  model: string;
  apiKey: string;
}

export interface ScaleChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const SCALE_CONFIG_STORAGE_KEY = 'scale-model-config';
export const SCALE_BRAIN_STORAGE_KEY = 'scale-agent-brain';

export const DEFAULT_SCALE_CONFIG: ScaleModelConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: '',
};

export function loadScaleConfig(): ScaleModelConfig {
  if (typeof window === 'undefined') return DEFAULT_SCALE_CONFIG;
  try {
    const raw = window.localStorage.getItem(SCALE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_SCALE_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SCALE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_SCALE_CONFIG;
  }
}

export function saveScaleConfig(config: ScaleModelConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SCALE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

interface BrainEntry { id: string; text: string; active: boolean }
interface BrainCategory { id: string; label: string; entries: BrainEntry[] }

export function loadBrainCategories(): BrainCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SCALE_BRAIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildBrainPrompt(categories?: BrainCategory[]): string {
  const cats = categories ?? loadBrainCategories();
  if (!cats.length) return '';
  let prompt = '\n\n--- AGENT KNOWLEDGE BASE (follow these rules strictly) ---\n';
  cats.forEach((cat) => {
    const active = (cat.entries || []).filter((e) => e.active);
    if (!active.length) return;
    prompt += `\n[${(cat.label || cat.id).toUpperCase()}]\n`;
    active.forEach((e, i) => {
      prompt += `${i + 1}. ${e.text}\n`;
    });
  });
  prompt += '\n--- END KNOWLEDGE BASE ---\n';
  return prompt;
}

export async function callAI(
  config: ScaleModelConfig,
  systemPrompt: string,
  userMessage: string,
  history: ScaleChatMessage[] = []
): Promise<string> {
  const { provider, model, apiKey } = config;

  if (provider === 'anthropic') {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic API ${res.status}`);
    }
    const data = await res.json();
    return (data.content || [])
      .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text ?? '' : ''))
      .join('');
  }

  // OpenRouter (paid + free both use OpenAI-compatible shape)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://condowizard.ca',
    'X-Title': 'Scale by CondoWizard',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, max_tokens: 4000 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter API ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}
