'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  callAI,
  loadScaleConfig,
  buildBrainPrompt,
  ScaleModelConfig,
} from '@/lib/scale-ai';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
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
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  disabled?: boolean;
  schemaHint: string;
}

type VariantKey = 'variant_a' | 'variant_b';
type GeneratedVariant = Record<string, unknown>;
interface GenerationResult {
  ok: boolean;
  data?: { variant_a: GeneratedVariant; variant_b: GeneratedVariant };
  error?: string;
  raw?: string;
}
type ResultMap = Record<string, GenerationResult>;

// ═══════════════════════════════════════════════════════════════
// Fallback sample projects
// ═══════════════════════════════════════════════════════════════
const FALLBACK_PROJECTS: ScaleProject[] = [
  { id: 'fb-king',     name: 'KING Toronto',    neighborhood: 'King West',        developer: 'Westbank',         price: '$900K – $3.2M',  completion: '2027', floors: 16, units: 514, amenities: ['Rooftop garden', 'Fitness centre', 'Co-working lounge'], status: 'PRE_CONSTRUCTION',     image: '' },
  { id: 'fb-walmer',   name: '429 Walmer',      neighborhood: 'Forest Hill',      developer: 'Camrost Felcorp',  price: '$1.4M – $4.8M',  completion: '2026', floors: 12, units: 88,  amenities: ['Concierge', 'Private dining', 'Wellness spa'],          status: 'UNDER_CONSTRUCTION',   image: '' },
  { id: 'fb-bellwoods',name: 'Bellwoods House', neighborhood: 'Trinity Bellwoods',developer: 'Curated Properties',price: '$750K – $2.1M', completion: '2028', floors: 8,  units: 64,  amenities: ['Park-view terrace', 'Library', 'Pet spa'],               status: 'PRE_LAUNCH',           image: '' },
  { id: 'fb-rosedale', name: 'Rosedale on Bloor',neighborhood: 'Yorkville',       developer: 'Easton',           price: '$1.1M – $5.6M',  completion: '2027', floors: 38, units: 412, amenities: ['Sky lounge', 'Pool', 'Valet'],                            status: 'PRE_CONSTRUCTION',     image: '' },
  { id: 'fb-junction', name: 'Junction House',  neighborhood: 'The Junction',     developer: 'Slate Asset',      price: '$620K – $1.4M',  completion: '2026', floors: 9,  units: 148, amenities: ['Bike room', 'Landscaped courtyard'],                     status: 'NEAR_COMPLETION',      image: '' },
  { id: 'fb-leslie',   name: 'Leslieville Lofts',neighborhood: 'Leslieville',     developer: 'Streetcar',        price: '$580K – $1.9M',  completion: '2028', floors: 11, units: 196, amenities: ['Dog run', 'Gym', 'Maker space'],                         status: 'PRE_LAUNCH',           image: '' },
];

// ═══════════════════════════════════════════════════════════════
// Channels
// ═══════════════════════════════════════════════════════════════
const CHANNELS: Channel[] = [
  {
    id: 'google_search', name: 'Google Search', subtitle: 'Responsive search ads',
    description: 'Generates 3 headlines (≤30 chars each) and 2 descriptions (≤90 chars each) per variant. Google will mix them to find the best combination.',
    color: '#4285F4', icon: 'G',
    schemaHint: `Each variant MUST have: { "headlines": string[3] (each ≤30 chars, no exclamation marks), "descriptions": string[2] (each ≤90 chars) }.`,
  },
  {
    id: 'google_display', name: 'Google Display', subtitle: 'Visual banner ads',
    description: 'Short headline + descriptive tagline + clear CTA for rich display placements.',
    color: '#34A853', icon: 'D',
    schemaHint: `Each variant MUST have: { "headline": string (≤25 chars), "tagline": string (≤90 chars), "cta": string (≤15 chars, from: Learn More, Register, Book Tour) }.`,
  },
  {
    id: 'meta_lead_gen', name: 'Meta Lead Gen', subtitle: 'Facebook + Instagram lead form',
    description: 'Primary text + headline + CTA that opens a lead form inside Meta. Best for capturing registrations at low cost.',
    color: '#1877F2', icon: 'f',
    schemaHint: `Each variant MUST have: { "primaryText": string (≤125 chars), "headline": string (≤40 chars), "description": string (≤30 chars), "cta": string (one of: "Learn More", "Sign Up", "Book Now", "Get Offer") }.`,
  },
  {
    id: 'meta_carousel', name: 'Meta Carousel', subtitle: 'Scrollable 3-card ad',
    description: 'Primary text + 3 carousel cards, each with its own headline and short description. Great for highlighting multiple amenities.',
    color: '#E1306C', icon: 'C',
    schemaHint: `Each variant MUST have: { "primaryText": string (≤125 chars), "cards": Array of exactly 3 objects { "headline": string (≤40 chars), "description": string (≤20 chars) } }.`,
  },
  {
    id: 'ig_stories', name: 'Instagram Stories', subtitle: 'Full-screen vertical story',
    description: 'Short vertical story caption + overlay text + sticker CTA. Drives registrations from the swipe-up.',
    color: '#F56040', icon: 'I',
    schemaHint: `Each variant MUST have: { "overlayText": string (≤40 chars, 2 lines max), "caption": string (≤90 chars), "cta": string (one of: "Swipe Up", "Tap to Register", "See More") }.`,
  },
  {
    id: 'tiktok', name: 'TikTok', subtitle: 'Coming soon',
    description: 'TikTok Spark ads are on the roadmap. Check back shortly.',
    color: '#69C9D0', icon: 'T', disabled: true,
    schemaHint: '',
  },
];

