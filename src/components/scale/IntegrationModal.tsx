'use client';

import { useState, useEffect } from 'react';
import {
  IntegrationName,
  setIntegration,
  getIntegration,
} from '@/lib/scale-integrations';

// ─── Design tokens (match Scale dark theme) ───
const INK   = '#0B0D11';
const INK2  = '#141414';
const INK3  = '#1A1D25';
const PAPER = '#F3F0E8';
const ACCENT = '#FF4A1C';
const LINE  = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const RED   = '#EF4444';
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Field definitions per integration ───
interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  password: boolean;
  required: boolean;
  multiline?: boolean;
}

interface IntegrationConfig {
  name: IntegrationName;
  displayName: string;
  color: string;
  fields: FieldDef[];
  helpText: string;
}

const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  'Meta Ads': {
    name: 'meta',
    displayName: 'Meta Ads',
    color: '#1877F2',
    fields: [
      { key: 'appId', label: 'App ID', placeholder: 'e.g. 1234567890', password: false, required: true },
      { key: 'appSecret', label: 'App Secret', placeholder: 'e.g. abc123def456...', password: true, required: true },
      { key: 'accessToken', label: 'Access Token', placeholder: 'e.g. EAABsbCS...', password: true, required: true, multiline: true },
      { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'e.g. act_1234567890', password: false, required: true },
    ],
    helpText: 'Get these from developers.facebook.com → Your App → Settings → Basic. For Access Token, use Business Manager → System Users.',
  },
  DataForSEO: {
    name: 'dataforseo',
    displayName: 'DataForSEO',
    color: '#10B981',
    fields: [
      { key: 'login', label: 'Login (email)', placeholder: 'you@example.com', password: false, required: true },
      { key: 'apiPassword', label: 'API Password', placeholder: 'Your DataForSEO API password', password: true, required: true },
    ],
    helpText: 'Sign up at dataforseo.com → Dashboard → API Access. You get $5 free credits on signup.',
  },
  Firecrawl: {
    name: 'firecrawl',
    displayName: 'Firecrawl',
    color: '#F59E0B',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'fc-...', password: true, required: true },
    ],
    helpText: 'Get your key at firecrawl.dev → Dashboard → API Keys. Free tier includes 500 scrapes/month.',
  },
  Stripe: {
    name: 'stripe',
    displayName: 'Stripe',
    color: '#635BFF',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_... or pk_test_...', password: false, required: true },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_... or sk_test_...', password: true, required: true },
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', placeholder: 'whsec_...', password: true, required: false },
    ],
    helpText: 'Get keys at dashboard.stripe.com → Developers → API Keys. Use test keys for development, live keys for production.',
  },
  'Apollo.io': {
    name: 'apollo',
    displayName: 'Apollo.io',
    color: '#FF6B35',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your Apollo API key', password: true, required: true },
    ],
    helpText: 'Get your key at app.apollo.io → Settings → Integrations → API. Free tier available.',
  },
  Resend: {
    name: 'resend',
    displayName: 'Resend',
    color: '#FF4A1C',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 're_...', password: true, required: true },
      { key: 'senderName', label: 'Sender Name', placeholder: 'Tal Shelef', password: false, required: true },
      { key: 'senderEmail', label: 'Sender Email (verified domain)', placeholder: 'contact@condowizard.ca', password: false, required: true },
      { key: 'replyTo', label: 'Reply-To Email (optional)', placeholder: 'contact@condowizard.ca', password: false, required: false },
    ],
    helpText: 'Sign up at resend.com. Free tier: 3,000 emails/month, 100/day. You\'ll need to verify your domain before sending. Get your API key at resend.com/api-keys.',
  },
  'Twilio Voice': {
    name: 'twilio',
    displayName: 'Twilio Voice',
    color: '#F22F46',
    fields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'AC...', password: false, required: true },
      { key: 'authToken', label: 'Auth Token', placeholder: 'Your Twilio auth token', password: true, required: true },
      { key: 'phoneNumber', label: 'Twilio Phone Number', placeholder: '+16475551234', password: false, required: true },
      { key: 'userPhone', label: 'Your Mobile Number', placeholder: '+16479991234', password: false, required: true },
      { key: 'twimlAppSid', label: 'TwiML App SID (optional)', placeholder: 'AP...', password: false, required: false },
    ],
    helpText: 'Sign up at twilio.com, buy a phone number ($1/month), and grab your credentials from the console. Phone numbers must be in E.164 format (+1234567890).',
  },
  'OpenAI (Whisper)': {
    name: 'openai',
    displayName: 'OpenAI (Whisper)',
    color: '#10A37F',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', password: true, required: true },
    ],
    helpText: 'Get your key at platform.openai.com/api-keys. Used for Whisper transcription of call recordings.',
  },
  'Vapi.ai': {
    name: 'vapi',
    displayName: 'Vapi.ai',
    color: '#FF4A1C',
    fields: [
      { key: 'apiKey', label: 'Public Key', placeholder: 'Your Vapi public key', password: false, required: true },
      { key: 'privateKey', label: 'Private Key', placeholder: 'Your Vapi private/secret key', password: true, required: true },
    ],
    helpText: 'Sign up at vapi.ai — free tier available. Get your keys from Dashboard → API Keys.',
  },
  ElevenLabs: {
    name: 'elevenlabs',
    displayName: 'ElevenLabs',
    color: '#000000',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your ElevenLabs API key', password: true, required: true },
    ],
    helpText: 'Get your key at elevenlabs.io → Settings → API Keys. Free tier: 10,000 characters/month.',
  },
};

