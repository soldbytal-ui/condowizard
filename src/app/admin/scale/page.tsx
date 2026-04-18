'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { loadScaleConfig, ScaleModelConfig } from '@/lib/scale-ai';
import { getCredits } from '@/lib/scale-credits';

// ─── Design tokens ───
const INK   = '#0B0D11';
const INK2  = '#141414';
const INK3  = '#1A1D25';
const PAPER = '#F3F0E8';
const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const LINE_STRONG = 'rgba(255,255,255,0.14)';
const MUTED = '#8B8FA3';
const GREEN = '#10B981';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Types ───
type HistoryStatus = 'Generated' | 'Pushed' | 'Failed';
interface ScaleHistoryEntry {
  id: string; campaignName: string; campaignType: string; campaignTypeLabel: string;
  channelId: string; channelName: string; projects: string[]; budget: number;
  status: HistoryStatus; date: string;
}
interface CrmLead {
  id: string; name: string; source: string; interest: string;
  status: 'new' | 'contacted' | 'showing' | 'offer' | 'under_contract' | 'closed' | 'lost';
  createdAt: string;
}

// ─── Storage keys ───
const SCALE_HISTORY_STORAGE_KEY = 'scale-campaign-history';
const CRM_LEADS_STORAGE_KEY = 'scale-crm-leads';

// ─── Agent activity feed data ───
interface ActivityItem {
  id: string;
  agentName: string;
  agentRole: string;
  agentType: 'ceo' | 'ad_ops' | 'lead_ops' | 'content' | 'engineering';
  body: string;
  tags: string[];
  timeAgo: string;
  timestamp: string;
}

const AGENT_GRADIENTS: Record<string, string> = {
  ceo: 'linear-gradient(135deg, #FF4A1C, #FF7A4A)',
  ad_ops: 'linear-gradient(135deg, #0047FF, #3D6FFF)',
  lead_ops: 'linear-gradient(135deg, #2D8F5F, #4BB880)',
  content: 'linear-gradient(135deg, #C9A227, #E5C04A)',
  engineering: 'linear-gradient(135deg, #8B3FBF, #B670E8)',
};

const AGENT_LETTERS: Record<string, string> = {
  ceo: 'C', ad_ops: 'A', lead_ops: 'L', content: 'W', engineering: 'E',
};

const SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1', agentName: 'Ad Ops Director', agentRole: 'AD OPS DIRECTOR', agentType: 'ad_ops',
    body: 'Paused underperforming **King West** campaign. CPC $4.80 was above threshold — shifted $240 daily budget to **Liberty Village** (CPC $1.90).',
    tags: ['optimized'], timeAgo: '2h ago', timestamp: '03:42 EST',
  },
  {
    id: 'a2', agentName: 'Lead Ops Director', agentRole: 'LEAD OPS DIRECTOR', agentType: 'lead_ops',
    body: 'Scored 12 overnight leads. Routed 3 hot leads (budget $800K+, pre-approved) to Tal via SMS.',
    tags: ['qualified'], timeAgo: '3h ago', timestamp: '02:18 EST',
  },
  {
    id: 'a3', agentName: 'Content Director', agentRole: 'CONTENT DIRECTOR', agentType: 'content',
    body: "Draft ready: 'First-Time Buyer's Guide to Toronto Pre-Construction' — 1,840 words, RECO-compliant.",
    tags: ['drafted'], timeAgo: '5h ago', timestamp: '00:05 EST',
  },
  {
    id: 'a4', agentName: 'Platform Engineer', agentRole: 'PLATFORM ENGINEER', agentType: 'engineering',
    body: 'Ran technical-audit skill on condowizard.ca. Found 4 medium issues (missing alt text on 12 images).',
    tags: ['audited'], timeAgo: '6h ago', timestamp: '23:30 EST',
  },
  {
    id: 'a5', agentName: 'Scale CEO', agentRole: 'CEO AGENT', agentType: 'ceo',
    body: 'Weekly review complete. Lead volume +18%, CPL -$6, Q3 roadmap pinned. Recommend doubling **Liberty Village** budget.',
    tags: ['reviewed'], timeAgo: '8h ago', timestamp: '21:00 EST',
  },
];

// ─── Agent sidebar data ───
interface AgentInfo {
  name: string; role: string; model: string; type: string; status: 'live' | 'idle';
}
const SIDEBAR_AGENTS: AgentInfo[] = [
  { name: 'CEO Agent', role: 'Orchestration', model: 'Sonnet 4.5', type: 'ceo', status: 'live' },
  { name: 'Ad Ops', role: 'Campaigns', model: 'Sonnet 4.5', type: 'ad_ops', status: 'live' },
  { name: 'Lead Ops', role: 'CRM', model: 'Haiku 4.5', type: 'lead_ops', status: 'live' },
  { name: 'Content', role: 'SEO', model: 'Sonnet 4.5', type: 'content', status: 'idle' },
  { name: 'Platform Eng', role: 'Infra', model: 'Haiku 4.5', type: 'engineering', status: 'live' },
];

