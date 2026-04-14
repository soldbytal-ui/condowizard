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
type CampaignType =
  | 'pre_construction'
  | 'area_pages'
  | 'community_listings'
  | 'condo_staging'
  | 'short_term_rentals'
  | 'custom';

type TargetKind = 'projects' | 'neighborhoods' | 'communities' | 'none' | 'custom';

interface CampaignTypeMeta {
  id: CampaignType;
  label: string;
  description: string;
  color: string;
  iconPath: string;
  targetKind: TargetKind;
  stepLabel: string;        // label for step 2 when this type is chosen
  promptAngle: string;      // AI system-prompt context specific to this type
}

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
  description?: string;
  buildingType?: string;
  status: string;
  image: string;
  images?: string[];
}

interface ScaleNeighborhood { id: string; name: string; slug: string; landing: string; region: string }
interface ScaleCommunity { id: string; name: string; slug: string }

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

interface TargetRef {
  id: string;
  displayName: string;
  subtitle?: string;
  image?: string;
}

// ═══════════════════════════════════════════════════════════════
// Campaign types
// ═══════════════════════════════════════════════════════════════
const CAMPAIGN_TYPES: CampaignTypeMeta[] = [
  {
    id: 'pre_construction',
    label: 'Pre-Construction Condos',
    description: 'Advertise specific pre-construction projects from your database.',
    color: '#0066FF',
    iconPath: 'M3 20V10l5-4 5 4v10H3z M13 20V6l5-3 3 3v14H13z M3 20h18 M6 14h2 M6 17h2 M17 10h2 M17 14h2 M17 17h2',
    targetKind: 'projects',
    stepLabel: 'Select projects',
    promptAngle:
      'Ad focus: specific pre-construction condo project. Highlight the project\u2019s unique architecture, amenities, price point, deposit structure, and completion timing. Drive registrations for VIP Access / floor plans.',
  },
  {
    id: 'area_pages',
    label: 'Area Pages',
    description: 'Target neighborhood searches — "new condos in King West", "pre-construction Yorkville".',
    color: '#8B5CF6',
    iconPath: 'M12 2a7 7 0 00-7 7c0 4.5 7 13 7 13s7-8.5 7-13a7 7 0 00-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z',
    targetKind: 'neighborhoods',
    stepLabel: 'Select neighborhoods',
    promptAngle:
      'Ad focus: the landing page is a neighborhood hub listing every new condo in that area. Position as the definitive local resource. Emphasize the neighbourhood\u2019s lifestyle, transit, restaurants, and the breadth of projects available. Drive clicks to the neighbourhood page, not a single project.',
  },
  {
    id: 'community_listings',
    label: 'Community Listings',
    description: 'Homes for sale in specific communities — powered by Repliers MLS data.',
    color: '#10B981',
    iconPath: 'M3 12l9-8 9 8v8a2 2 0 01-2 2h-4v-6H10v6H6a2 2 0 01-2-2v-8z',
    targetKind: 'communities',
    stepLabel: 'Select communities',
    promptAngle:
      'Ad focus: live MLS listings in a specific GTA community. Highlight inventory breadth, recent sold comps, and local character. Drive clicks to the live listings feed. Never quote specific prices \u2014 use "from the low $X" style ranges.',
  },
  {
    id: 'condo_staging',
    label: 'Condo Staging',
    description: 'Generate ads for condo staging services in Toronto.',
    color: '#F59E0B',
    iconPath: 'M4 20l6-6 3 3 7-7 M4 20h16 M14 4l4 4 M10 4h8v8',
    targetKind: 'none',
    stepLabel: 'Staging brief',
    promptAngle:
      'Ad focus: professional condo staging services in Toronto. Sell on faster sell times, higher final price, before/after transformation, and full-service logistics (consult, installation, de-stage). CTA: Book a staging consult.',
  },
  {
    id: 'short_term_rentals',
    label: 'Short-Term Rentals',
    description: 'Airbnb & furnished rental condos for investors.',
    color: '#EC4899',
    iconPath: 'M7 11V7a5 5 0 0110 0v4 M5 11h14v10H5z M12 16v2',
    targetKind: 'projects',
    stepLabel: 'Select investment projects',
    promptAngle:
      'Ad focus: investment condos suitable for Toronto\u2019s short-term rental (STR) and furnished-rental markets. Lead with rental yield, cash flow potential, Airbnb/MTR regulation compliance, and assignment potential before closing. Audience: investors, not end-users.',
  },
  {
    id: 'custom',
    label: 'Custom Campaign',
    description: 'Write a custom brief and let AI generate the campaign.',
    color: '#6366F1',
    iconPath: 'M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z',
    targetKind: 'custom',
    stepLabel: 'Custom brief',
    promptAngle:
      'Ad focus: whatever the user described in their custom brief. Follow their wording closely but still respect all Agent Brain rules (tone, legal, banned words).',
  },
];

