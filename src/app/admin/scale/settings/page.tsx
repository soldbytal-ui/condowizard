'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  callAI,
  loadScaleConfig,
  saveScaleConfig,
  ScaleModelConfig,
  ScaleProvider,
} from '@/lib/scale-ai';
import {
  isConnected as isIntegrationConnected,
  getIntegration,
  removeIntegration,
  IntegrationName,
} from '@/lib/scale-integrations';
import IntegrationModal from '@/components/scale/IntegrationModal';

// ─── Provider configs ───
interface ModelOption {
  id: string;
  name: string;
  cost: string;
  quality: number;
  speed: number;
  badge?: string;
}
interface ProviderOption {
  id: ScaleProvider;
  name: string;
  description: string;
  color: string;
  models: ModelOption[];
  keyPlaceholder: string;
  docs: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (direct)',
    description: 'Direct Claude API access. Best quality for ad copy. Requires your own API key.',
    color: '#D97706',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', cost: '$3/$15 per 1M tokens', quality: 95, speed: 85, badge: 'Recommended' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', cost: '$1/$5 per 1M tokens', quality: 80, speed: 98, badge: 'Fast & cheap' },
    ],
    keyPlaceholder: 'sk-ant-...',
    docs: 'https://docs.anthropic.com',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '300+ models through one API. Use Claude, GPT, Gemini, Llama, Mistral & more. Pay per token with credits.',
    color: '#6366F1',
    models: [
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', cost: '$3/$15 per 1M', quality: 95, speed: 85, badge: 'Best quality' },
      { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5', cost: '$1/$5 per 1M', quality: 80, speed: 98 },
      { id: 'openai/gpt-4o', name: 'GPT-4o', cost: '$2.50/$10 per 1M', quality: 90, speed: 90 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: '$0.15/$0.60 per 1M', quality: 75, speed: 95, badge: 'Budget pick' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', cost: '$1.25/$10 per 1M', quality: 88, speed: 85 },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', cost: '$0.15/$0.60 per 1M', quality: 78, speed: 97, badge: 'Ultra cheap' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', cost: '$0.20/$0.60 per 1M', quality: 82, speed: 92 },
      { id: 'mistralai/mistral-large', name: 'Mistral Large', cost: '$2/$6 per 1M', quality: 85, speed: 88 },
      { id: 'deepseek/deepseek-chat-v3', name: 'DeepSeek V3', cost: '$0.14/$0.28 per 1M', quality: 80, speed: 90, badge: 'Cheapest' },
    ],
    keyPlaceholder: 'sk-or-...',
    docs: 'https://openrouter.ai/docs',
  },
  {
    id: 'openrouter_free',
    name: 'OpenRouter Free',
    description: "Free models at no cost. Lower quality but great for testing. Rate limited. No API key needed.",
    color: '#10B981',
    models: [
      { id: 'openrouter/free', name: 'Auto (free router)', cost: 'Free', quality: 60, speed: 70, badge: 'Free' },
    ],
    keyPlaceholder: 'Optional — works without key',
    docs: 'https://openrouter.ai/openrouter/free',
  },
];

// ─── Icons ───
const Check = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5"/></svg>;
const Zap = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1L3 8h4l-.5 5L11 6H7l.5-5z"/></svg>;
const Shield = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M7 1L2 3v4c0 3.5 5 6 5 6s5-2.5 5-6V3L7 1z"/></svg>;
const Globe = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M2 7h10M7 1.5c1.5 2 2 3.5 2 5.5s-.5 3.5-2 5.5M7 1.5c-1.5 2-2 3.5-2 5.5s.5 3.5 2 5.5"/></svg>;
const Eye = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="2"/></svg>;
const EyeOff = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 2l10 10M5.5 5.5a2 2 0 002.8 2.8M1 7s2-3.5 5-4M8.5 3.3C12 4.5 13 7 13 7s-2.5 4-6 4c-.8 0-1.5-.1-2.2-.4"/></svg>;
const ExternalLink = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M5 1H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V7M7 1h4v4M11 1L5 7"/></svg>;

const S = {
  pageBg: '#F5F5F7', pageHeading: '#111318', pageSubtitle: '#6B7185',
  bg: '#111318', surface: '#111318', surfaceHover: '#1A1D23',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF', accentSoft: 'rgba(0,102,255,0.14)', accentBorder: 'rgba(0,102,255,0.4)',
  green: '#10B981', greenSoft: 'rgba(16,185,129,0.14)', red: '#EF4444',
  textPrimary: '#E2E4E9', textSecondary: '#8B8FA3', textMuted: '#8B8FA3', textDim: '#6B7185', white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif", mono: "'JetBrains Mono', monospace",
};

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