// ─── Quick actions ───
const QUICK_ACTIONS = [
  { type: 'pre_construction', title: 'Google Search', letter: 'G', description: 'New RSA campaign' },
  { type: 'meta_lead_gen',    title: 'Meta Lead Gen', letter: 'M', description: 'Facebook + IG forms' },
  { type: 'email_nurture',    title: 'Email Nurture', letter: 'E', description: '7-part drip sequence' },
  { type: 'seo_landing_page', title: 'SEO Page',      letter: 'S', description: 'Area landing page' },
];

// ─── Mini SVG sparkline ───
function KpiSparkline({ data, color = ACCENT }: { data: number[]; color?: string }) {
  const w = 120, h = 40;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const fillPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ position: 'absolute', bottom: 8, right: 12, opacity: 0.5 }}>
      <defs>
        <linearGradient id={`kpi-grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#kpi-grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Render bold markdown ───
function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Tal.';
  if (h < 18) return 'Good afternoon, Tal.';
  return 'Good evening, Tal.';
}

export default function ScaleDashboard() {
  const [history, setHistory] = useState<ScaleHistoryEntry[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    try { const raw = localStorage.getItem(SCALE_HISTORY_STORAGE_KEY); if (raw) setHistory(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(CRM_LEADS_STORAGE_KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) setLeads(p); } } catch {}
    setCredits(getCredits());
  }, []);

  const newLeads24h = useMemo(() => {
    const cutoff = Date.now() - 86400000;
    return leads.filter((l) => new Date(l.createdAt).getTime() >= cutoff).length || 28;
  }, [leads]);

  const activeCampaigns = history.filter((h) => h.status === 'Pushed').length;
  const adSpend = useMemo(() => {
    let spend = 0;
    history.forEach((h) => { if (h.status === 'Pushed') spend += h.budget * Math.min((Date.now() - new Date(h.date).getTime()) / 86400000, 1); });
    return spend > 0 ? Math.round(spend) : 412;
  }, [history]);

  const kpis = [
    { label: 'New leads · 24h', value: String(newLeads24h), unit: '', delta: '+12%', deltaUp: true, trend: [12,15,18,14,20,22,19,24,26,28,25,28] },
    { label: 'Ad spend · 24h', value: `$${adSpend}`, unit: 'CAD', delta: '-8%', deltaUp: false, trend: [500,480,460,440,450,430,420,415,410,405,412,412] },
    { label: 'Conversion rate', value: '6.4', unit: '%', delta: '+0.8%', deltaUp: true, trend: [4.2,4.5,4.8,5.1,5.3,5.6,5.8,5.9,6.0,6.1,6.3,6.4] },
    { label: 'Active agents', value: '5', unit: 'running', delta: 'all online', deltaUp: true, trend: [3,3,4,4,4,5,5,5,5,5,5,5] },
  ];

  return (
    <div style={{ fontFamily: FONT_BODY, color: PAPER, fontSize: 14, lineHeight: 1.6, background: INK, minHeight: '100%' }}>
      <style>{`
        .kpi-card { transition: all 0.15s ease; }
        .kpi-card:hover { border-color: ${LINE_STRONG} !important; transform: translateY(-2px); }
        .qa-card { transition: all 0.15s ease; }
        .qa-card:hover { border-color: ${ACCENT} !important; background: ${INK3} !important; }
        .feed-item { transition: background 0.1s; }
        .feed-item:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: INK, borderBottom: `1px solid ${LINE}`,
        padding: '20px 36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>
            CONDOWIZARD / DASHBOARD
          </div>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 400, letterSpacing: '-0.025em', margin: 0, color: PAPER, lineHeight: 1.2 }}>
            {getGreeting()}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            background: INK2, border: `1px solid ${LINE}`,
            fontSize: 12, color: MUTED, cursor: 'pointer', minWidth: 180,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={MUTED} strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
            <span style={{ flex: 1 }}>Search…</span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, padding: '2px 5px',
              borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: MUTED,
            }}>⌘K</span>
          </div>
          {/* Invite */}
          <button style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${LINE}`,
            color: PAPER, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
          }}>
            Invite
          </button>
          {/* New Campaign */}
          <Link href="/admin/scale/campaigns" style={{
            padding: '8px 16px', borderRadius: 8,
            background: ACCENT, border: 'none',
            color: INK, fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            + New Campaign
          </Link>
        </div>
      </div>

      <div style={{ padding: '28px 36px 80px', maxWidth: 1300, animation: 'sSlideIn 0.25s ease' }}>
        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-card" style={{
              background: INK2, borderRadius: 16, padding: 22,
              border: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden',
              cursor: 'default',
            }}>
              {/* Label + live dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: GREEN,
                  animation: 'pulse 2.6s infinite ease-in-out',
                }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>
                  {kpi.label}
                </span>
              </div>
              {/* Value */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: FONT_HEADING, fontSize: 42, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1, color: PAPER }}>
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span style={{ fontSize: 18, color: MUTED }}>{kpi.unit}</span>
                )}
              </div>
              {/* Delta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontFamily: FONT_HEADING, fontStyle: 'italic', fontSize: 12,
                  color: kpi.deltaUp ? GREEN : '#EF4444',
                }}>
                  {kpi.deltaUp ? '↗' : '↘'} {kpi.delta}
                </span>
              </div>
              {/* Sparkline */}
              <KpiSparkline data={kpi.trend} color={ACCENT} />
            </div>
          ))}
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.type}
              href={`/admin/scale/campaigns?type=${a.type}`}
              className="qa-card"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 18, borderRadius: 14,
                background: INK2, border: `1px solid ${LINE}`,
                color: PAPER, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: ACCENT_DIM,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HEADING, fontStyle: 'italic', fontSize: 18,
                color: ACCENT, flexShrink: 0,
              }}>
                {a.letter}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: PAPER, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{a.description}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ═══ BOTTOM GRID: Activity Feed (2fr) + Agents Panel (1fr) ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

          {/* Agent Activity Feed */}
          <div style={{
            background: INK2, borderRadius: 16, border: `1px solid ${LINE}`,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 22px 14px', borderBottom: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 4px', color: PAPER }}>
                    Agent activity
                  </h2>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Autonomous actions from your workforce</p>
                </div>
                <Link href="/admin/scale/agents" style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.06em',
                  color: ACCENT, fontWeight: 600, textTransform: 'uppercase',
                }}>
                  VIEW AUDIT LOG →
                </Link>
              </div>
            </div>

            {/* Feed items */}
            {SEED_ACTIVITIES.map((item) => (
              <div key={item.id} className="feed-item" style={{
                padding: '16px 22px', borderBottom: `1px solid ${LINE}`,
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 14,
                alignItems: 'start',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: AGENT_GRADIENTS[item.agentType],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEADING, fontSize: 13, fontWeight: 700,
                  color: item.agentType === 'content' ? INK : PAPER,
                }}>
                  {AGENT_LETTERS[item.agentType]}
                </div>
                {/* Body */}
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 4, letterSpacing: '0.04em' }}>
                    {item.agentRole} · {item.timestamp}
                  </div>
                  <div style={{ fontSize: 13, color: PAPER, lineHeight: 1.55 }}>
                    {renderBody(item.body)}
                    {item.tags.map((tag) => (
                      <span key={tag} style={{
                        display: 'inline-block', marginLeft: 6,
                        padding: '2px 8px', borderRadius: 10,
                        background: ACCENT_DIM, color: ACCENT,
                        fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Timestamp */}
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED, whiteSpace: 'nowrap' }}>
                  {item.timeAgo}
                </div>
              </div>
            ))}
          </div>

          {/* Your Agents Panel */}
          <div style={{
            background: INK2, borderRadius: 16, border: `1px solid ${LINE}`,
            overflow: 'hidden', alignSelf: 'start',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 4px', color: PAPER }}>
                    Your agents
                  </h2>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                    {SIDEBAR_AGENTS.filter((a) => a.status === 'live').length} of {SIDEBAR_AGENTS.length} online
                  </p>
                </div>
                <Link href="/admin/scale/agents" style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.06em',
                  color: ACCENT, fontWeight: 600, textTransform: 'uppercase',
                }}>
                  MANAGE →
                </Link>
              </div>
            </div>

            {/* Agent list */}
            {SIDEBAR_AGENTS.map((agent) => (
              <div key={agent.name} style={{
                padding: '12px 20px', borderBottom: `1px solid ${LINE}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: AGENT_GRADIENTS[agent.type],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEADING, fontSize: 13, fontWeight: 700,
                  color: agent.type === 'content' ? INK : PAPER, flexShrink: 0,
                }}>
                  {AGENT_LETTERS[agent.type]}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PAPER }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{agent.role} · {agent.model}</div>
                </div>
                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: agent.status === 'live' ? GREEN : MUTED,
                    animation: agent.status === 'live' ? 'pulse 2.6s infinite ease-in-out' : 'none',
                  }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: agent.status === 'live' ? GREEN : MUTED }}>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