// ═══════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════
const S = {
  bg: '#0B0D11',
  surface: 'rgba(255,255,255,0.02)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.08)',
  accentStrong: 'rgba(0,102,255,0.18)',
  accentBorder: 'rgba(0,102,255,0.35)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.12)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.10)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#555B67',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function statusLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParseJson(text: string): unknown | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
  try { return JSON.parse(trimmed); } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

function buildSystemPrompt(project: ScaleProject, channel: Channel, brain: string) {
  return `You are Scale, the AI ad copywriter for CondoWizard.ca — a Toronto pre-construction condo platform. You generate ad copy for Tal Shelef, Sales Representative at Rare Real Estate Inc.

You write copy that is specific, grounded in the project details, and compliant with Ontario real estate advertising rules.${brain}

PROJECT BRIEF
- Name: ${project.name}
- Neighbourhood: ${project.neighborhood}
- Developer: ${project.developer}
- Price: ${project.price}
- Completion: ${project.completion}
- Floors / Units: ${project.floors ?? '—'} / ${project.units ?? '—'}
- Amenities: ${project.amenities.join(', ') || '—'}
- Status: ${statusLabel(project.status)}

CHANNEL: ${channel.name}
${channel.description}
${channel.schemaHint}

TASK
Produce TWO variants: variant_a should lead with the BENEFIT angle (lifestyle, design, neighbourhood). variant_b should lead with the URGENCY angle (limited suites, completion timing, price tier).

Return ONLY a JSON object shaped like:
{
  "variant_a": { ...channel schema above },
  "variant_b": { ...channel schema above }
}

No prose wrapper. No markdown fences. JSON only.`;
}

// ═══════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════
const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5" /></svg>
);
const Search = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" /></svg>;
const Sparkle = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0l1.5 4.5L13 6l-4.5 1.5L7 12l-1.5-4.5L1 6l4.5-1.5z" /></svg>;
const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 7h8M8 4l3 3-3 3" /></svg>;
const ArrowLeft = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M11 7H3M6 4L3 7l3 3" /></svg>;
const Copy = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V3a1 1 0 011-1h7" /></svg>;
const Refresh = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 7a5 5 0 11-1.5-3.5L12 5M12 2v3H9" /></svg>;
const Download = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2v8M4 7l3 3 3-3M2 12h10" /></svg>;