interface TestResult { ok: boolean; message: string; latency: number }
interface CostEstimate { perProject: number; tenProjects: number }
interface GoogleAdsStatus {
  connected: boolean;
  email?: string | null;
  customerId?: string | null;
  loginCustomerId?: string | null;
  developerTokenConfigured?: boolean;
}

// ─── Integration row definition ───
interface IntegrationRowDef {
  displayName: string;
  integrationKey: IntegrationName | null; // null = handled separately (Google Ads, Repliers)
  description: string;
  color: string;
  optional?: boolean;
  alwaysConnected?: boolean; // e.g. Repliers — hardcoded as connected
}

const INTEGRATION_ROWS: IntegrationRowDef[] = [
  { displayName: 'Meta Ads', integrationKey: 'meta', description: 'Run lead gen, carousel, and story campaigns on Facebook and Instagram.', color: '#1877F2' },
  { displayName: 'DataForSEO', integrationKey: 'dataforseo', description: 'Keyword research, SERP analysis, and rank tracking for the Intelligence tab.', color: '#10B981' },
  { displayName: 'Firecrawl', integrationKey: 'firecrawl', description: 'Web scraping for competitor analysis and content enrichment.', color: '#F59E0B' },
  { displayName: 'Stripe', integrationKey: 'stripe', description: 'Credit top-ups and subscription billing for Scale plans.', color: '#635BFF' },
  { displayName: 'Resend', integrationKey: 'resend', description: 'Send emails from your domain. Transactional emails, nurture sequences, and CRM outreach.', color: '#FF4A1C' },
  { displayName: 'Twilio Voice', integrationKey: 'twilio', description: 'Phone calling with automatic recording, transcription, and AI summaries.', color: '#F22F46' },
  { displayName: 'OpenAI (Whisper)', integrationKey: 'openai', description: 'Audio transcription via OpenAI Whisper model. Used for call recording analysis.', color: '#10A37F' },
  { displayName: 'Apollo.io', integrationKey: 'apollo', description: 'Lead enrichment — company data, job titles, and contact info.', color: '#FF6B35', optional: true },
];

