'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  callAI,
  loadScaleConfig,
  buildBrainPrompt,
  ScaleModelConfig,
} from '@/lib/scale-ai';

// ─── Types ───
interface ScaleProject {
  id: string;
  name: string;
  slug?: string;
  neighborhood: string;
  developer: string;
  price: string;
  completion: string;
  floors: number | null;
  units: number | null;
  amenities: string[];
  status: string;
  image: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  color: string;
  format: string;
}

// ─── Fallback projects (used when DB is empty or Prisma fails) ───
const FALLBACK_PROJECTS: ScaleProject[] = [
  {
    id: 'fallback-king',
    name: 'KING Toronto',
    neighborhood: 'King West',
    developer: 'Westbank',
    price: '$900K – $3.2M',
    completion: '2027',
    floors: 16,
    units: 514,
    amenities: ['Rooftop garden', 'Fitness centre', 'Co-working lounge'],
    status: 'PRE_CONSTRUCTION',
    image: '',
  },
  {
    id: 'fallback-walmer',
    name: '429 Walmer',
    neighborhood: 'Forest Hill',
    developer: 'Camrost Felcorp',
    price: '$1.4M – $4.8M',
    completion: '2026',
    floors: 12,
    units: 88,
    amenities: ['Concierge', 'Private dining', 'Wellness spa'],
    status: 'UNDER_CONSTRUCTION',
    image: '',
  },
  {
    id: 'fallback-bellwoods',
    name: 'Bellwoods House',
    neighborhood: 'Trinity Bellwoods',
    developer: 'Curated Properties',
    price: '$750K – $2.1M',
    completion: '2028',
    floors: 8,
    units: 64,
    amenities: ['Park-view terrace', 'Library', 'Pet spa'],
    status: 'PRE_LAUNCH',
    image: '',
  },
];

const CHANNELS: Channel[] = [
  {
    id: 'google_search',
    name: 'Google Search',
    description: '3 headlines (30 char) + 2 descriptions (90 char)',
    color: '#4285F4',
    format: `Return JSON with shape: { "headlines": string[3], "descriptions": string[2] }. Headlines MUST be ≤30 chars. Descriptions MUST be ≤90 chars. No exclamation marks.`,
  },
  {
    id: 'meta_feed',
    name: 'Meta (Feed)',
    description: '1 primary text (125 char) + 1 headline (40 char) + 1 CTA',
    color: '#1877F2',
    format: `Return JSON with shape: { "primaryText": string, "headline": string, "cta": string }. primaryText ≤125 chars, headline ≤40 chars, cta from: "Learn More", "Sign Up", "Book Now", "Get Offer".`,
  },
  {
    id: 'display',
    name: 'Display Banner',
    description: 'Short headline (25 char) + tagline (35 char) + CTA',
    color: '#34A853',
    format: `Return JSON with shape: { "headline": string, "tagline": string, "cta": string }. headline ≤25 chars, tagline ≤35 chars.`,
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Subject line + preheader + 2-paragraph body',
    color: '#EA4335',
    format: `Return JSON with shape: { "subject": string, "preheader": string, "body": string }. subject ≤50 chars, preheader ≤90 chars, body = 2 short paragraphs.`,
  },
];

// ─── Theme ───
const S = {
  bg: '#0B0D11',
  surface: 'rgba(255,255,255,0.02)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.08)',
  accentBorder: 'rgba(0,102,255,0.35)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.1)',
  red: '#EF4444',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#555B67',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function projectSystemPrompt(project: ScaleProject, channel: Channel, brain: string) {
  const base = `You are Scale, the AI ad copywriter for CondoWizard.ca — a Toronto pre-construction condo platform. You generate ad copy for Tal Shelef, Sales Representative at Rare Real Estate Inc.

You write copy that is specific, grounded in the project details, and compliant with Ontario real estate advertising rules.`;
  const projectContext = `\n\nPROJECT BRIEF:
- Name: ${project.name}
- Neighbourhood: ${project.neighborhood}
- Developer: ${project.developer}
- Price: ${project.price}
- Completion: ${project.completion}
- Floors / Units: ${project.floors ?? '—'} / ${project.units ?? '—'}
- Amenities: ${project.amenities.join(', ') || '—'}
- Status: ${statusLabel(project.status)}`;
  const channelContext = `\n\nCHANNEL: ${channel.name}\nSpec: ${channel.description}\n${channel.format}\n\nReturn ONLY valid JSON, no prose wrapper, no markdown fences.`;
  return base + brain + projectContext + channelContext;
}

function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

type GenResult =
  | { kind: 'ok'; json: Record<string, unknown>; raw: string }
  | { kind: 'error'; error: string }
  | { kind: 'loading' };