// ═══════════════════════════════════════════════════════════════
// Step indicator
// ═══════════════════════════════════════════════════════════════
const STEPS = ['Select projects', 'Choose channel', 'Configure', 'Review output'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '20px 0 28px', maxWidth: 720 }}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const completed = step < current;
        const active = step === current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i === STEPS.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: completed ? S.accent : active ? 'transparent' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${completed ? S.accent : active ? S.accent : S.border}`,
                color: completed ? '#fff' : active ? S.accent : S.textMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, fontFamily: S.mono,
                transition: 'all 0.2s',
              }}>
                {completed ? <Check size={12} /> : step}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: active ? S.white : completed ? S.textSecondary : S.textMuted,
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: completed ? S.accent : S.border, margin: '0 16px', minWidth: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════
export default function CampaignsWizard() {
  // Data
  const [projects, setProjects] = useState<ScaleProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channelId, setChannelId] = useState<string>('google_search');
  const [budget, setBudget] = useState(50);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [results, setResults] = useState<ResultMap>({});
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<VariantKey>('variant_a');
  const [copiedKey, setCopiedKey] = useState<string>('');
  const cancelRef = useRef(false);

  // Load config + projects
  useEffect(() => {
    setConfig(loadScaleConfig());
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/projects', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setUsingFallback(false);
        } else {
          setProjects(FALLBACK_PROJECTS);
          setUsingFallback(true);
        }
      } catch {
        setProjects(FALLBACK_PROJECTS);
        setUsingFallback(true);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  // Derived
  const channel = useMemo(() => CHANNELS.find((c) => c.id === channelId) || CHANNELS[0], [channelId]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const selectedProjects = useMemo(
    () => projects.filter((p) => selectedIds.has(p.id)),
    [projects, selectedIds]
  );

  // Actions
  const toggleProject = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const monthlyCost = budget * 30;

  const startGeneration = async () => {
    if (!config || selectedProjects.length === 0) return;
    cancelRef.current = false;
    setGenerating(true);
    setResults({});
    setGenProgress({ current: 0, total: selectedProjects.length, currentName: '' });
    setStep(4);

    const brain = buildBrainPrompt();
    const targets = selectedProjects;
    const newResults: ResultMap = {};

    for (let i = 0; i < targets.length; i++) {
      if (cancelRef.current) break;
      const p = targets[i];
      setGenProgress({ current: i, total: targets.length, currentName: p.name });

      try {
        const system = buildSystemPrompt(p, channel, brain);
        const user = `Generate a ${channel.name} ad for ${p.name}. Return JSON only — variant_a (benefit-led) and variant_b (urgency-led).`;
        const raw = await callAI(config, system, user);
        const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;

        if (parsed && parsed.variant_a && parsed.variant_b) {
          newResults[p.id] = { ok: true, data: { variant_a: parsed.variant_a, variant_b: parsed.variant_b }, raw };
        } else {
          newResults[p.id] = { ok: false, error: 'Model did not return valid variant_a / variant_b JSON.', raw };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        newResults[p.id] = { ok: false, error: message };
      }
      setResults({ ...newResults });
    }

    setGenProgress((g) => ({ ...g, current: targets.length, currentName: '' }));
    setGenerating(false);
    if (!cancelRef.current) {
      const firstId = targets[0]?.id;
      if (firstId) setActiveResultId(firstId);
    }
  };

  const cancelGeneration = () => {
    cancelRef.current = true;
    setGenerating(false);
  };

  const regenerateOne = async (projectId: string) => {
    if (!config) return;
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    setResults((r) => ({ ...r, [projectId]: { ok: false, error: 'Regenerating…' } }));
    const brain = buildBrainPrompt();
    try {
      const system = buildSystemPrompt(p, channel, brain);
      const user = `Generate a ${channel.name} ad for ${p.name}. Return JSON only — variant_a (benefit-led) and variant_b (urgency-led).`;
      const raw = await callAI(config, system, user);
      const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;
      if (parsed && parsed.variant_a && parsed.variant_b) {
        setResults((r) => ({ ...r, [projectId]: { ok: true, data: { variant_a: parsed.variant_a!, variant_b: parsed.variant_b! }, raw } }));
      } else {
        setResults((r) => ({ ...r, [projectId]: { ok: false, error: 'Model did not return valid JSON.', raw } }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResults((r) => ({ ...r, [projectId]: { ok: false, error: message } }));
    }
  };

  const copy = (text: string, key: string) => {
    try { navigator.clipboard?.writeText(text); } catch {}
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1400);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ channel: channel.id, results }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scale-${channel.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCsv = () => {
    const rows: string[] = [['project', 'variant', 'field', 'value'].map(csvEscape).join(',')];
    Object.entries(results).forEach(([pid, r]) => {
      const proj = projects.find((p) => p.id === pid);
      if (!r.ok || !r.data) return;
      (['variant_a', 'variant_b'] as VariantKey[]).forEach((vk) => {
        flattenToRows(r.data![vk]).forEach(([field, value]) => {
          rows.push([proj?.name || pid, vk, field, value].map(csvEscape).join(','));
        });
      });
    });
    copy(rows.join('\n'), 'csv-all');
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: S.font, color: S.textPrimary }}>
      <style>{`
        @keyframes sSlideIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes sSpin { to { transform: rotate(360deg); } }
        @keyframes sPulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
        .s-card { transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .s-card:hover:not(.s-disabled) { border-color: ${S.borderHover} !important; }
        .s-btn { transition: all 0.15s; }
        .s-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .s-field { transition: all 0.15s; cursor: pointer; }
        .s-field:hover { background: ${S.surfaceHover} !important; border-color: ${S.borderHover} !important; }
        input[type="range"].s-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: ${S.border}; border-radius: 2px; outline: none; }
        input[type="range"].s-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        input[type="range"].s-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        .s-scroll::-webkit-scrollbar { width: 6px; }
        .s-scroll::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 80px', animation: 'sSlideIn 0.25s ease' }}>
        {/* Step bar (hidden during review output if you want to free space, but keep visible) */}
        <StepIndicator current={step} />

        {usingFallback && step === 1 && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#FDE68A', fontSize: 12, marginBottom: 20 }}>
            Showing sample projects — no active projects found in the database.
          </div>
        )}

        {step === 1 && (
          <StepProjects
            projects={filteredProjects}
            loading={projectsLoading}
            search={search}
            onSearch={setSearch}
            selectedIds={selectedIds}
            toggleProject={toggleProject}
            selectAll={selectAll}
            deselectAll={deselectAll}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepChannel
            channelId={channelId}
            onSelect={setChannelId}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepConfigure
            selectedProjects={selectedProjects}
            channel={channel}
            budget={budget}
            setBudget={setBudget}
            monthlyCost={monthlyCost}
            config={config}
            onBack={() => setStep(2)}
            onGenerate={startGeneration}
          />
        )}

        {step === 4 && (
          <StepReview
            projects={selectedProjects}
            results={results}
            channel={channel}
            activeResultId={activeResultId || selectedProjects[0]?.id || null}
            setActiveResultId={setActiveResultId}
            activeVariant={activeVariant}
            setActiveVariant={setActiveVariant}
            copiedKey={copiedKey}
            copy={copy}
            regenerate={regenerateOne}
            exportJson={exportJson}
            copyCsv={copyCsv}
            onBack={() => setStep(3)}
          />
        )}
      </div>

      {generating && (
        <GeneratingOverlay
          current={genProgress.current}
          total={genProgress.total}
          currentName={genProgress.currentName}
          onCancel={cancelGeneration}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 1 — Projects
// ═══════════════════════════════════════════════════════════════
function StepProjects(props: {
  projects: ScaleProject[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  selectedIds: Set<string>;
  toggleProject: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  onContinue: () => void;
}) {
  const { projects, loading, search, onSearch, selectedIds, toggleProject, selectAll, deselectAll, onContinue } = props;
  const allSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id));

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Select projects to advertise
      </h1>
      <p style={{ fontSize: 14, color: S.textSecondary, margin: '8px 0 24px' }}>
        Pick one or more active projects. Scale generates on-brand ad copy for every one you select.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: S.textMuted, display: 'flex' }}>
            <Search />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, neighborhood, developer…"
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10,
              background: S.surface, border: `1px solid ${S.border}`,
              color: S.textPrimary, fontSize: 14, fontFamily: S.font, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={allSelected ? deselectAll : selectAll}
          className="s-btn"
          style={{
            padding: '10px 16px', borderRadius: 10,
            background: S.surface, border: `1px solid ${S.border}`,
            color: S.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
          }}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: S.textMuted, fontSize: 14, padding: 40 }}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div style={{ color: S.textMuted, fontSize: 14, padding: 40, textAlign: 'center', border: `1px dashed ${S.border}`, borderRadius: 12 }}>
          No projects match “{search}”.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {projects.map((p) => {
            const selected = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProject(p.id)}
                className="s-card"
                style={{
                  position: 'relative', textAlign: 'left', cursor: 'pointer',
                  background: selected ? S.accentSoft : S.surface,
                  border: `1px solid ${selected ? S.accentBorder : S.border}`,
                  borderRadius: 14, padding: 0, overflow: 'hidden', fontFamily: S.font, color: S.textPrimary,
                }}
              >
                <div style={{
                  height: 120, background: p.image ? `center/cover no-repeat url(${p.image})` : `linear-gradient(135deg, ${S.surfaceHover} 0%, ${S.surface} 100%)`,
                  position: 'relative', borderBottom: `1px solid ${S.border}`,
                }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: selected ? S.accent : 'rgba(0,0,0,0.4)',
                      border: `1.5px solid ${selected ? S.accent : 'rgba(255,255,255,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      backdropFilter: 'blur(8px)',
                    }}>
                      {selected && <Check size={12} />}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 100, background: S.greenSoft, border: '1px solid rgba(16,185,129,0.3)', color: S.green, fontSize: 11, fontWeight: 600 }}>
                    {statusLabel(p.status)}
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 10 }}>{p.neighborhood} · {p.developer}</div>
                  <div style={{ fontSize: 13, color: '#C8CBD3', fontFamily: S.mono, marginBottom: 10 }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: S.textMuted, display: 'flex', gap: 10 }}>
                    <span>Completion {p.completion}</span>
                    <span>·</span>
                    <span>{p.floors ?? '—'} floors</span>
                    <span>·</span>
                    <span>{p.units ?? '—'} units</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomBar>
        <span style={{ color: selectedIds.size ? S.textPrimary : S.textMuted, fontSize: 14 }}>
          <strong style={{ color: S.white, fontWeight: 600 }}>{selectedIds.size}</strong>{' '}
          project{selectedIds.size === 1 ? '' : 's'} selected
        </span>
        <button
          onClick={onContinue}
          disabled={selectedIds.size === 0}
          className="s-btn"
          style={{
            padding: '12px 22px', borderRadius: 10,
            background: selectedIds.size === 0 ? S.surfaceHover : S.accent,
            color: selectedIds.size === 0 ? S.textMuted : S.white,
            border: 'none', fontSize: 14, fontWeight: 600,
            cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: S.font,
          }}
        >
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 2 — Channel
// ═══════════════════════════════════════════════════════════════
function StepChannel(props: {
  channelId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { channelId, onSelect, onBack, onContinue } = props;
  const active = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Choose ad channel
      </h1>
      <p style={{ fontSize: 14, color: S.textSecondary, margin: '8px 0 24px' }}>
        Pick where these ads will run. Scale tailors the format and length to each channel&apos;s spec.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {CHANNELS.map((ch) => {
          const selected = ch.id === channelId && !ch.disabled;
          return (
            <button
              key={ch.id}
              onClick={() => !ch.disabled && onSelect(ch.id)}
              disabled={ch.disabled}
              className={`s-card ${ch.disabled ? 's-disabled' : ''}`}
              style={{
                position: 'relative', textAlign: 'left',
                background: selected ? S.accentSoft : S.surface,
                border: `1px solid ${selected ? S.accentBorder : S.border}`,
                borderRadius: 14, padding: 20,
                cursor: ch.disabled ? 'not-allowed' : 'pointer',
                opacity: ch.disabled ? 0.45 : 1,
                fontFamily: S.font, color: S.textPrimary,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: 7, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={12} />
                </div>
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${ch.color}20`, color: ch.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, fontFamily: S.mono, marginBottom: 14,
              }}>
                {ch.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: S.white, marginBottom: 4 }}>{ch.name}</div>
              <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: selected ? 10 : 0 }}>{ch.subtitle}</div>
              {selected && (
                <div style={{ fontSize: 12, color: '#C8CBD3', lineHeight: 1.6, paddingTop: 10, borderTop: `1px solid ${S.border}`, marginTop: 2 }}>
                  {ch.description}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <button onClick={onContinue} disabled={active.disabled} className="s-btn" style={navButtonStyle('primary', active.disabled)}>
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 3 — Configure
// ═══════════════════════════════════════════════════════════════
function StepConfigure(props: {
  selectedProjects: ScaleProject[];
  channel: Channel;
  budget: number;
  setBudget: (n: number) => void;
  monthlyCost: number;
  config: ScaleModelConfig | null;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const { selectedProjects, channel, budget, setBudget, monthlyCost, config, onBack, onGenerate } = props;
  const totalCampaigns = selectedProjects.length;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Configure campaign
      </h1>
      <p style={{ fontSize: 14, color: S.textSecondary, margin: '8px 0 24px' }}>
        Final review before Scale calls the AI.
      </p>

      {/* Summary card */}
      <div style={{
        background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
          <Stat label="Projects" value={totalCampaigns.toString()} />
          <Stat label="Channel" value={channel.name} accent={channel.color} />
          <Stat label="Variants" value="2 A/B" />
          <Stat label="Campaigns" value={(totalCampaigns * 2).toString()} />
        </div>

        <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.textMuted, fontWeight: 600, marginBottom: 10 }}>
            Selected projects
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedProjects.map((p) => (
              <span key={p.id} style={{
                padding: '6px 12px', borderRadius: 100, background: S.accentSoft,
                border: `1px solid ${S.accentBorder}`, color: '#93C5FD', fontSize: 12, fontWeight: 500,
              }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Budget */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.textMuted, fontWeight: 600, marginBottom: 6 }}>
              Daily budget per campaign
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: S.white, letterSpacing: '-0.02em', fontFamily: S.font }}>
              ${budget}
              <span style={{ fontSize: 14, color: S.textMuted, fontWeight: 500, marginLeft: 6 }}>/ day</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.textMuted, fontWeight: 600, marginBottom: 6 }}>
              Est. monthly spend
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: S.textSecondary, fontFamily: S.mono }}>
              ${(monthlyCost * totalCampaigns).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>
              ${monthlyCost.toLocaleString()} × {totalCampaigns} project{totalCampaigns === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value, 10))}
          className="s-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: S.textMuted, fontFamily: S.mono }}>$10</span>
          <span style={{ fontSize: 11, color: S.textMuted, fontFamily: S.mono }}>$200</span>
        </div>
      </div>

      {/* What AI will generate */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.textMuted, fontWeight: 600, marginBottom: 14 }}>
          Scale will generate
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            `2 full copy variants for each ${channel.name} ad`,
            `Variant A leads with benefit & lifestyle; Variant B leads with urgency`,
            `All copy respects your Agent Brain rules (tone, legal, banned words)`,
            `Output structured as JSON — paste directly into ${channel.name} or export CSV`,
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#C8CBD3', lineHeight: 1.5 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: S.accentSoft, color: S.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={10} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        {config && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${S.border}`, fontSize: 11, color: S.textMuted, fontFamily: S.mono }}>
            Using {config.provider} · {config.model}
          </div>
        )}
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <button
          onClick={onGenerate}
          disabled={!config || totalCampaigns === 0}
          className="s-btn"
          style={{
            padding: '14px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
            color: S.white, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: !config || totalCampaigns === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
            opacity: !config || totalCampaigns === 0 ? 0.5 : 1,
            boxShadow: '0 6px 20px rgba(0,102,255,0.3)',
          }}
        >
          <Sparkle /> Generate {totalCampaigns} campaign{totalCampaigns === 1 ? '' : 's'}
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 4 — Review
// ═══════════════════════════════════════════════════════════════
function StepReview(props: {
  projects: ScaleProject[];
  results: ResultMap;
  channel: Channel;
  activeResultId: string | null;
  setActiveResultId: (id: string) => void;
  activeVariant: VariantKey;
  setActiveVariant: (v: VariantKey) => void;
  copiedKey: string;
  copy: (text: string, key: string) => void;
  regenerate: (projectId: string) => void;
  exportJson: () => void;
  copyCsv: () => void;
  onBack: () => void;
}) {
  const {
    projects, results, channel, activeResultId, setActiveResultId,
    activeVariant, setActiveVariant, copiedKey, copy, regenerate,
    exportJson, copyCsv, onBack,
  } = props;

  const active = projects.find((p) => p.id === activeResultId) || projects[0];
  const activeResult = active ? results[active.id] : undefined;
  const variantData = activeResult?.ok && activeResult.data ? activeResult.data[activeVariant] : null;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
            Review output
          </h1>
          <p style={{ fontSize: 14, color: S.textSecondary, margin: '8px 0 0' }}>
            {Object.values(results).filter((r) => r.ok).length} of {projects.length} generated · {channel.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyCsv} className="s-btn" style={headerBtn(copiedKey === 'csv-all' ? 'success' : 'ghost')}>
            <Copy /> {copiedKey === 'csv-all' ? 'Copied!' : 'Copy CSV'}
          </button>
          <button onClick={exportJson} className="s-btn" style={headerBtn('ghost')}>
            <Download /> Export JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div className="s-scroll" style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 8, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {projects.map((p) => {
            const r = results[p.id];
            const isActive = p.id === active?.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveResultId(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8,
                  background: isActive ? S.accentSoft : 'transparent',
                  border: `1px solid ${isActive ? S.accentBorder : 'transparent'}`,
                  cursor: 'pointer', marginBottom: 2, fontFamily: S.font, color: S.textPrimary,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? S.white : S.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: S.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.neighborhood}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 5,
                  fontFamily: S.mono, flexShrink: 0, marginLeft: 6,
                  background: !r ? 'rgba(255,255,255,0.05)' : r.ok ? S.greenSoft : S.redSoft,
                  color: !r ? S.textMuted : r.ok ? S.green : S.red,
                }}>
                  {!r ? '…' : r.ok ? 'OK' : 'ERR'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Output pane */}
        <div style={{ minWidth: 0 }}>
          {active && (
            <>
              {/* Variant toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, padding: 4, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10 }}>
                  {(['variant_a', 'variant_b'] as VariantKey[]).map((v) => {
                    const isA = v === 'variant_a';
                    const isActiveV = v === activeVariant;
                    return (
                      <button
                        key={v}
                        onClick={() => setActiveVariant(v)}
                        style={{
                          padding: '8px 16px', borderRadius: 7,
                          background: isActiveV ? S.accent : 'transparent',
                          color: isActiveV ? S.white : S.textSecondary,
                          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        Variant {isA ? 'A' : 'B'}
                        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>
                          · {isA ? 'benefit' : 'urgency'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeResult?.ok && activeResult.data && (
                    <button
                      className="s-btn"
                      onClick={() => {
                        const section = activeResult.data![activeVariant];
                        copy(JSON.stringify(section, null, 2), `copy-all-${active.id}-${activeVariant}`);
                      }}
                      style={headerBtn(copiedKey === `copy-all-${active.id}-${activeVariant}` ? 'success' : 'ghost')}
                    >
                      <Copy /> {copiedKey === `copy-all-${active.id}-${activeVariant}` ? 'Copied!' : 'Copy all'}
                    </button>
                  )}
                  <button onClick={() => regenerate(active.id)} className="s-btn" style={headerBtn('ghost')}>
                    <Refresh /> Regenerate
                  </button>
                </div>
              </div>

              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, minHeight: 240 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                      {active.name}
                    </div>
                    <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
                      {channel.name} · {active.neighborhood}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: S.textMuted, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {activeVariant.replace('_', ' ')}
                  </span>
                </div>

                {!activeResult && (
                  <div style={{ color: S.textMuted, fontSize: 13 }}>Waiting for generation…</div>
                )}
                {activeResult && !activeResult.ok && (
                  <div style={{ padding: 16, background: S.redSoft, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.red, marginBottom: 6 }}>Generation failed</div>
                    <div style={{ fontSize: 12, color: '#FCA5A5', fontFamily: S.mono, lineHeight: 1.5, marginBottom: 12 }}>
                      {activeResult.error}
                    </div>
                    <button onClick={() => regenerate(active.id)} className="s-btn" style={navButtonStyle('primary')}>
                      <Refresh /> Retry
                    </button>
                  </div>
                )}
                {activeResult?.ok && variantData && (
                  <VariantRenderer
                    data={variantData}
                    keyPrefix={`${active.id}-${activeVariant}`}
                    copy={copy}
                    copiedKey={copiedKey}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <div style={{ color: S.textMuted, fontSize: 12, fontFamily: S.mono }}>
          {Object.values(results).filter((r) => r.ok).length} / {projects.length} OK
        </div>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Variant field renderer (recursive / dynamic)
// ═══════════════════════════════════════════════════════════════
function VariantRenderer({
  data, keyPrefix, copy, copiedKey,
}: {
  data: Record<string, unknown>;
  keyPrefix: string;
  copy: (text: string, key: string) => void;
  copiedKey: string;
}) {
  const entries = Object.entries(data);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {entries.map(([field, value]) => (
        <FieldBlock
          key={field}
          field={field}
          value={value}
          keyId={`${keyPrefix}-${field}`}
          copy={copy}
          copiedKey={copiedKey}
        />
      ))}
    </div>
  );
}

function FieldBlock({
  field, value, keyId, copy, copiedKey,
}: {
  field: string;
  value: unknown;
  keyId: string;
  copy: (text: string, key: string) => void;
  copiedKey: string;
}) {
  const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

  if (Array.isArray(value)) {
    return (
      <div>
        <div style={sectionLabelStyle}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {value.map((item, i) => {
            if (item && typeof item === 'object') {
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 10,
                  background: S.surfaceHover, border: `1px solid ${S.border}`,
                }}>
                  <div style={{ fontSize: 10, color: S.textMuted, fontFamily: S.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Item {i + 1}
                  </div>
                  <VariantRenderer
                    data={item as Record<string, unknown>}
                    keyPrefix={`${keyId}-${i}`}
                    copy={copy}
                    copiedKey={copiedKey}
                  />
                </div>
              );
            }
            const text = String(item);
            const k = `${keyId}-${i}`;
            return (
              <CopyableRow key={i} text={text} onCopy={() => copy(text, k)} copied={copiedKey === k} index={i + 1} />
            );
          })}
        </div>
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div>
        <div style={sectionLabelStyle}>{label}</div>
        <div style={{ padding: 14, borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}` }}>
          <VariantRenderer
            data={value as Record<string, unknown>}
            keyPrefix={keyId}
            copy={copy}
            copiedKey={copiedKey}
          />
        </div>
      </div>
    );
  }

  const text = String(value ?? '');
  return (
    <div>
      <div style={sectionLabelStyle}>{label}</div>
      <CopyableRow text={text} onCopy={() => copy(text, keyId)} copied={copiedKey === keyId} />
    </div>
  );
}

function CopyableRow({
  text, onCopy, copied, index,
}: { text: string; onCopy: () => void; copied: boolean; index?: number }) {
  return (
    <div
      className="s-field"
      onClick={onCopy}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        padding: '12px 14px', borderRadius: 9,
        background: S.surfaceHover, border: `1px solid ${S.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {index != null && (
          <span style={{ fontSize: 11, color: S.textMuted, fontFamily: S.mono, paddingTop: 2, flexShrink: 0 }}>
            {index}.
          </span>
        )}
        <div style={{ fontSize: 13, color: '#E2E4E9', lineHeight: 1.55, fontFamily: S.mono, wordBreak: 'break-word' }}>
          {text}
        </div>
      </div>
      <span style={{
        fontSize: 10, padding: '3px 8px', borderRadius: 5, flexShrink: 0, fontFamily: S.mono,
        color: copied ? S.green : S.textMuted,
        background: copied ? S.greenSoft : 'transparent',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : S.border}`,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <Copy /> {copied ? 'Copied' : 'Copy'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Generating overlay
// ═══════════════════════════════════════════════════════════════
function GeneratingOverlay({
  current, total, currentName, onCancel,
}: { current: number; total: number; currentName: string; onCancel: () => void }) {
  const pct = total === 0 ? 0 : Math.round(((current + (currentName ? 0.5 : 1)) / total) * 100);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(11,13,17,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.font,
    }}>
      <div style={{
        width: 420, maxWidth: '90vw',
        background: S.bg, border: `1px solid ${S.border}`, borderRadius: 16,
        padding: 32, textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 20px',
          border: `3px solid ${S.border}`, borderTopColor: S.accent, borderRadius: '50%',
          animation: 'sSpin 0.9s linear infinite',
        }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 6 }}>
          Generating campaigns
        </div>
        <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 20, minHeight: 18 }}>
          {currentName ? <>Working on <span style={{ color: S.white, fontWeight: 500 }}>{currentName}</span>…</> : 'Preparing…'}
        </div>

        <div style={{ height: 6, borderRadius: 3, background: S.border, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0066FF 0%, #00D4AA 100%)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: S.textMuted, fontFamily: S.mono, marginBottom: 22 }}>
          {Math.min(current + 1, total)} / {total}
        </div>

        <button
          onClick={onCancel}
          className="s-btn"
          style={{
            padding: '9px 18px', borderRadius: 8, background: 'transparent',
            border: `1px solid ${S.border}`, color: S.textSecondary,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Small shared bits
// ═══════════════════════════════════════════════════════════════
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, marginTop: 32,
      paddingTop: 20, paddingBottom: 20,
      borderTop: `1px solid ${S.border}`,
      background: `linear-gradient(to top, ${S.bg} 60%, rgba(11,13,17,0.6))`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: S.textMuted, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent || S.white, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
  color: S.textMuted, fontWeight: 600, marginBottom: 8,
};

function navButtonStyle(variant: 'primary' | 'ghost', disabled?: boolean): React.CSSProperties {
  if (variant === 'primary') {
    return {
      padding: '12px 22px', borderRadius: 10,
      background: disabled ? S.surfaceHover : S.accent,
      color: disabled ? S.textMuted : S.white,
      border: 'none', fontSize: 14, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, fontFamily: S.font,
    };
  }
  return {
    padding: '12px 18px', borderRadius: 10,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: S.font,
  };
}

function headerBtn(variant: 'ghost' | 'success'): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 8,
    background: variant === 'success' ? S.greenSoft : S.surface,
    border: `1px solid ${variant === 'success' ? 'rgba(16,185,129,0.3)' : S.border}`,
    color: variant === 'success' ? S.green : S.textSecondary,
    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
    display: 'flex', alignItems: 'center', gap: 6,
  };
}

function csvEscape(v: string | number) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function flattenToRows(obj: unknown, prefix = ''): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      out.push(...flattenToRows(item, prefix ? `${prefix}[${i}]` : `[${i}]`));
    });
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      out.push(...flattenToRows(v, prefix ? `${prefix}.${k}` : k));
    });
  } else {
    out.push([prefix, String(obj ?? '')]);
  }
  return out;
}