export default function ModelRouter() {
  const [config, setConfig] = useState<ScaleModelConfig>({
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    apiKey: '',
  });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleAdsStatus | null>(null);
  const [googleFlash, setGoogleFlash] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  // Integration state
  const [integrationModal, setIntegrationModal] = useState<string | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, boolean>>({});
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);

  const refreshIntegrationStatuses = useCallback(() => {
    const statuses: Record<string, boolean> = {};
    INTEGRATION_ROWS.forEach((row) => {
      if (row.integrationKey) {
        statuses[row.displayName] = isIntegrationConnected(row.integrationKey);
      }
    });
    setIntegrationStatuses(statuses);
  }, []);

  const handleDisconnect = (row: IntegrationRowDef) => {
    if (!row.integrationKey) return;
    removeIntegration(row.integrationKey);
    setDisconnectConfirm(null);
    refreshIntegrationStatuses();
  };

  const getIntegrationSubtitle = (row: IntegrationRowDef): string | null => {
    if (!row.integrationKey || !integrationStatuses[row.displayName]) return null;
    const creds = getIntegration(row.integrationKey);
    if (!creds) return null;
    switch (row.integrationKey) {
      case 'meta': return `act_${((creds as { adAccountId?: string }).adAccountId || '').replace('act_', '').slice(0, 10)}...`;
      case 'dataforseo': return (creds as { login?: string }).login || null;
      case 'firecrawl': return 'fc-••••';
      case 'stripe': return ((creds as { publishableKey?: string }).publishableKey || '').startsWith('pk_test') ? 'Test mode' : 'Live mode';
      case 'apollo': return 'API key configured';
      case 'resend': return (creds as { senderEmail?: string }).senderEmail || 'Connected';
      case 'twilio': return (creds as { phoneNumber?: string }).phoneNumber || 'Connected';
      case 'openai': return 'Whisper enabled';
      default: return null;
    }
  };

  useEffect(() => {
    setConfig(loadScaleConfig());
    setHydrated(true);
    refreshIntegrationStatuses();

    // Surface a flash from the OAuth callback if the URL has one
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ga_connected') === '1') {
        setGoogleFlash({ kind: 'ok', message: 'Google Ads connected.' });
      } else if (params.get('ga_error')) {
        setGoogleFlash({ kind: 'err', message: `Google Ads connection failed: ${decodeURIComponent(params.get('ga_error') || '')}` });
      }
      if (params.has('ga_connected') || params.has('ga_error')) {
        const clean = new URL(window.location.href);
        clean.searchParams.delete('ga_connected');
        clean.searchParams.delete('ga_error');
        window.history.replaceState({}, '', clean.toString());
      }
    }

    refreshGoogleStatus();
  }, []);

  const refreshGoogleStatus = async () => {
    try {
      const res = await fetch('/api/admin/scale/google/status', { cache: 'no-store' });
      const data = await res.json();
      setGoogleStatus(data);
    } catch {
      setGoogleStatus({ connected: false });
    }
  };

  const disconnectGoogle = async () => {
    try {
      await fetch('/api/admin/scale/google/status', { method: 'DELETE' });
      setGoogleFlash({ kind: 'ok', message: 'Disconnected.' });
      refreshGoogleStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGoogleFlash({ kind: 'err', message });
    }
  };

  // Auto-persist any config change so switching tabs never loses the API key.
  useEffect(() => {
    if (!hydrated) return;
    saveScaleConfig(config);
  }, [config, hydrated]);

  const save = () => {
    saveScaleConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeProvider = PROVIDERS.find((p) => p.id === config.provider);
  const activeModel = activeProvider?.models.find((m) => m.id === config.model);

  const selectProvider = (providerId: ScaleProvider) => {
    const prov = PROVIDERS.find((p) => p.id === providerId);
    if (!prov) return;
    // Preserve the apiKey across provider switches — user's request.
    setConfig((c) => ({
      provider: providerId,
      model: prov.models[0].id,
      apiKey: c.apiKey,
    }));
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const result = await callAI(
        config,
        'You are a helpful assistant. Respond in exactly one short sentence.',
        "Say 'Scale by CondoWizard is connected!' and nothing else."
      );
      setTestResult({ ok: true, message: result.trim(), latency: Date.now() - start });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({ ok: false, message, latency: Date.now() - start });
    }
    setTesting(false);
  };

  useEffect(() => {
    if (!activeModel) return;
    const costStr = activeModel.cost;
    if (costStr === 'Free') {
      setCostEstimate({ perProject: 0, tenProjects: 0 });
      return;
    }
    const match = costStr.match(/\$([\d.]+)\/\$([\d.]+)/);
    if (match) {
      const inputPer1M = parseFloat(match[1]);
      const outputPer1M = parseFloat(match[2]);
      const perProject = (2000 * inputPer1M) / 1000000 + (2000 * outputPer1M) / 1000000;
      setCostEstimate({ perProject, tenProjects: perProject * 10 });
    }
  }, [activeModel]);

  return (
    <div style={{ color: S.pageHeading, fontFamily: S.font, background: S.pageBg, minHeight: '100%' }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mr-card:hover { border-color: ${S.borderHover} !important; }
        ::selection { background: rgba(0,102,255,0.3); }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto', animation: 'slideIn 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Model router
            </h1>
            <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 0', lineHeight: 1.6 }}>
              Choose which AI provider and model power Scale. Saved locally in your browser.
            </p>
          </div>
          <button onClick={save}
            style={{ padding: '12px 28px', borderRadius: 10, background: saved ? S.greenSoft : S.accent, border: 'none', color: S.white, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: S.font, transition: 'all 0.15s' }}>
            {saved ? 'Saved!' : 'Save configuration'}
          </button>
        </div>

        {/* Provider selection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>AI provider</h2>
          <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>Choose where Scale sends API requests. Switch anytime without changing anything else.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {PROVIDERS.map((prov) => (
              <div key={prov.id} className="mr-card" onClick={() => selectProvider(prov.id)}
                style={{
                  background: config.provider === prov.id ? S.accentSoft : S.surface,
                  border: `1px solid ${config.provider === prov.id ? S.accentBorder : S.border}`,
                  borderRadius: 16, padding: 22, cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative', boxShadow: CARD_SHADOW, color: S.textPrimary,
                }}>
                {config.provider === prov.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 6, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.white }}><Check /></div>
                )}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${prov.color}18`, color: prov.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  {prov.id === 'anthropic' ? <Shield /> : prov.id === 'openrouter' ? <Globe /> : <Zap />}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.white, marginBottom: 8 }}>{prov.name}</div>
                <div style={{ fontSize: 15, color: S.textMuted, lineHeight: 1.6 }}>{prov.description}</div>
                <div style={{ marginTop: 14, fontSize: 14, color: prov.color, fontWeight: 500 }}>
                  {prov.models.length} model{prov.models.length !== 1 ? 's' : ''} available
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model selection */}
        {activeProvider && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Model</h2>
            <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>Pick the model for ad generation. Higher quality = better copy but costs more.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeProvider.models.map((model) => (
                <div key={model.id} className="mr-card" onClick={() => setConfig((c) => ({ ...c, model: model.id }))}
                  style={{
                    background: config.model === model.id ? S.accentSoft : S.surface,
                    border: `1px solid ${config.model === model.id ? S.accentBorder : S.border}`,
                    borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 16, boxShadow: CARD_SHADOW, color: S.textPrimary,
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: config.model === model.id ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                    background: config.model === model.id ? S.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: S.white,
                  }}>
                    {config.model === model.id && <Check />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: S.white }}>{model.name}</span>
                      {model.badge && (
                        <span style={{
                          fontSize: 12, padding: '3px 10px', borderRadius: 5, fontWeight: 500,
                          background: model.badge === 'Recommended' || model.badge === 'Best quality' ? S.accentSoft :
                            model.badge === 'Free' ? S.greenSoft :
                            model.badge.toLowerCase().includes('cheap') ? 'rgba(16,185,129,0.1)' :
                            'rgba(245,158,11,0.1)',
                          color: model.badge === 'Recommended' || model.badge === 'Best quality' ? '#4D9FFF' :
                            model.badge === 'Free' ? S.green :
                            model.badge.toLowerCase().includes('cheap') ? S.green :
                            '#F59E0B',
                        }}>{model.badge}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>{model.cost}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 4 }}>Quality</div>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${model.quality}%`, height: '100%', borderRadius: 2, background: model.quality >= 90 ? S.accent : model.quality >= 75 ? '#F59E0B' : S.textMuted, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 4 }}>Speed</div>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${model.speed}%`, height: '100%', borderRadius: 2, background: model.speed >= 90 ? S.green : model.speed >= 75 ? '#F59E0B' : S.textMuted, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Key */}
        {activeProvider && activeProvider.id !== 'openrouter_free' && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>API key</h2>
            <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>
              Your key is stored locally and never sent anywhere except {activeProvider.name}.{' '}
              <a href={activeProvider.docs} target="_blank" rel="noreferrer" style={{ color: S.accent, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Get a key <ExternalLink />
              </a>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                  placeholder={activeProvider.keyPlaceholder}
                  style={{
                    width: '100%', padding: '15px 48px 15px 18px', borderRadius: 11,
                    background: S.surface, border: `1px solid ${S.border}`,
                    color: S.textPrimary, fontSize: 15, fontFamily: S.mono, outline: 'none',
                  }}
                />
                <button onClick={() => setShowKey(!showKey)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', padding: 4 }}>
                  {showKey ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeProvider?.id === 'openrouter_free' && (
          <div style={{ marginBottom: 32, padding: '16px 20px', borderRadius: 10, background: S.greenSoft, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: S.green, marginBottom: 4 }}>No API key required</div>
            <div style={{ fontSize: 13, color: '#6EE7B7', lineHeight: 1.5 }}>
              OpenRouter&apos;s free tier works without an API key. Models are selected automatically. Quality is lower than paid models and requests are rate-limited, but it&apos;s great for testing.
            </div>
          </div>
        )}

        {/* Cost estimate */}
        {costEstimate && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Cost estimate</h2>
            <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>Estimated API cost for ad generation (does not include ad spend).</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, textAlign: 'center', boxShadow: CARD_SHADOW, color: S.textPrimary }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.white, letterSpacing: '-0.02em' }}>
                  {costEstimate.perProject === 0 ? 'Free' : `$${costEstimate.perProject.toFixed(4)}`}
                </div>
                <div style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>Per project</div>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, textAlign: 'center', boxShadow: CARD_SHADOW, color: S.textPrimary }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.white, letterSpacing: '-0.02em' }}>
                  {costEstimate.tenProjects === 0 ? 'Free' : `$${costEstimate.tenProjects.toFixed(3)}`}
                </div>
                <div style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>10 projects</div>
              </div>
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, textAlign: 'center', boxShadow: CARD_SHADOW, color: S.textPrimary }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.white, letterSpacing: '-0.02em' }}>
                  {costEstimate.tenProjects === 0 ? 'Free' : `$${(costEstimate.tenProjects * 30).toFixed(2)}`}
                </div>
                <div style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>Daily × 30 days</div>
              </div>
            </div>
          </div>
        )}

        {/* Test connection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Test connection</h2>
          <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>Send a test request to verify your configuration works.</p>
          <button onClick={testConnection} disabled={testing || (activeProvider?.id !== 'openrouter_free' && !config.apiKey)}
            style={{
              padding: '12px 28px', borderRadius: 10,
              background: testing ? S.surfaceHover : S.accent,
              border: 'none', color: S.white, fontSize: 15, fontWeight: 600,
              cursor: testing || (activeProvider?.id !== 'openrouter_free' && !config.apiKey) ? 'not-allowed' : 'pointer',
              fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 10,
              opacity: (activeProvider?.id !== 'openrouter_free' && !config.apiKey) ? 0.4 : 1,
            }}>
            {testing ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: S.white, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Testing...</>
            ) : (
              <><Zap /> Test connection</>
            )}
          </button>

          {testResult && (
            <div style={{
              marginTop: 12, padding: '14px 18px', borderRadius: 10,
              background: S.surface, color: S.textPrimary, boxShadow: CARD_SHADOW,
              border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              animation: 'slideIn 0.2s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: testResult.ok ? S.green : S.red }}>
                  {testResult.ok ? 'Connected' : 'Failed'}
                </span>
                <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>{testResult.latency}ms</span>
              </div>
              <div style={{ fontSize: 13, color: testResult.ok ? '#6EE7B7' : '#FCA5A5', fontFamily: S.mono, lineHeight: 1.6 }}>
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Google Ads */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Google Ads</h2>
          <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>
            Connect your Google Ads account so Scale can push generated campaigns live with one click. Campaigns are created in a PAUSED state — you un-pause from the Google Ads UI.
          </p>

          {googleFlash && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 10,
              background: googleFlash.kind === 'ok' ? S.greenSoft : 'rgba(239,68,68,0.08)',
              border: `1px solid ${googleFlash.kind === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
              color: googleFlash.kind === 'ok' ? S.green : S.red,
              fontSize: 14, fontFamily: S.mono,
            }}>
              {googleFlash.message}
            </div>
          )}

          {!googleStatus ? (
            <div style={{ fontSize: 14, color: S.textMuted }}>Checking Google Ads status…</div>
          ) : googleStatus.connected ? (
            <div style={{
              background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, boxShadow: CARD_SHADOW, color: S.textPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: S.greenSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.green,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: S.white, marginBottom: 5 }}>
                    Connected{googleStatus.email ? <> as <span style={{ color: '#C8CBD3' }}>{googleStatus.email}</span></> : ''}
                  </div>
                  <div style={{ fontSize: 14, color: S.textMuted, fontFamily: S.mono, lineHeight: 1.55 }}>
                    Customer ID: {googleStatus.customerId || '—'}
                    {googleStatus.loginCustomerId && googleStatus.loginCustomerId !== googleStatus.customerId && (
                      <> · MCC: {googleStatus.loginCustomerId}</>
                    )}
                    {!googleStatus.developerTokenConfigured && (
                      <span style={{ color: '#F59E0B', marginLeft: 8 }}>· developer token missing</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={disconnectGoogle}
                style={{
                  padding: '10px 20px', borderRadius: 9,
                  background: 'transparent', border: `1px solid ${S.border}`,
                  color: S.textSecondary, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: S.font,
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{
              background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, boxShadow: CARD_SHADOW, color: S.textPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: S.white, marginBottom: 6 }}>Not connected</div>
                <div style={{ fontSize: 15, color: S.textMuted, lineHeight: 1.6 }}>
                  You&apos;ll be redirected to Google to authorize Scale. You&apos;ll need the Google account that owns the Ads customer ID
                  <code style={{ fontFamily: S.mono, fontSize: 14, padding: '3px 8px', borderRadius: 6, background: S.surfaceHover, marginLeft: 6 }}>
                    {googleStatus.customerId || 'not set'}
                  </code>.
                </div>
              </div>
              <a
                href="/api/admin/scale/google/auth"
                style={{
                  padding: '13px 26px', borderRadius: 11,
                  background: S.accent, color: S.white, border: 'none',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                  display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-6.1-4.9-11-11-11S0 5.9 0 12s4.9 11 11 11 11-4.9 11-11zM11 5.5c1.6 0 3 .6 4.1 1.6l-1.7 1.7C12.8 8.2 12 8 11 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c1.9 0 3.3-1.2 3.7-2.8H11v-2.4h6.1c.1.4.1.9.1 1.4 0 3.8-2.6 6.4-6.2 6.4-3.6 0-6.5-2.9-6.5-6.5s2.9-6.6 6.5-6.6z" /></svg>
                Connect Google Ads
              </a>
            </div>
          )}
        </div>

        {/* Integrations */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: S.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Integrations</h2>
          <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>
            Connect third-party services to unlock Scale features. Each integration enables specific capabilities.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Google Ads — handled by OAuth above, shown as status-only row */}
            <div style={{
              background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14,
              padding: '16px 20px', boxShadow: CARD_SHADOW, color: S.textPrimary,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(66,133,244,0.1)', color: '#4285F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, fontFamily: S.mono, flexShrink: 0,
              }}>G</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: S.white }}>Google Ads</div>
                <div style={{ fontSize: 13, color: S.textMuted, marginTop: 2, lineHeight: 1.4 }}>Push campaigns to Google Ads. Managed via OAuth above.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: S.mono,
                  padding: '4px 10px', borderRadius: 6,
                  background: googleStatus?.connected ? S.greenSoft : 'rgba(239,68,68,0.08)',
                  color: googleStatus?.connected ? S.green : S.red,
                }}>
                  {googleStatus?.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>

            {/* Dynamic integration rows */}
            {INTEGRATION_ROWS.map((row) => {
              const connected = integrationStatuses[row.displayName] || false;
              const subtitle = connected ? getIntegrationSubtitle(row) : null;
              return (
                <div key={row.displayName} style={{
                  background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14,
                  padding: '16px 20px', boxShadow: CARD_SHADOW, color: S.textPrimary,
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${row.color}18`, color: row.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, fontFamily: S.mono, flexShrink: 0,
                  }}>
                    {row.displayName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: S.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {row.displayName}
                      {row.optional && (
                        <span style={{ fontSize: 10, fontFamily: S.mono, color: S.textMuted, fontWeight: 500 }}>OPTIONAL</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: S.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                      {row.description}
                      {subtitle && (
                        <span style={{ marginLeft: 6, fontFamily: S.mono, fontSize: 11, color: S.textSecondary }}>
                          · {subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {connected ? (
                      <>
                        <span style={{
                          fontSize: 12, fontWeight: 600, fontFamily: S.mono,
                          padding: '4px 10px', borderRadius: 6,
                          background: S.greenSoft, color: S.green,
                        }}>
                          Connected
                        </span>
                        {disconnectConfirm === row.displayName ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleDisconnect(row)}
                              style={{
                                padding: '7px 14px', borderRadius: 8,
                                background: 'rgba(239,68,68,0.12)', border: `1px solid rgba(239,68,68,0.3)`,
                                color: S.red, fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', fontFamily: S.font,
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDisconnectConfirm(null)}
                              style={{
                                padding: '7px 10px', borderRadius: 8,
                                background: 'transparent', border: `1px solid ${S.border}`,
                                color: S.textMuted, fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', fontFamily: S.font,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDisconnectConfirm(row.displayName)}
                            style={{
                              padding: '7px 14px', borderRadius: 8,
                              background: 'transparent', border: `1px solid ${S.border}`,
                              color: S.textSecondary, fontSize: 12, fontWeight: 500,
                              cursor: 'pointer', fontFamily: S.font,
                            }}
                          >
                            Disconnect
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setIntegrationModal(row.displayName)}
                        style={{
                          padding: '7px 16px', borderRadius: 8,
                          background: S.accent, border: 'none',
                          color: S.white, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: S.font,
                        }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Repliers API — always connected, status-only */}
            <div style={{
              background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14,
              padding: '16px 20px', boxShadow: CARD_SHADOW, color: S.textPrimary,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, fontFamily: S.mono, flexShrink: 0,
              }}>R</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: S.white }}>Repliers API</div>
                <div style={{ fontSize: 13, color: S.textMuted, marginTop: 2, lineHeight: 1.4 }}>MLS listing data for Community Listings campaigns and market stats.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: S.mono,
                  padding: '4px 10px', borderRadius: 6,
                  background: S.greenSoft, color: S.green,
                }}>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration modal */}
        <IntegrationModal
          integrationDisplayName={integrationModal || ''}
          open={integrationModal !== null}
          onClose={() => setIntegrationModal(null)}
          onSaved={refreshIntegrationStatuses}
        />

        {/* Email Templates */}
        <EmailTemplatesSection />

        {/* Inbound Webhook */}
        <InboundWebhookSection />

        {/* Integration guide */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: S.white, margin: '0 0 14px', letterSpacing: '-0.01em' }}>How this connects to Scale</h3>
          <div style={{ fontSize: 14, color: '#8B8FA3', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 14px' }}>
              Your model configuration is saved to <code style={{ fontFamily: S.mono, fontSize: 13, padding: '3px 8px', borderRadius: 5, background: S.surfaceHover }}>localStorage</code> and loaded by the Campaigns page and Agent Brain chat.
            </p>
            <p style={{ margin: 0 }}>
              The flow: <span style={{ color: '#C8CBD3' }}>Campaigns</span> → <span style={{ color: '#C8CBD3' }}>Agent Brain</span> rules injected → request to <span style={{ color: '#C8CBD3' }}>{activeProvider?.name || 'your provider'}</span> via <span style={{ color: '#C8CBD3' }}>{activeModel?.name || 'your model'}</span> → structured ad copy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Email Templates section
// ═══════════════════════════════════════════════════════════════
const EMAIL_TEMPLATES_KEY = 'scale-email-templates';
const TEMPLATE_VARS = ['{firstName}', '{lastName}', '{interest}', '{neighborhood}', '{budget}', '{agentName}', '{brokerage}', '{agentPhone}', '{agentEmail}'];

interface EmailTemplate { id: string; name: string; subject: string; body: string }

function loadTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EMAIL_TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTemplates(t: EmailTemplate[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(t));
}

function EmailTemplatesSection() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const persist = (next: EmailTemplate[]) => { setTemplates(next); saveTemplates(next); };

  const startEdit = (t: EmailTemplate) => { setEditId(t.id); setName(t.name); setSubject(t.subject); setBody(t.body); setAdding(true); };
  const startNew = () => { setEditId(null); setName(''); setSubject(''); setBody(''); setAdding(true); };
  const cancel = () => { setAdding(false); setEditId(null); };

  const save = () => {
    if (!name.trim() || !subject.trim()) return;
    const entry: EmailTemplate = { id: editId || `tpl_${Date.now().toString(36)}`, name: name.trim(), subject: subject.trim(), body: body.trim() };
    if (editId) {
      persist(templates.map((t) => t.id === editId ? entry : t));
    } else {
      persist([...templates, entry]);
    }
    cancel();
  };

  const remove = (id: string) => persist(templates.filter((t) => t.id !== id));

  const S2 = S; // alias

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: S2.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Email Templates</h2>
      <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>
        Manage templates used in the CRM email composer. Variables are auto-replaced when applied to a lead.
      </p>

      {/* Template list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {templates.length === 0 && !adding && (
          <div style={{ padding: 20, textAlign: 'center', color: S2.textMuted, fontSize: 14, background: S2.surface, borderRadius: 14, border: `1px solid ${S2.border}` }}>
            No custom templates yet. Templates are seeded automatically when you open a lead detail page.
          </div>
        )}
        {templates.map((t) => (
          <div key={t.id} style={{
            background: S2.surface, border: `1px solid ${S2.border}`, borderRadius: 14,
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, color: S2.textPrimary,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: S2.white }}>{t.name}</div>
              <div style={{ fontSize: 12, color: S2.textMuted, fontFamily: S2.mono, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.subject}
              </div>
            </div>
            <button onClick={() => startEdit(t)} style={{ padding: '6px 12px', borderRadius: 7, background: 'transparent', border: `1px solid ${S2.border}`, color: S2.textSecondary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: S2.font }}>Edit</button>
            <button onClick={() => remove(t.id)} style={{ padding: '6px 12px', borderRadius: 7, background: 'transparent', border: `1px solid ${S2.border}`, color: S2.red, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: S2.font }}>Delete</button>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {adding ? (
        <div style={{ background: S2.surface, border: `1px solid ${S2.border}`, borderRadius: 14, padding: 20, color: S2.textPrimary }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: S2.white, marginBottom: 16 }}>{editId ? 'Edit template' : 'New template'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: S2.textMuted, display: 'block', marginBottom: 4 }}>Template name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Introduction" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, background: S2.surfaceHover, border: `1px solid ${S2.border}`, color: S2.textPrimary, fontSize: 14, fontFamily: S2.font, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: S2.textMuted, display: 'block', marginBottom: 4 }}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Great to connect, {firstName}" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, background: S2.surfaceHover, border: `1px solid ${S2.border}`, color: S2.textPrimary, fontSize: 14, fontFamily: S2.mono, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: S2.textMuted, display: 'block', marginBottom: 4 }}>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email body with {variables}..." rows={6} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, background: S2.surfaceHover, border: `1px solid ${S2.border}`, color: S2.textPrimary, fontSize: 14, fontFamily: S2.font, outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            <div style={{ fontSize: 11, color: S2.textMuted, lineHeight: 1.5 }}>
              Available variables: {TEMPLATE_VARS.map((v) => <code key={v} style={{ fontFamily: S2.mono, fontSize: 10, padding: '1px 5px', borderRadius: 3, background: S2.surfaceHover, marginRight: 4 }}>{v}</code>)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={cancel} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${S2.border}`, color: S2.textSecondary, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: S2.font }}>Cancel</button>
            <button onClick={save} disabled={!name.trim() || !subject.trim()} style={{ padding: '8px 18px', borderRadius: 8, background: (!name.trim() || !subject.trim()) ? 'rgba(255,255,255,0.05)' : S2.accent, border: 'none', color: (!name.trim() || !subject.trim()) ? S2.textMuted : S2.white, fontSize: 12, fontWeight: 600, cursor: (!name.trim() || !subject.trim()) ? 'not-allowed' : 'pointer', fontFamily: S2.font }}>Save template</button>
          </div>
        </div>
      ) : (
        <button onClick={startNew} style={{ padding: '10px 20px', borderRadius: 9, background: S2.accent, border: 'none', color: S2.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: S2.font }}>
          + New Template
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Inbound Webhook section
// ═══════════════════════════════════════════════════════════════
const WEBHOOK_KEY_STORAGE = 'scale-inbound-api-key';

function InboundWebhookSection() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let key = window.localStorage.getItem(WEBHOOK_KEY_STORAGE);
    if (!key) {
      key = 'scale_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
      window.localStorage.setItem(WEBHOOK_KEY_STORAGE, key);
    }
    setApiKey(key);
  }, []);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/admin/scale/crm/inbound`
    : '/api/admin/scale/crm/inbound';

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "416-555-1234",
    "source": "condowizard.ca",
    "interest": "KING Toronto",
    "budget": "500k-750k",
    "timeline": "3-6 months",
    "message": "Looking for a 2bed pre-construction",
    "apiKey": "${apiKey}"
  }'`;

  const testWebhook = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/scale/crm/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Lead (webhook)',
          email: 'test@example.com',
          phone: '416-555-0000',
          source: 'Webhook Test',
          interest: 'Test — will appear in CRM',
          budget: '$500K-$750K',
          timeline: '3-6 months',
          message: 'This is a test lead from the webhook test button.',
          apiKey,
        }),
      });
      const data = await res.json();
      setTestResult({ ok: data.success, message: data.success ? `Lead created: ${data.leadId}` : data.error });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Request failed' });
    }
    setTesting(false);
  };

  const S2 = S;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: S2.pageHeading, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Inbound Webhook</h2>
      <p style={{ fontSize: 15, color: '#6B7185', margin: '0 0 20px', lineHeight: 1.6 }}>
        Accept leads from landing pages, Zapier, or any external source via POST request.
      </p>

      <div style={{ background: S2.surface, border: `1px solid ${S2.border}`, borderRadius: 16, padding: 24, color: S2.textPrimary, marginBottom: 16 }}>
        {/* Webhook URL */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: S2.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Webhook URL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: S2.surfaceHover, border: `1px solid ${S2.border}`, fontFamily: S2.mono, fontSize: 12, color: S2.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {webhookUrl}
            </code>
            <button onClick={() => copyText(webhookUrl, 'url')} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${S2.border}`, color: copied === 'url' ? S2.green : S2.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: S2.font, whiteSpace: 'nowrap' }}>
              {copied === 'url' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: S2.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>API Key</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: S2.surfaceHover, border: `1px solid ${S2.border}`, fontFamily: S2.mono, fontSize: 12, color: S2.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {apiKey}
            </code>
            <button onClick={() => copyText(apiKey, 'key')} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${S2.border}`, color: copied === 'key' ? S2.green : S2.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: S2.font, whiteSpace: 'nowrap' }}>
              {copied === 'key' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Example curl */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: S2.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Example curl</div>
            <button onClick={() => copyText(curlExample, 'curl')} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${S2.border}`, color: copied === 'curl' ? S2.green : S2.textSecondary, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: S2.font }}>
              {copied === 'curl' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre style={{ padding: '14px 16px', borderRadius: 10, background: S2.surfaceHover, border: `1px solid ${S2.border}`, fontFamily: S2.mono, fontSize: 11, color: '#C8CBD3', lineHeight: 1.6, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {curlExample}
          </pre>
        </div>

        {/* Test button */}
        <button onClick={testWebhook} disabled={testing} style={{
          padding: '10px 22px', borderRadius: 9,
          background: testing ? S2.surfaceHover : S2.accent,
          border: 'none', color: S2.white, fontSize: 13, fontWeight: 600,
          cursor: testing ? 'not-allowed' : 'pointer', fontFamily: S2.font,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {testing ? 'Sending…' : 'Test webhook'}
        </button>

        {testResult && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 9,
            background: testResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontSize: 12, fontFamily: S2.mono, color: testResult.ok ? S2.green : S2.red,
          }}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