export default function CampaignsPage() {
  const [projects, setProjects] = useState<ScaleProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(CHANNELS[0].id);
  const [results, setResults] = useState<Record<string, GenResult>>({});
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setConfig(loadScaleConfig());
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/projects', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setSelectedProjectId(data.projects[0].id);
          setUsingFallback(false);
        } else {
          setProjects(FALLBACK_PROJECTS);
          setSelectedProjectId(FALLBACK_PROJECTS[0].id);
          setUsingFallback(true);
        }
      } catch {
        setProjects(FALLBACK_PROJECTS);
        setSelectedProjectId(FALLBACK_PROJECTS[0].id);
        setUsingFallback(true);
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  const project = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  const channel = useMemo(
    () => CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0],
    [selectedChannelId]
  );

  const resultKey = project ? `${project.id}::${channel.id}` : '';
  const result: GenResult | undefined = results[resultKey];

  const generate = async () => {
    if (!project || !config) return;
    setResults((r) => ({ ...r, [resultKey]: { kind: 'loading' } }));
    try {
      const brain = buildBrainPrompt();
      const system = projectSystemPrompt(project, channel, brain);
      const user = `Generate a ${channel.name} ad for ${project.name}. Return only JSON matching the required shape.`;
      const raw = await callAI(config, system, user);
      const parsed = tryParseJson(raw);
      if (parsed && typeof parsed === 'object') {
        setResults((r) => ({
          ...r,
          [resultKey]: { kind: 'ok', json: parsed as Record<string, unknown>, raw },
        }));
      } else {
        setResults((r) => ({
          ...r,
          [resultKey]: { kind: 'error', error: 'Model did not return valid JSON. Raw output below.' },
        }));
        setResults((r) => ({
          ...r,
          [resultKey + '::raw']: { kind: 'ok', json: {}, raw },
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResults((r) => ({ ...r, [resultKey]: { kind: 'error', error: message } }));
    }
  };

  const brainCount = useMemo(() => {
    const p = buildBrainPrompt();
    if (!p) return 0;
    return (p.match(/^\d+\./gm) || []).length;
  }, [results]);

  return (
    <div style={{ animation: 'sFadeIn 0.25s ease', fontFamily: S.font, color: S.textPrimary }}>
      <style>{`
        @keyframes sFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
              Campaigns
            </h1>
            <p style={{ fontSize: 13, color: S.textSecondary, margin: '6px 0 0' }}>
              Pick a project + channel, generate on-brand ad copy in seconds.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: S.textMuted, fontFamily: S.mono }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface }}>
              brain: {brainCount} rules
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface }}>
              model: {config?.model || '—'}
            </span>
          </div>
        </div>

        {usingFallback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#FDE68A',
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            Showing sample projects — no active projects found in the database.
          </div>
        )}

        {/* Project picker */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: S.textMuted, margin: '0 0 10px', fontWeight: 600 }}>
            Project
          </h2>
          {loadingProjects ? (
            <div style={{ color: S.textMuted, fontSize: 13 }}>Loading projects…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {projects.map((p) => {
                const active = p.id === selectedProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: 16,
                      borderRadius: 12,
                      background: active ? S.accentSoft : S.surface,
                      border: `1px solid ${active ? S.accentBorder : S.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      fontFamily: S.font,
                      color: S.textPrimary,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: S.white }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: S.textMuted, fontFamily: S.mono }}>{statusLabel(p.status)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: S.textSecondary, marginBottom: 4 }}>
                      {p.neighborhood} · {p.developer}
                    </div>
                    <div style={{ fontSize: 12, color: '#C8CBD3', fontFamily: S.mono }}>{p.price}</div>
                    <div style={{ fontSize: 11, color: S.textMuted, marginTop: 6 }}>
                      Completion {p.completion} · {p.floors ?? '—'} floors · {p.units ?? '—'} units
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Channel picker */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: S.textMuted, margin: '0 0 10px', fontWeight: 600 }}>
            Channel
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {CHANNELS.map((ch) => {
              const active = ch.id === selectedChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  style={{
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 10,
                    background: active ? S.accentSoft : S.surface,
                    border: `1px solid ${active ? S.accentBorder : S.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    fontFamily: S.font,
                    color: S.textPrimary,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: ch.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: S.white }}>{ch.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: S.textMuted, lineHeight: 1.5 }}>{ch.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Generate + results */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: S.textMuted, margin: 0, fontWeight: 600 }}>
              Output
            </h2>
            <button
              onClick={generate}
              disabled={!project || result?.kind === 'loading'}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: !project || result?.kind === 'loading' ? S.surfaceHover : S.accent,
                color: S.white,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: !project || result?.kind === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: S.font,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {result?.kind === 'loading' ? (
                <>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: S.white, borderRadius: '50%', animation: 'sSpin 0.8s linear infinite' }} />
                  Generating…
                </>
              ) : (
                <>Generate ad copy</>
              )}
            </button>
          </div>

          <div
            style={{
              padding: 20,
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 12,
              minHeight: 180,
            }}
          >
            {!result && (
              <div style={{ color: S.textMuted, fontSize: 13 }}>
                Pick a project and channel, then hit generate. Output appears here as structured JSON you can paste into Google Ads, Meta, or your email tool.
              </div>
            )}
            {result?.kind === 'loading' && (
              <div style={{ color: S.textMuted, fontSize: 13 }}>Calling {config?.model}…</div>
            )}
            {result?.kind === 'error' && (
              <div style={{ color: '#FCA5A5', fontSize: 13, fontFamily: S.mono, whiteSpace: 'pre-wrap' }}>
                {result.error}
              </div>
            )}
            {result?.kind === 'ok' && (
              <pre
                style={{
                  margin: 0,
                  fontFamily: S.mono,
                  fontSize: 12,
                  color: '#C8CBD3',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(result.json, null, 2)}
              </pre>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