// ─── Eye icons ───
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" /><circle cx="7" cy="7" r="2" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M2 2l10 10M5.5 5.5a2 2 0 002.8 2.8M1 7s2-3.5 5-4M8.5 3.3C12 4.5 13 7 13 7s-2.5 4-6 4c-.8 0-1.5-.1-2.2-.4" />
  </svg>
);

// ─── Props ───
interface Props {
  integrationDisplayName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function IntegrationModal({ integrationDisplayName, open, onClose, onSaved }: Props) {
  const config = INTEGRATION_CONFIGS[integrationDisplayName];
  const [values, setValues] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);

  // Pre-fill with existing credentials if editing
  useEffect(() => {
    if (!open || !config) return;
    const existing = getIntegration(config.name);
    if (existing) {
      const prefill: Record<string, string> = {};
      config.fields.forEach((f) => {
        const val = (existing as Record<string, unknown>)[f.key];
        if (typeof val === 'string') prefill[f.key] = val;
      });
      setValues(prefill);
    } else {
      setValues({});
    }
    setShowFields({});
    setErrors({});
    setShowHelp(false);
  }, [open, config]);

  if (!open || !config) return null;

  const updateField = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const toggleShow = (key: string) => {
    setShowFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSave = config.fields.filter((f) => f.required).every((f) => (values[f.key] || '').trim().length > 0);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach((f) => {
      if (f.required && !(values[f.key] || '').trim()) {
        newErrors[f.key] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Strip connectedAt from values (it's added by setIntegration)
    const data: Record<string, string> = {};
    config.fields.forEach((f) => {
      data[f.key] = (values[f.key] || '').trim();
    });
    setIntegration(config.name, data as never);
    onSaved();
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_BODY,
      }}
    >
      <div style={{
        background: INK2, border: `1px solid ${LINE}`, borderRadius: 20,
        width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        padding: 32, color: PAPER, position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: MUTED,
            fontSize: 20, cursor: 'pointer', padding: 8, lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Integration icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: `${config.color}18`, color: config.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0,
          }}>
            {config.displayName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: PAPER }}>Connect {config.displayName}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Enter your API credentials below</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {config.fields.map((field) => {
            const isPassword = field.password && !showFields[field.key];
            const hasError = !!errors[field.key];
            return (
              <div key={field.key}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600, color: PAPER,
                  marginBottom: 6,
                }}>
                  {field.label}
                  {field.required && <span style={{ color: ACCENT, marginLeft: 3 }}>*</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  {field.multiline ? (
                    <textarea
                      value={values[field.key] || ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        background: INK3, color: PAPER, fontSize: 13,
                        fontFamily: FONT_MONO, outline: 'none', resize: 'vertical',
                        border: `1px solid ${hasError ? RED : LINE}`,
                      }}
                    />
                  ) : (
                    <input
                      type={isPassword ? 'password' : 'text'}
                      value={values[field.key] || ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%', padding: '12px 14px',
                        paddingRight: field.password ? 42 : 14,
                        borderRadius: 10,
                        background: INK3, color: PAPER, fontSize: 13,
                        fontFamily: FONT_MONO, outline: 'none',
                        border: `1px solid ${hasError ? RED : LINE}`,
                      }}
                    />
                  )}
                  {field.password && !field.multiline && (
                    <button
                      type="button"
                      onClick={() => toggleShow(field.key)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: MUTED,
                        cursor: 'pointer', padding: 4, display: 'flex',
                      }}
                    >
                      {showFields[field.key] ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  )}
                </div>
                {hasError && (
                  <div style={{ fontSize: 11, color: RED, marginTop: 4 }}>{errors[field.key]}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help text */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'none', border: 'none', color: ACCENT,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
            marginBottom: showHelp ? 8 : 20, fontFamily: FONT_BODY,
          }}
        >
          {showHelp ? '▾ Hide instructions' : '▸ Where do I find these?'}
        </button>
        {showHelp && (
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: INK3, border: `1px solid ${LINE}`,
            fontSize: 12, color: MUTED, lineHeight: 1.6,
            marginBottom: 20,
          }}>
            {config.helpText}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px', borderRadius: 9,
              background: 'transparent', border: `1px solid ${LINE}`,
              color: MUTED, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT_BODY,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '10px 28px', borderRadius: 9,
              background: canSave ? ACCENT : 'rgba(255,74,28,0.3)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: FONT_BODY,
              opacity: canSave ? 1 : 0.6,
            }}
          >
            Save credentials
          </button>
        </div>
      </div>
    </div>
  );
}