// ═══════════════════════════════════════════════════════════════
// Toronto neighborhoods (Area Pages)
// ═══════════════════════════════════════════════════════════════
const TORONTO_REGIONS: Record<string, string[]> = {
  Downtown: ['Downtown Core', 'King West', 'Liberty Village', 'Queen West', 'Waterfront', 'CityPlace', 'Fort York', 'Canary District'],
  Midtown: ['Yorkville', 'The Annex', 'Midtown', 'Yonge & Eglinton', 'Forest Hill', 'Rosedale'],
  East: ['Leslieville', 'Riverside', 'Danforth', 'Leaside'],
  West: ['High Park', 'Junction', 'Roncesvalles'],
  Suburbs: ['North York', 'Scarborough', 'Etobicoke'],
  GTA: ['Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Oakville', 'Burlington', 'Hamilton', 'Brampton'],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const TORONTO_NEIGHBORHOODS: ScaleNeighborhood[] = Object.entries(TORONTO_REGIONS).flatMap(([region, names]) =>
  names.map((name) => ({ id: `n-${slugify(name)}`, name, slug: slugify(name), landing: `condowizard.ca/areas/${slugify(name)}`, region }))
);

// ═══════════════════════════════════════════════════════════════
// GTA communities (Community Listings)
// ═══════════════════════════════════════════════════════════════
const GTA_COMMUNITY_NAMES = [
  'The Beaches', 'Roncesvalles Village', 'Leslieville', 'Riverdale', 'Danforth Village',
  'High Park', 'Bloor West Village', 'The Kingsway', 'Mimico', 'Long Branch',
  'Leaside', 'Davisville Village', 'Summerhill', 'Moore Park', 'Lawrence Park',
  'Bayview Village', 'Don Mills', 'Agincourt', 'Malvern', 'Willowdale',
  'Thornhill', 'Unionville', 'Streetsville', 'Port Credit', 'Oakville Old Town',
  'Burlington Downtown', 'Ancaster', 'Dundas', 'Waterdown', 'Milton Downtown',
];
const GTA_COMMUNITIES: ScaleCommunity[] = GTA_COMMUNITY_NAMES.map((n) => ({ id: `c-${slugify(n)}`, name: n, slug: slugify(n) }));

// ═══════════════════════════════════════════════════════════════
// Fallback projects (used only if fetch to /api/admin/scale/projects itself fails)
// ═══════════════════════════════════════════════════════════════
const FALLBACK_PROJECTS: ScaleProject[] = [
  { id: 'fb-king',      name: 'KING Toronto',    neighborhood: 'King West',        developer: 'Westbank',          price: '$900K – $3.2M',  completion: '2027', floors: 16, units: 514, amenities: ['Rooftop garden', 'Fitness centre'], status: 'PRE_CONSTRUCTION',     image: '' },
  { id: 'fb-walmer',    name: '429 Walmer',      neighborhood: 'Forest Hill',      developer: 'Camrost Felcorp',   price: '$1.4M – $4.8M',  completion: '2026', floors: 12, units: 88,  amenities: ['Concierge', 'Private dining'],      status: 'UNDER_CONSTRUCTION',   image: '' },
  { id: 'fb-bellwoods', name: 'Bellwoods House', neighborhood: 'Trinity Bellwoods',developer: 'Curated Properties', price: '$750K – $2.1M', completion: '2028', floors: 8,  units: 64,  amenities: ['Park-view terrace'],                 status: 'PRE_LAUNCH',           image: '' },
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
  accentSoft: 'rgba(0,102,255,0.10)',
  accentStrong: 'rgba(0,102,255,0.18)',
  accentBorder: 'rgba(0,102,255,0.35)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.12)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.10)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  textDim: '#555B67',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em',
  color: S.textMuted, fontWeight: 600, marginBottom: 10,
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

function csvEscape(v: string | number) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function flattenToRows(obj: unknown, prefix = ''): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => { out.push(...flattenToRows(item, prefix ? `${prefix}[${i}]` : `[${i}]`)); });
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => { out.push(...flattenToRows(v, prefix ? `${prefix}.${k}` : k)); });
  } else {
    out.push([prefix, String(obj ?? '')]);
  }
  return out;
}

// Build a system prompt that varies by campaign type.
function buildSystemPrompt(args: {
  campaignMeta: CampaignTypeMeta;
  channel: Channel;
  brain: string;
  project?: ScaleProject;
  neighborhood?: ScaleNeighborhood;
  community?: ScaleCommunity;
  customBrief?: string;
}) {
  const { campaignMeta, channel, brain, project, neighborhood, community, customBrief } = args;

  const base = `You are Scale, the AI ad copywriter for CondoWizard.ca \u2014 a Toronto real estate platform. You generate ad copy for Tal Shelef, Sales Representative at Rare Real Estate Inc.

You write copy that is specific, grounded in the brief below, and compliant with Ontario real estate advertising rules.${brain}

CAMPAIGN TYPE: ${campaignMeta.label}
${campaignMeta.promptAngle}`;

  let brief = '';
  if (project) {
    brief = `
PROJECT BRIEF
- Name: ${project.name}
- Neighbourhood: ${project.neighborhood}
- Developer: ${project.developer}
- Price: ${project.price}
- Completion: ${project.completion}
- Floors / Units: ${project.floors ?? '\u2014'} / ${project.units ?? '\u2014'}
- Amenities: ${project.amenities.join(', ') || '\u2014'}
- Status: ${statusLabel(project.status)}
- Landing page: condowizard.ca/pre-construction/${project.slug || slugify(project.name)}`;
  } else if (neighborhood) {
    brief = `
NEIGHBOURHOOD BRIEF
- Name: ${neighborhood.name}
- Region: ${neighborhood.region}
- Landing page: ${neighborhood.landing}
- Ad intent: pull searchers looking for "new condos in ${neighborhood.name}" or "pre-construction ${neighborhood.name}" into a neighbourhood hub that lists every active project.`;
  } else if (community) {
    brief = `
COMMUNITY BRIEF
- Community: ${community.name}
- Landing page: condowizard.ca/communities/${community.slug}
- Ad intent: live MLS homes for sale in ${community.name}. Highlight inventory breadth and local character, not specific prices.`;
  } else if (customBrief) {
    brief = `
CUSTOM BRIEF (user-provided)
"""
${customBrief.trim()}
"""`;
  } else {
    brief = `
SERVICE BRIEF
- Service: Professional condo staging in Toronto by Tal Shelef's team.
- Value: faster sell times, higher final sale prices, full-service logistics (consult \u2192 install \u2192 de-stage).
- Landing page: condowizard.ca/staging
- CTA: Book a staging consult.`;
  }

  return `${base}
${brief}

CHANNEL: ${channel.name}
${channel.description}
${channel.schemaHint}

TASK
Produce TWO variants: variant_a should lead with the BENEFIT / lifestyle angle. variant_b should lead with the URGENCY / timing angle.

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
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7l3 3 5-5" /></svg>
);
const Search = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" /></svg>;
const Sparkle = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0l1.5 4.5L13 6l-4.5 1.5L7 12l-1.5-4.5L1 6l4.5-1.5z" /></svg>;
const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h8M8 4l3 3-3 3" /></svg>;
const ArrowLeft = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 7H3M6 4L3 7l3 3" /></svg>;
const Copy = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V3a1 1 0 011-1h7" /></svg>;
const Refresh = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 7a5 5 0 11-1.5-3.5L12 5M12 2v3H9" /></svg>;
const Download = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2v8M4 7l3 3 3-3M2 12h10" /></svg>;

function CampaignIcon({ path, color, size = 28 }: { path: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((d, i) => <path key={i} d={(i === 0 ? '' : 'M') + d} />)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step indicator (5 steps; adapts label for step 2 by campaign type)
// ═══════════════════════════════════════════════════════════════
function StepIndicator({ current, stepLabels, skipStep2 }: { current: number; stepLabels: string[]; skipStep2: boolean }) {
  const labels = skipStep2 ? stepLabels.filter((_, i) => i !== 1) : stepLabels;
  const logicalCurrent = skipStep2 && current > 2 ? current - 1 : current;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '20px 0 32px', maxWidth: 900 }}>
      {labels.map((label, i) => {
        const step = i + 1;
        const completed = step < logicalCurrent;
        const active = step === logicalCurrent;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i === labels.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: completed ? S.accent : active ? 'transparent' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${completed ? S.accent : active ? S.accent : S.border}`,
                color: completed ? '#fff' : active ? S.accent : S.textMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, fontFamily: S.mono,
                transition: 'all 0.2s',
              }}>
                {completed ? <Check size={14} /> : step}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 500,
                color: active ? S.white : completed ? S.textSecondary : S.textMuted,
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: completed ? S.accent : S.border, margin: '0 18px', minWidth: 20 }} />
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
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [search, setSearch] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customBrief, setCustomBrief] = useState('');
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

  const campaignMeta = useMemo(
    () => CAMPAIGN_TYPES.find((c) => c.id === campaignType) || null,
    [campaignType]
  );
  const channel = useMemo(() => CHANNELS.find((c) => c.id === channelId) || CHANNELS[0], [channelId]);
  const skipTargetStep = campaignType === 'condo_staging';

  // Filtered projects for Step 2 (pre_construction, short_term_rentals)
  const neighborhoodOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.neighborhood && p.neighborhood !== '—') set.add(p.neighborhood); });
    return Array.from(set).sort();
  }, [projects]);
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.status) set.add(p.status); });
    return Array.from(set).sort();
  }, [projects]);
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (neighborhoodFilter !== 'all' && p.neighborhood !== neighborhoodFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.neighborhood} ${p.developer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, search, neighborhoodFilter, statusFilter]);

  const filteredNeighborhoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TORONTO_NEIGHBORHOODS;
    return TORONTO_NEIGHBORHOODS.filter((n) => n.name.toLowerCase().includes(q) || n.region.toLowerCase().includes(q));
  }, [search]);

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GTA_COMMUNITIES;
    return GTA_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  // Derive the targets the user has selected
  const selectedTargets: TargetRef[] = useMemo(() => {
    if (!campaignMeta) return [];
    if (campaignMeta.targetKind === 'projects') {
      return projects
        .filter((p) => selectedIds.has(p.id))
        .map((p) => ({ id: p.id, displayName: p.name, subtitle: `${p.neighborhood} · ${p.developer}`, image: p.image }));
    }
    if (campaignMeta.targetKind === 'neighborhoods') {
      return TORONTO_NEIGHBORHOODS
        .filter((n) => selectedIds.has(n.id))
        .map((n) => ({ id: n.id, displayName: n.name, subtitle: n.landing }));
    }
    if (campaignMeta.targetKind === 'communities') {
      return GTA_COMMUNITIES
        .filter((c) => selectedIds.has(c.id))
        .map((c) => ({ id: c.id, displayName: c.name, subtitle: `Homes for sale in ${c.name}` }));
    }
    if (campaignMeta.targetKind === 'none') {
      return [{ id: 'staging', displayName: 'Toronto Condo Staging', subtitle: 'Full-service staging' }];
    }
    if (campaignMeta.targetKind === 'custom') {
      const preview = customBrief.trim().slice(0, 80) || 'Custom brief';
      return customBrief.trim() ? [{ id: 'custom', displayName: 'Custom campaign', subtitle: preview }] : [];
    }
    return [];
  }, [campaignMeta, projects, selectedIds, customBrief]);

  const canContinueTargets = selectedTargets.length > 0;

  // Actions
  const pickCampaignType = (id: CampaignType) => {
    if (campaignType !== id) {
      setSelectedIds(new Set());
      setSearch('');
      setNeighborhoodFilter('all');
      setStatusFilter('all');
    }
    setCampaignType(id);
  };

  const toggleId = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllFiltered = () => {
    if (!campaignMeta) return;
    if (campaignMeta.targetKind === 'projects') setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
    if (campaignMeta.targetKind === 'neighborhoods') setSelectedIds(new Set(filteredNeighborhoods.map((n) => n.id)));
    if (campaignMeta.targetKind === 'communities') setSelectedIds(new Set(filteredCommunities.map((c) => c.id)));
  };
  const deselectAll = () => setSelectedIds(new Set());

  const monthlyCost = budget * 30;

  const goNextFromStep = (s: number) => {
    if (s === 1 && skipTargetStep) setStep(3);
    else setStep(s + 1);
  };
  const goBackFromStep = (s: number) => {
    if (s === 3 && skipTargetStep) setStep(1);
    else setStep(s - 1);
  };

  const startGeneration = async () => {
    if (!config || !campaignMeta) return;
    cancelRef.current = false;
    setGenerating(true);
    setResults({});
    setGenProgress({ current: 0, total: selectedTargets.length, currentName: '' });
    setStep(5);

    const brain = buildBrainPrompt();
    const targets = selectedTargets;
    const newResults: ResultMap = {};

    for (let i = 0; i < targets.length; i++) {
      if (cancelRef.current) break;
      const t = targets[i];
      setGenProgress({ current: i, total: targets.length, currentName: t.displayName });

      try {
        const system = buildSystemPromptFor(campaignMeta, channel, brain, t);
        const user = `Generate a ${channel.name} ad for: ${t.displayName}. Return JSON only \u2014 variant_a (benefit-led) and variant_b (urgency-led).`;
        const raw = await callAI(config, system, user);
        const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;

        if (parsed && parsed.variant_a && parsed.variant_b) {
          newResults[t.id] = { ok: true, data: { variant_a: parsed.variant_a, variant_b: parsed.variant_b }, raw };
        } else {
          newResults[t.id] = { ok: false, error: 'Model did not return valid variant_a / variant_b JSON.', raw };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        newResults[t.id] = { ok: false, error: message };
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

  const buildSystemPromptFor = (
    cm: CampaignTypeMeta,
    ch: Channel,
    brain: string,
    target: TargetRef
  ) => {
    if (cm.targetKind === 'projects') {
      const project = projects.find((p) => p.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, project });
    }
    if (cm.targetKind === 'neighborhoods') {
      const neighborhood = TORONTO_NEIGHBORHOODS.find((n) => n.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, neighborhood });
    }
    if (cm.targetKind === 'communities') {
      const community = GTA_COMMUNITIES.find((c) => c.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, community });
    }
    if (cm.targetKind === 'custom') {
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, customBrief });
    }
    return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain });
  };

  const cancelGeneration = () => { cancelRef.current = true; setGenerating(false); };

  const regenerateOne = async (targetId: string) => {
    if (!config || !campaignMeta) return;
    const target = selectedTargets.find((t) => t.id === targetId);
    if (!target) return;
    setResults((r) => ({ ...r, [targetId]: { ok: false, error: 'Regenerating…' } }));
    const brain = buildBrainPrompt();
    try {
      const system = buildSystemPromptFor(campaignMeta, channel, brain, target);
      const user = `Generate a ${channel.name} ad for: ${target.displayName}. Return JSON only.`;
      const raw = await callAI(config, system, user);
      const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;
      if (parsed && parsed.variant_a && parsed.variant_b) {
        setResults((r) => ({ ...r, [targetId]: { ok: true, data: { variant_a: parsed.variant_a!, variant_b: parsed.variant_b! }, raw } }));
      } else {
        setResults((r) => ({ ...r, [targetId]: { ok: false, error: 'Model did not return valid JSON.', raw } }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResults((r) => ({ ...r, [targetId]: { ok: false, error: message } }));
    }
  };

  const copy = (text: string, key: string) => {
    try { navigator.clipboard?.writeText(text); } catch {}
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1400);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ campaignType, channel: channel.id, results }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scale-${campaignType}-${channel.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCsv = () => {
    const rows: string[] = [['target', 'variant', 'field', 'value'].map(csvEscape).join(',')];
    Object.entries(results).forEach(([tid, r]) => {
      const t = selectedTargets.find((x) => x.id === tid);
      if (!r.ok || !r.data) return;
      (['variant_a', 'variant_b'] as VariantKey[]).forEach((vk) => {
        flattenToRows(r.data![vk]).forEach(([field, value]) => {
          rows.push([t?.displayName || tid, vk, field, value].map(csvEscape).join(','));
        });
      });
    });
    copy(rows.join('\n'), 'csv-all');
  };

  // ══════════════════════════════════════════════════════════════
  // Step labels for the indicator
  // ══════════════════════════════════════════════════════════════
  const stepLabels = [
    'Campaign Type',
    campaignMeta?.stepLabel || 'Select target',
    'Choose Channel',
    'Configure',
    'Review Output',
  ];

  return (
    <div style={{ fontFamily: S.font, color: S.textPrimary, fontSize: 16, lineHeight: 1.6 }}>
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
        input[type="range"].s-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        input[type="range"].s-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        .s-scroll::-webkit-scrollbar { width: 7px; }
        .s-scroll::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 40px 96px', animation: 'sSlideIn 0.25s ease' }}>
        <StepIndicator current={step} stepLabels={stepLabels} skipStep2={skipTargetStep} />

        {usingFallback && step === 2 && campaignMeta?.targetKind === 'projects' && (
          <div style={{
            padding: '14px 18px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            color: '#FDE68A', fontSize: 14, marginBottom: 24,
          }}>
            Showing sample projects — no active projects found in the database.
          </div>
        )}

        {step === 1 && (
          <StepCampaignType
            value={campaignType}
            onPick={pickCampaignType}
            onContinue={() => goNextFromStep(1)}
          />
        )}

        {step === 2 && campaignMeta && (
          <StepTarget
            campaignMeta={campaignMeta}
            projects={filteredProjects}
            totalProjects={projects.length}
            projectsLoading={projectsLoading}
            neighborhoods={filteredNeighborhoods}
            communities={filteredCommunities}
            customBrief={customBrief}
            setCustomBrief={setCustomBrief}
            search={search}
            setSearch={setSearch}
            neighborhoodFilter={neighborhoodFilter}
            setNeighborhoodFilter={setNeighborhoodFilter}
            neighborhoodOptions={neighborhoodOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={statusOptions}
            selectedIds={selectedIds}
            toggleId={toggleId}
            selectAll={selectAllFiltered}
            deselectAll={deselectAll}
            canContinue={canContinueTargets}
            onBack={() => goBackFromStep(2)}
            onContinue={() => goNextFromStep(2)}
          />
        )}

        {step === 3 && (
          <StepChannel
            channelId={channelId}
            onSelect={setChannelId}
            onBack={() => goBackFromStep(3)}
            onContinue={() => goNextFromStep(3)}
          />
        )}

        {step === 4 && campaignMeta && (
          <StepConfigure
            campaignMeta={campaignMeta}
            targets={selectedTargets}
            channel={channel}
            budget={budget}
            setBudget={setBudget}
            monthlyCost={monthlyCost}
            config={config}
            onBack={() => goBackFromStep(4)}
            onGenerate={startGeneration}
          />
        )}

        {step === 5 && campaignMeta && (
          <StepReview
            targets={selectedTargets}
            results={results}
            channel={channel}
            campaignMeta={campaignMeta}
            activeResultId={activeResultId || selectedTargets[0]?.id || null}
            setActiveResultId={setActiveResultId}
            activeVariant={activeVariant}
            setActiveVariant={setActiveVariant}
            copiedKey={copiedKey}
            copy={copy}
            regenerate={regenerateOne}
            exportJson={exportJson}
            copyCsv={copyCsv}
            onBack={() => setStep(4)}
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
// Step 1 — Campaign type
// ═══════════════════════════════════════════════════════════════
function StepCampaignType({
  value, onPick, onContinue,
}: {
  value: CampaignType | null;
  onPick: (id: CampaignType) => void;
  onContinue: () => void;
}) {
  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Choose campaign type
      </h1>
      <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 28px', lineHeight: 1.6, maxWidth: 680 }}>
        Scale adapts to what you&apos;re advertising. Pick the kind of campaign and we&apos;ll tailor the data source, targeting, and AI prompt.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {CAMPAIGN_TYPES.map((ct) => {
          const selected = ct.id === value;
          return (
            <button
              key={ct.id}
              onClick={() => onPick(ct.id)}
              className="s-card"
              style={{
                position: 'relative', textAlign: 'left', cursor: 'pointer',
                background: selected ? S.accentSoft : S.surface,
                border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                borderRadius: 16, padding: 24, fontFamily: S.font, color: S.textPrimary,
                display: 'flex', flexDirection: 'column', gap: 14, minHeight: 190,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 7, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={13} />
                </div>
              )}
              <div style={{
                width: 52, height: 52, borderRadius: 13,
                background: `${ct.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CampaignIcon path={ct.iconPath} color={ct.color} size={26} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                {ct.label}
              </div>
              <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.6, flex: 1 }}>
                {ct.description}
              </div>
            </button>
          );
        })}
      </div>

      <BottomBar>
        <span style={{ fontSize: 14, color: value ? S.textPrimary : S.textMuted }}>
          {value ? <>Selected: <strong style={{ color: S.white, fontWeight: 600 }}>{CAMPAIGN_TYPES.find((c) => c.id === value)?.label}</strong></> : 'Pick a campaign type to continue'}
        </span>
        <button
          onClick={onContinue}
          disabled={!value}
          className="s-btn"
          style={navButtonStyle('primary', !value)}
        >
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 2 — Target (dispatches per campaign type)
// ═══════════════════════════════════════════════════════════════
function StepTarget(props: {
  campaignMeta: CampaignTypeMeta;
  projects: ScaleProject[];
  totalProjects: number;
  projectsLoading: boolean;
  neighborhoods: ScaleNeighborhood[];
  communities: ScaleCommunity[];
  customBrief: string;
  setCustomBrief: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  neighborhoodFilter: string;
  setNeighborhoodFilter: (v: string) => void;
  neighborhoodOptions: string[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  statusOptions: string[];
  selectedIds: Set<string>;
  toggleId: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const {
    campaignMeta, projects, totalProjects, projectsLoading,
    neighborhoods, communities, customBrief, setCustomBrief,
    search, setSearch,
    neighborhoodFilter, setNeighborhoodFilter, neighborhoodOptions,
    statusFilter, setStatusFilter, statusOptions,
    selectedIds, toggleId, selectAll, deselectAll,
    canContinue, onBack, onContinue,
  } = props;

  if (campaignMeta.targetKind === 'custom') {
    return (
      <StepCustomBrief
        value={customBrief}
        onChange={setCustomBrief}
        campaignMeta={campaignMeta}
        canContinue={customBrief.trim().length >= 20}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  // Projects grid
  if (campaignMeta.targetKind === 'projects') {
    const shown = projects.length;
    const anyFilterActive = search || neighborhoodFilter !== 'all' || statusFilter !== 'all';
    const allSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
          {campaignMeta.id === 'short_term_rentals' ? 'Select investment projects' : 'Select projects to advertise'}
        </h1>
        <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 22px', lineHeight: 1.6 }}>
          {campaignMeta.id === 'short_term_rentals'
            ? 'Pick projects that work as short-term rentals or furnished income properties. Scale tailors the copy to investors.'
            : 'Pick one or more active projects. Scale generates on-brand ad copy for every one you select.'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {projectsLoading
              ? 'Loading…'
              : anyFilterActive
                ? `${shown} of ${totalProjects} projects`
                : `${totalProjects} project${totalProjects === 1 ? '' : 's'} available`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, neighborhood, developer…" />
          <FilterSelect
            label="Neighborhood"
            value={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
            options={[{ value: 'all', label: 'All neighborhoods' }, ...neighborhoodOptions.map((n) => ({ value: n, label: n }))]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All statuses' }, ...statusOptions.map((s) => ({ value: s, label: statusLabel(s) }))]}
          />
          <div style={{ flex: 1 }} />
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="s-btn"
            style={toolbarBtnStyle()}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {projectsLoading ? (
          <div style={{ color: S.textMuted, fontSize: 15, padding: 48 }}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={{ color: S.textMuted, fontSize: 15, padding: 48, textAlign: 'center', border: `1px dashed ${S.border}`, borderRadius: 12 }}>
            No projects match these filters.
          </div>
        ) : (
          <div className="s-scroll" style={scrollContainerStyle()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {projects.map((p) => {
                const selected = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleId(p.id)}
                    className="s-card"
                    style={{
                      position: 'relative', textAlign: 'left', cursor: 'pointer',
                      background: selected ? S.accentSoft : S.surface,
                      border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                      borderRadius: 14, padding: 0, overflow: 'hidden', fontFamily: S.font, color: S.textPrimary,
                    }}
                  >
                    <div style={{
                      height: 140,
                      backgroundColor: S.surfaceHover,
                      backgroundImage: p.image
                        ? `linear-gradient(to bottom, rgba(11,13,17,0) 40%, rgba(11,13,17,0.55) 100%), url(${p.image})`
                        : `linear-gradient(135deg, rgba(0,102,255,0.12) 0%, rgba(0,212,170,0.08) 100%)`,
                      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                      position: 'relative', borderBottom: `1px solid ${S.border}`,
                    }}>
                      {!p.image && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 44, fontWeight: 700, fontFamily: S.mono }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 14, left: 14 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 7,
                          background: selected ? S.accent : 'rgba(0,0,0,0.5)',
                          border: `1.5px solid ${selected ? S.accent : 'rgba(255,255,255,0.35)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                          backdropFilter: 'blur(8px)',
                        }}>
                          {selected && <Check size={13} />}
                        </div>
                      </div>
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        padding: '5px 12px', borderRadius: 100,
                        background: 'rgba(16,185,129,0.88)', color: '#fff',
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
                        backdropFilter: 'blur(6px)',
                      }}>
                        {statusLabel(p.status)}
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 6 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 14, color: S.textSecondary, marginBottom: 10 }}>
                        {p.neighborhood} · {p.developer}
                      </div>
                      <div style={{ fontSize: 14, color: '#C8CBD3', fontFamily: S.mono, marginBottom: 12 }}>{p.price}</div>
                      <div style={{ fontSize: 12, color: S.textMuted, display: 'flex', gap: 10, flexWrap: 'wrap', lineHeight: 1.6 }}>
                        <span>Completion {p.completion}</span>
                        <span>·</span>
                        <span>{p.floors ?? '—'} floors</span>
                        <span>·</span>
                        <span>{p.units ?? '—'} units</span>
                        {p.buildingType && (<><span>·</span><span>{p.buildingType}</span></>)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <TargetBottomBar
          count={selectedIds.size}
          noun="project"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  // Neighborhoods
  if (campaignMeta.targetKind === 'neighborhoods') {
    const total = TORONTO_NEIGHBORHOODS.length;
    const shown = neighborhoods.length;
    const grouped = useMemoGroup(neighborhoods);
    const allSelected = neighborhoods.length > 0 && neighborhoods.every((n) => selectedIds.has(n.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
          Select neighborhoods
        </h1>
        <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 22px', lineHeight: 1.6 }}>
          Each neighborhood ad links to its own hub page at <code style={{ fontFamily: S.mono, fontSize: 14 }}>condowizard.ca/areas/[slug]</code>.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {search ? `${shown} of ${total} neighborhoods` : `${total} neighborhoods available`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search neighborhoods…" />
          <div style={{ flex: 1 }} />
          <button onClick={allSelected ? deselectAll : selectAll} className="s-btn" style={toolbarBtnStyle()}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="s-scroll" style={scrollContainerStyle()}>
          {Object.entries(grouped).map(([region, items]) => (
            <div key={region} style={{ marginBottom: 24 }}>
              <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>{region}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {items.map((n) => {
                  const selected = selectedIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleId(n.id)}
                      className="s-card"
                      style={cardStyle(selected)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckBox selected={selected} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>{n.name}</div>
                          <div style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.landing}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <TargetBottomBar
          count={selectedIds.size}
          noun="neighborhood"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  // Communities
  if (campaignMeta.targetKind === 'communities') {
    const total = GTA_COMMUNITIES.length;
    const shown = communities.length;
    const allSelected = communities.length > 0 && communities.every((c) => selectedIds.has(c.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
          Select communities
        </h1>
        <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 22px', lineHeight: 1.6 }}>
          Each ad links to live MLS listings for that community, powered by Repliers.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {search ? `${shown} of ${total} communities` : `${total} communities available`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search communities…" />
          <div style={{ flex: 1 }} />
          <button onClick={allSelected ? deselectAll : selectAll} className="s-btn" style={toolbarBtnStyle()}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="s-scroll" style={scrollContainerStyle()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {communities.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleId(c.id)}
                  className="s-card"
                  style={cardStyle(selected)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckBox selected={selected} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>{c.name}</div>
                      <div style={{ fontSize: 14, color: S.textSecondary, marginTop: 4 }}>
                        {c.name} — homes for sale
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <TargetBottomBar
          count={selectedIds.size}
          noun="community"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  return null;
}

// group neighborhoods by region
function useMemoGroup(list: ScaleNeighborhood[]): Record<string, ScaleNeighborhood[]> {
  return useMemo(() => {
    const out: Record<string, ScaleNeighborhood[]> = {};
    list.forEach((n) => {
      if (!out[n.region]) out[n.region] = [];
      out[n.region].push(n);
    });
    return out;
  }, [list]);
}

// ═══════════════════════════════════════════════════════════════
// Step 2 variant — Custom brief
// ═══════════════════════════════════════════════════════════════
function StepCustomBrief({
  value, onChange, campaignMeta, canContinue, onBack, onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  campaignMeta: CampaignTypeMeta;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div style={{ animation: 'sSlideIn 0.25s ease', maxWidth: 820 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Write your campaign brief
      </h1>
      <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 24px', lineHeight: 1.6 }}>
        Describe what you want to advertise, who it&apos;s for, and any key angles. Scale will follow your brief and your Agent Brain rules.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Example:\n\n"Promote the CondoWizard 30-day trial for new agents. Audience: junior agents in the GTA with fewer than 5 deals closed. Emphasize the MLS feed, AI search, and lead routing. CTA: Start free trial."`}
        style={{
          width: '100%', minHeight: 260, padding: '16px 18px',
          borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`,
          color: S.textPrimary, fontSize: 15, fontFamily: S.font, lineHeight: 1.7, resize: 'vertical', outline: 'none',
        }}
      />
      <div style={{ marginTop: 10, fontSize: 13, color: S.textMuted, display: 'flex', justifyContent: 'space-between' }}>
        <span>Minimum 20 characters. The more detail, the better the output.</span>
        <span style={{ fontFamily: S.mono }}>{value.trim().length} chars</span>
      </div>

      <div style={{ marginTop: 20, padding: 18, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12 }}>
        <div style={sectionLabelStyle}>How this is used</div>
        <div style={{ fontSize: 14, color: '#C8CBD3', lineHeight: 1.7 }}>
          Your brief is prepended to every AI call as the campaign context, alongside the {campaignMeta.label.toLowerCase()} angle and the full Agent Brain knowledge base.
        </div>
      </div>

      <TargetBottomBar
        count={canContinue ? 1 : 0}
        noun="brief"
        canContinue={canContinue}
        onBack={onBack}
        onContinue={onContinue}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 3 — Channel
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
      <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Choose ad channel
      </h1>
      <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 28px', lineHeight: 1.6 }}>
        Pick where these ads will run. Scale tailors the format and length to each channel&apos;s spec.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
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
                border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                borderRadius: 14, padding: 24,
                cursor: ch.disabled ? 'not-allowed' : 'pointer',
                opacity: ch.disabled ? 0.45 : 1,
                fontFamily: S.font, color: S.textPrimary,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 7, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={13} />
                </div>
              )}
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: `${ch.color}20`, color: ch.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, fontFamily: S.mono, marginBottom: 16,
              }}>
                {ch.icon}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: S.white, marginBottom: 6 }}>{ch.name}</div>
              <div style={{ fontSize: 14, color: S.textSecondary, marginBottom: selected ? 12 : 0, lineHeight: 1.55 }}>
                {ch.subtitle}
              </div>
              {selected && (
                <div style={{ fontSize: 13, color: '#C8CBD3', lineHeight: 1.65, paddingTop: 12, borderTop: `1px solid ${S.border}`, marginTop: 2 }}>
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
// Step 4 — Configure
// ═══════════════════════════════════════════════════════════════
function StepConfigure(props: {
  campaignMeta: CampaignTypeMeta;
  targets: TargetRef[];
  channel: Channel;
  budget: number;
  setBudget: (n: number) => void;
  monthlyCost: number;
  config: ScaleModelConfig | null;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const { campaignMeta, targets, channel, budget, setBudget, monthlyCost, config, onBack, onGenerate } = props;
  const total = targets.length;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
        Configure campaign
      </h1>
      <p style={{ fontSize: 16, color: S.textSecondary, margin: '10px 0 28px', lineHeight: 1.6 }}>
        Final review before Scale calls the AI.
      </p>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 22 }}>
          <Stat label="Campaign type" value={campaignMeta.label} accent={campaignMeta.color} />
          <Stat label="Targets" value={total.toString()} />
          <Stat label="Channel" value={channel.name} accent={channel.color} />
          <Stat label="Variants" value="2 A/B" />
          <Stat label="Total ads" value={(total * 2).toString()} />
        </div>

        <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 18 }}>
          <div style={sectionLabelStyle}>Selected {targets.length === 1 ? 'target' : 'targets'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {targets.map((t) => (
              <span key={t.id} style={{
                padding: '7px 14px', borderRadius: 100, background: S.accentSoft,
                border: `1px solid ${S.accentBorder}`, color: '#93C5FD', fontSize: 13, fontWeight: 500,
              }}>
                {t.displayName}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
          <div>
            <div style={sectionLabelStyle}>Daily budget per campaign</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: S.white, letterSpacing: '-0.02em' }}>
              ${budget}
              <span style={{ fontSize: 16, color: S.textMuted, fontWeight: 500, marginLeft: 8 }}>/ day</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={sectionLabelStyle}>Est. monthly spend</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: S.textSecondary, fontFamily: S.mono }}>
              ${(monthlyCost * Math.max(1, total)).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>
              ${monthlyCost.toLocaleString()} × {Math.max(1, total)} target{total === 1 ? '' : 's'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>$10</span>
          <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>$200</span>
        </div>
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 28, marginBottom: 20 }}>
        <div style={sectionLabelStyle}>Scale will generate</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            `2 full copy variants per ${channel.name} ad`,
            `Variant A leads with benefit & lifestyle; Variant B leads with urgency`,
            `All copy respects your Agent Brain rules (tone, legal, banned words)`,
            `${campaignMeta.label} angle baked into every prompt`,
            `Output structured as JSON — paste directly into ${channel.name} or export CSV`,
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: '#C8CBD3', lineHeight: 1.6 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: S.accentSoft, color: S.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={11} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        {config && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${S.border}`, fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
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
          disabled={!config || total === 0}
          className="s-btn"
          style={{
            padding: '14px 30px', borderRadius: 11,
            background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
            color: S.white, border: 'none', fontSize: 15, fontWeight: 600,
            cursor: !config || total === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
            opacity: !config || total === 0 ? 0.5 : 1,
            boxShadow: '0 6px 20px rgba(0,102,255,0.3)',
          }}
        >
          <Sparkle /> Generate {total} campaign{total === 1 ? '' : 's'}
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 5 — Review
// ═══════════════════════════════════════════════════════════════
function StepReview(props: {
  targets: TargetRef[];
  results: ResultMap;
  channel: Channel;
  campaignMeta: CampaignTypeMeta;
  activeResultId: string | null;
  setActiveResultId: (id: string) => void;
  activeVariant: VariantKey;
  setActiveVariant: (v: VariantKey) => void;
  copiedKey: string;
  copy: (text: string, key: string) => void;
  regenerate: (id: string) => void;
  exportJson: () => void;
  copyCsv: () => void;
  onBack: () => void;
}) {
  const {
    targets, results, channel, campaignMeta,
    activeResultId, setActiveResultId,
    activeVariant, setActiveVariant,
    copiedKey, copy, regenerate, exportJson, copyCsv, onBack,
  } = props;

  const active = targets.find((t) => t.id === activeResultId) || targets[0];
  const activeResult = active ? results[active.id] : undefined;
  const variantData = activeResult?.ok && activeResult.data ? activeResult.data[activeVariant] : null;
  const okCount = Object.values(results).filter((r) => r.ok).length;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>
            Review output
          </h1>
          <p style={{ fontSize: 15, color: S.textSecondary, margin: '10px 0 0' }}>
            {okCount} of {targets.length} generated · {campaignMeta.label} · {channel.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyCsv} className="s-btn" style={headerBtn(copiedKey === 'csv-all' ? 'success' : 'ghost')}>
            <Copy /> {copiedKey === 'csv-all' ? 'Copied!' : 'Copy CSV'}
          </button>
          <button onClick={exportJson} className="s-btn" style={headerBtn('ghost')}>
            <Download /> Export JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'flex-start' }}>
        <div className="s-scroll" style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 10, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {targets.map((t) => {
            const r = results[t.id];
            const isActive = t.id === active?.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveResultId(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 9,
                  background: isActive ? S.accentSoft : 'transparent',
                  border: `1px solid ${isActive ? S.accentBorder : 'transparent'}`,
                  cursor: 'pointer', marginBottom: 4, fontFamily: S.font, color: S.textPrimary,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isActive ? S.white : S.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.displayName}
                  </div>
                  {t.subtitle && (
                    <div style={{ fontSize: 12, color: S.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {t.subtitle}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 5,
                  fontFamily: S.mono, flexShrink: 0, marginLeft: 8,
                  background: !r ? 'rgba(255,255,255,0.05)' : r.ok ? S.greenSoft : S.redSoft,
                  color: !r ? S.textMuted : r.ok ? S.green : S.red,
                }}>
                  {!r ? '…' : r.ok ? 'OK' : 'ERR'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ minWidth: 0 }}>
          {active && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, padding: 5, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 11 }}>
                  {(['variant_a', 'variant_b'] as VariantKey[]).map((v) => {
                    const isA = v === 'variant_a';
                    const isActiveV = v === activeVariant;
                    return (
                      <button
                        key={v}
                        onClick={() => setActiveVariant(v)}
                        style={{
                          padding: '10px 18px', borderRadius: 8,
                          background: isActiveV ? S.accent : 'transparent',
                          color: isActiveV ? S.white : S.textSecondary,
                          border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        Variant {isA ? 'A' : 'B'}
                        <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>
                          · {isA ? 'benefit' : 'urgency'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
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

              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24, minHeight: 260 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                      {active.displayName}
                    </div>
                    {active.subtitle && (
                      <div style={{ fontSize: 13, color: S.textMuted, marginTop: 3 }}>
                        {channel.name} · {active.subtitle}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {activeVariant.replace('_', ' ')}
                  </span>
                </div>

                {!activeResult && (
                  <div style={{ color: S.textMuted, fontSize: 14 }}>Waiting for generation…</div>
                )}
                {activeResult && !activeResult.ok && (
                  <div style={{ padding: 20, background: S.redSoft, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.red, marginBottom: 8 }}>Generation failed</div>
                    <div style={{ fontSize: 13, color: '#FCA5A5', fontFamily: S.mono, lineHeight: 1.6, marginBottom: 14 }}>
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
        <div style={{ color: S.textMuted, fontSize: 13, fontFamily: S.mono }}>
          {okCount} / {targets.length} OK
        </div>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Variant field renderer
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {value.map((item, i) => {
            if (item && typeof item === 'object') {
              return (
                <div key={i} style={{ padding: 16, borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}` }}>
                  <div style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Item {i + 1}
                  </div>
                  <VariantRenderer data={item as Record<string, unknown>} keyPrefix={`${keyId}-${i}`} copy={copy} copiedKey={copiedKey} />
                </div>
              );
            }
            const text = String(item);
            const k = `${keyId}-${i}`;
            return <CopyableRow key={i} text={text} onCopy={() => copy(text, k)} copied={copiedKey === k} index={i + 1} />;
          })}
        </div>
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div>
        <div style={sectionLabelStyle}>{label}</div>
        <div style={{ padding: 16, borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}` }}>
          <VariantRenderer data={value as Record<string, unknown>} keyPrefix={keyId} copy={copy} copiedKey={copiedKey} />
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
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
        padding: '14px 16px', borderRadius: 10,
        background: S.surfaceHover, border: `1px solid ${S.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {index != null && (
          <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, paddingTop: 2, flexShrink: 0 }}>{index}.</span>
        )}
        <div style={{ fontSize: 14, color: '#E2E4E9', lineHeight: 1.6, fontFamily: S.mono, wordBreak: 'break-word' }}>
          {text}
        </div>
      </div>
      <span style={{
        fontSize: 12, padding: '4px 10px', borderRadius: 6, flexShrink: 0, fontFamily: S.mono,
        color: copied ? S.green : S.textMuted,
        background: copied ? S.greenSoft : 'transparent',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : S.border}`,
        display: 'flex', alignItems: 'center', gap: 5,
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
        width: 460, maxWidth: '90vw',
        background: S.bg, border: `1px solid ${S.border}`, borderRadius: 18,
        padding: 36, textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 60, height: 60, margin: '0 auto 24px',
          border: `3px solid ${S.border}`, borderTopColor: S.accent, borderRadius: '50%',
          animation: 'sSpin 0.9s linear infinite',
        }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 8 }}>
          Generating campaigns
        </div>
        <div style={{ fontSize: 14, color: S.textSecondary, marginBottom: 24, minHeight: 20 }}>
          {currentName ? <>Working on <span style={{ color: S.white, fontWeight: 500 }}>{currentName}</span>…</> : 'Preparing…'}
        </div>

        <div style={{ height: 7, borderRadius: 4, background: S.border, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0066FF 0%, #00D4AA 100%)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, marginBottom: 26 }}>
          {Math.min(current + 1, total)} / {total}
        </div>

        <button
          onClick={onCancel}
          className="s-btn"
          style={{
            padding: '11px 22px', borderRadius: 9, background: 'transparent',
            border: `1px solid ${S.border}`, color: S.textSecondary,
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared bits
// ═══════════════════════════════════════════════════════════════
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, marginTop: 36,
      paddingTop: 22, paddingBottom: 22,
      borderTop: `1px solid ${S.border}`,
      background: `linear-gradient(to top, ${S.bg} 60%, rgba(11,13,17,0.6))`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 14,
    }}>
      {children}
    </div>
  );
}

function TargetBottomBar({
  count, noun, canContinue, onBack, onContinue,
}: {
  count: number;
  noun: string;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <BottomBar>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <span style={{ color: count ? S.textPrimary : S.textMuted, fontSize: 14 }}>
          <strong style={{ color: S.white, fontWeight: 600 }}>{count}</strong>{' '}
          {noun}{count === 1 ? '' : 's'} selected
        </span>
      </div>
      <button onClick={onContinue} disabled={!canContinue} className="s-btn" style={navButtonStyle('primary', !canContinue)}>
        Continue <ArrowRight />
      </button>
    </BottomBar>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={sectionLabelStyle}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || S.white, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}

function CheckBox({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 7,
      background: selected ? S.accent : 'transparent',
      border: `1.5px solid ${selected ? S.accent : 'rgba(255,255,255,0.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
    }}>
      {selected && <Check size={13} />}
    </div>
  );
}

function cardStyle(selected: boolean): React.CSSProperties {
  return {
    position: 'relative', textAlign: 'left', cursor: 'pointer',
    background: selected ? S.accentSoft : S.surface,
    border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
    borderRadius: 12, padding: 20, fontFamily: S.font, color: S.textPrimary,
  };
}

function scrollContainerStyle(): React.CSSProperties {
  return {
    maxHeight: 'calc(100vh - 420px)',
    minHeight: 320,
    overflowY: 'auto',
    paddingRight: 8,
    marginRight: -8,
  };
}

function toolbarBtnStyle(): React.CSSProperties {
  return {
    padding: '12px 20px', borderRadius: 10,
    background: S.surface, border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
  };
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: S.textMuted, display: 'flex' }}>
        <Search />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '14px 16px 14px 42px', borderRadius: 11,
          background: S.surface, border: `1px solid ${S.border}`,
          color: S.textPrimary, fontSize: 15, fontFamily: S.font, outline: 'none',
        }}
      />
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const active = value !== 'all';
  return (
    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 12, color: S.textMuted, fontWeight: 500, pointerEvents: 'none', letterSpacing: '0.02em',
      }}>
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: `12px 34px 12px ${label.length * 6.4 + 26}px`,
          borderRadius: 11,
          background: active ? S.accentSoft : S.surface,
          border: `1px solid ${active ? S.accentBorder : S.border}`,
          color: active ? S.white : S.textSecondary,
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, outline: 'none',
          minWidth: 200,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: S.bg, color: S.textPrimary }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: S.textMuted, display: 'flex',
      }}>
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>
      </span>
    </label>
  );
}

function navButtonStyle(variant: 'primary' | 'ghost', disabled?: boolean): React.CSSProperties {
  if (variant === 'primary') {
    return {
      padding: '12px 28px', borderRadius: 11,
      background: disabled ? S.surfaceHover : S.accent,
      color: disabled ? S.textMuted : S.white,
      border: 'none', fontSize: 15, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
    };
  }
  return {
    padding: '12px 22px', borderRadius: 11,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
  };
}

function headerBtn(variant: 'ghost' | 'success'): React.CSSProperties {
  return {
    padding: '10px 16px', borderRadius: 9,
    background: variant === 'success' ? S.greenSoft : S.surface,
    border: `1px solid ${variant === 'success' ? 'rgba(16,185,129,0.3)' : S.border}`,
    color: variant === 'success' ? S.green : S.textSecondary,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
    display: 'flex', alignItems: 'center', gap: 7,
  };
}
