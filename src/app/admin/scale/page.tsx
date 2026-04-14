'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { loadScaleConfig, ScaleModelConfig } from '@/lib/scale-ai';

// ═══════════════════════════════════════════════════════════════
// Types (must stay in sync with campaigns/page.tsx)
// ═══════════════════════════════════════════════════════════════
type HistoryStatus = 'Generated' | 'Pushed' | 'Failed';
interface ScaleHistoryEntry {
  id: string;
  campaignName: string;
  campaignType: string;
  campaignTypeLabel: string;
  channelId: string;
  channelName: string;
  projects: string[];
  budget: number;
  status: HistoryStatus;
  date: string;
}

interface BrainEntry { id: string; text: string; active: boolean }
interface BrainCategory { id: string; label: string; color?: string; entries: BrainEntry[] }

interface GoogleAdsStatus {
  connected: boolean;
  email?: string | null;
  customerId?: string | null;
}

// Mirror of CRM lead shape — kept narrow so we don't import from /crm.
interface CrmLead {
  id: string;
  name: string;
  source: string;
  interest: string;
  status: 'new' | 'contacted' | 'showing' | 'offer' | 'under_contract' | 'closed' | 'lost';
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════
const S = {
  pageBg: '#F5F5F7',
  pageHeading: '#111318',
  pageSubtitle: '#6B7185',
  bg: '#111318',
  surface: '#111318',
  surfaceHover: '#1A1D23',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.12)',
  accentBorder: 'rgba(0,102,255,0.35)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.14)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  textDim: '#555B67',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 20, letterSpacing: '-0.01em',
  color: S.pageHeading, fontWeight: 600, marginBottom: 18,
};

// ═══════════════════════════════════════════════════════════════
// Quick action definitions — must match CampaignType ids in wizard
// ═══════════════════════════════════════════════════════════════
const QUICK_ACTIONS = [
  { type: 'pre_construction',    title: 'New Pre-Con Campaign', description: 'Advertise a pre-construction project.',     color: '#0066FF', iconPath: 'M3 20V10l5-4 5 4v10H3z M13 20V6l5-3 3 3v14H13z M3 20h18' },
  { type: 'area_pages',          title: 'Area Page Ads',        description: 'Target a neighborhood search.',              color: '#8B5CF6', iconPath: 'M12 2a7 7 0 00-7 7c0 4.5 7 13 7 13s7-8.5 7-13a7 7 0 00-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z' },
  { type: 'community_listings',  title: 'Community Listings',   description: 'Live MLS homes for sale.',                   color: '#10B981', iconPath: 'M3 12l9-8 9 8v8a2 2 0 01-2 2h-4v-6H10v6H6a2 2 0 01-2-2v-8z' },
  { type: 'condo_staging',       title: 'Staging Ads',          description: 'Toronto condo staging services.',            color: '#EC4899', iconPath: 'M4 20l6-6 3 3 7-7 M4 20h16 M14 4l4 4 M10 4h8v8' },
  { type: 'short_term_rentals',  title: 'Investor / Airbnb',    description: 'Furnished rental yield angle.',              color: '#F59E0B', iconPath: 'M7 11V7a5 5 0 0110 0v4 M5 11h14v10H5z M12 16v2' },
  { type: 'custom',              title: 'Custom Campaign',      description: 'Write a brief — AI does the rest.',          color: '#6366F1', iconPath: 'M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z' },
];

const SCALE_HISTORY_STORAGE_KEY = 'scale-campaign-history';
const SCALE_BRAIN_STORAGE_KEY = 'scale-agent-brain';
const CRM_LEADS_STORAGE_KEY = 'scale-crm-leads';

const LEAD_STATUS_LABELS: Record<CrmLead['status'], string> = {
  new: 'New', contacted: 'Contacted', showing: 'Showing', offer: 'Offer',
  under_contract: 'Under Contract', closed: 'Closed', lost: 'Lost',
};
const LEAD_STATUS_COLORS: Record<CrmLead['status'], { color: string; bg: string; border: string }> = {
  new:            { color: '#93C5FD', bg: 'rgba(0,102,255,0.16)',   border: 'rgba(0,102,255,0.4)' },
  contacted:      { color: '#FCD34D', bg: 'rgba(245,158,11,0.16)',  border: 'rgba(245,158,11,0.4)' },
  showing:        { color: '#C4B5FD', bg: 'rgba(139,92,246,0.16)',  border: 'rgba(139,92,246,0.4)' },
  offer:          { color: '#67E8F9', bg: 'rgba(6,182,212,0.16)',   border: 'rgba(6,182,212,0.4)' },
  under_contract: { color: '#6EE7B7', bg: 'rgba(16,185,129,0.16)',  border: 'rgba(16,185,129,0.4)' },
  closed:         { color: '#A7F3D0', bg: 'rgba(4,120,87,0.22)',    border: 'rgba(4,120,87,0.5)' },
  lost:           { color: '#9CA3AF', bg: 'rgba(107,113,133,0.18)', border: 'rgba(107,113,133,0.4)' },
};

// ═══════════════════════════════════════════════════════════════
// Main dashboard
// ═══════════════════════════════════════════════════════════════
export default function ScaleDashboard() {
  const [history, setHistory] = useState<ScaleHistoryEntry[]>([]);
  const [brainCategories, setBrainCategories] = useState<BrainCategory[]>([]);
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleAdsStatus | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCALE_HISTORY_STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(CRM_LEADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLeads(parsed);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(SCALE_BRAIN_STORAGE_KEY);
      if (raw) setBrainCategories(JSON.parse(raw));
    } catch {}
    setConfig(loadScaleConfig());
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/google/status', { cache: 'no-store' });
        setGoogleStatus(await res.json());
      } catch {
        setGoogleStatus({ connected: false });
      }
    })();
  }, []);

  // Derived metrics
  const activeCampaigns = useMemo(
    () => history.filter((h) => h.status === 'Pushed').length,
    [history]
  );

  const totalAdSpend = useMemo(() => {
    const now = Date.now();
    let spend = 0;
    history.forEach((h) => {
      if (h.status !== 'Pushed') return;
      const started = new Date(h.date).getTime();
      const days = Math.max(0, (now - started) / (1000 * 60 * 60 * 24));
      spend += h.budget * Math.min(days, 30) * Math.max(1, h.projects.length);
    });
    return Math.round(spend);
  }, [history]);

  const totalBrainRules = useMemo(
    () => brainCategories.reduce((sum, c) => sum + (c.entries?.length || 0), 0),
    [brainCategories]
  );
  const activeBrainRules = useMemo(
    () => brainCategories.reduce((sum, c) => sum + (c.entries?.filter((e) => e.active).length || 0), 0),
    [brainCategories]
  );

  const mostAdvertisedProject = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((h) => {
      h.projects.forEach((p) => counts.set(p, (counts.get(p) || 0) + 1));
    });
    let best: { name: string; count: number } | null = null;
    counts.forEach((count, name) => {
      if (!best || count > best.count) best = { name, count };
    });
    return best;
  }, [history]);

  const recent = history.slice(0, 10);
  const providerLabel = config ? prettyProvider(config.provider) : '—';

  // CRM-derived metrics
  const leadsThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return leads.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }, [leads]);

  const costPerLead: number | null = useMemo(() => {
    if (totalAdSpend <= 0 || leads.length === 0) return null;
    return Math.round(totalAdSpend / leads.length);
  }, [totalAdSpend, leads.length]);

  const recentLeads = useMemo(
    () => [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [leads]
  );

  return (
    <div style={{ fontFamily: S.font, color: S.pageHeading, fontSize: 16, lineHeight: 1.6, background: S.pageBg, minHeight: '100%' }}>
      <style>{`
        @keyframes sSlideIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .s-card { transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .s-card:hover:not(.s-disabled) { border-color: ${S.borderHover} !important; }
        .s-action:hover { transform: translateY(-2px); border-color: ${S.borderHover} !important; }
        .s-row:hover { background: ${S.surfaceHover} !important; }
        a { text-decoration: none; }
      `}</style>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 40px 96px', animation: 'sSlideIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Scale
          </h1>
          <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 0', lineHeight: 1.6 }}>
            AI-powered ad automation for CondoWizard.ca
          </p>
        </div>

        {/* Section 1 — Metrics */}
        <section style={{ marginBottom: 40 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}>
            <MetricCard
              label="Active Campaigns"
              value={activeCampaigns.toString()}
              subtitle={activeCampaigns === 1 ? 'campaign running' : 'campaigns running'}
            />
            <MetricCard
              label="Total Ad Spend"
              value={totalAdSpend === 0 ? '—' : `$${totalAdSpend.toLocaleString()}`}
              subtitle={totalAdSpend === 0 ? 'No campaigns pushed yet' : 'estimated across pushed campaigns'}
              mono
            />
            <MetricCard
              label="Leads This Week"
              value={leadsThisWeek.toString()}
              subtitle={leads.length === 0 ? 'No leads yet' : `${leads.length} total in CRM`}
            />
            <MetricCard
              label="Cost Per Lead"
              value={costPerLead === null ? '—' : `$${costPerLead}`}
              subtitle={costPerLead === null ? 'Push a campaign + add leads' : 'spend ÷ leads'}
              mono
            />
          </div>
        </section>

        {/* Section 2 — Quick actions */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={sectionLabelStyle}>Quick actions</div>
            <Link href="/admin/scale/campaigns" style={{ fontSize: 15, color: S.accent, fontWeight: 500 }}>
              Open wizard →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}>
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.type}
                href={`/admin/scale/campaigns?type=${a.type}`}
                className="s-action"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 14,
                  padding: 24, borderRadius: 16,
                  background: S.surface,
                  border: `1px solid ${S.border}`,
                  boxShadow: CARD_SHADOW,
                  color: S.textPrimary,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${a.color}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <InlineIcon path={a.iconPath} color={a.color} size={26} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.6 }}>
                  {a.description}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3 — Recent campaigns */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={sectionLabelStyle}>Recent campaigns</div>
            <Link href="/admin/scale/campaigns" style={{ fontSize: 15, color: S.accent, fontWeight: 500 }}>
              View all →
            </Link>
          </div>

          <div style={{
            background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16,
            overflow: 'hidden', boxShadow: CARD_SHADOW, color: S.textPrimary,
          }}>
            {recent.length === 0 ? (
              <div style={{
                padding: 36, textAlign: 'center',
                color: S.textMuted, fontSize: 14, lineHeight: 1.6,
              }}>
                No campaigns yet. Create your first one above.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.font }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {['Campaign', 'Type', 'Channel', 'Projects', 'Budget', 'Status', 'Date'].map((h) => (
                        <th key={h} style={{
                          textAlign: 'left', fontSize: 13, fontWeight: 600,
                          color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em',
                          padding: '14px 16px',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((h) => (
                      <tr
                        key={h.id}
                        className="s-row"
                        style={{ borderBottom: `1px solid ${S.border}`, cursor: 'default' }}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 15, fontWeight: 500, color: S.white, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                          {h.campaignName}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 15, color: S.textSecondary }}>
                          {h.campaignTypeLabel}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 15, color: S.textSecondary }}>
                          {h.channelName}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 15, color: S.textSecondary }}>
                          {h.projects.length} · {h.projects.slice(0, 2).join(', ')}{h.projects.length > 2 ? '…' : ''}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 15, color: '#C8CBD3', fontFamily: S.mono }}>
                          ${h.budget}/day
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={h.status} />
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                          {formatRelativeDate(h.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Section 3.5 — Recent leads (from CRM) */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={sectionLabelStyle}>Recent leads</div>
            <Link href="/admin/scale/crm" style={{ fontSize: 15, color: S.accent, fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          <div style={{
            background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16,
            overflow: 'hidden', boxShadow: CARD_SHADOW, color: S.textPrimary,
          }}>
            {recentLeads.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: S.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                No leads yet. <Link href="/admin/scale/crm" style={{ color: S.accent }}>Add your first lead →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentLeads.map((l, i) => {
                  const c = LEAD_STATUS_COLORS[l.status] || LEAD_STATUS_COLORS.new;
                  return (
                    <Link
                      key={l.id}
                      href="/admin/scale/crm"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 20px',
                        borderBottom: i === recentLeads.length - 1 ? 'none' : `1px solid ${S.border}`,
                        color: S.textPrimary,
                      }}
                    >
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: S.white, marginBottom: 2 }}>{l.name}</div>
                        <div style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>{l.source}</div>
                      </div>
                      <div style={{ flex: '2 1 220px', fontSize: 14, color: S.textSecondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.interest || '—'}
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '5px 12px', borderRadius: 100,
                        background: c.bg, color: c.color,
                        fontSize: 12, fontWeight: 600,
                        border: `1px solid ${c.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {LEAD_STATUS_LABELS[l.status]}
                      </span>
                      <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
                        {formatRelativeDate(l.createdAt)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Section 4 — Split row: brain status + connections */}
        <section style={{ marginBottom: 40 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}>
            <SplitCard
              title="Agent Brain"
              href="/admin/scale/brain"
              linkLabel="Edit rules →"
              subtitle={`${activeBrainRules} of ${totalBrainRules} rules active`}
            >
              {brainCategories.length === 0 ? (
                <div style={{ fontSize: 15, color: S.textMuted, lineHeight: 1.6 }}>
                  No rules yet. Open Agent Brain to teach Scale your tone, legal, and brand rules.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {brainCategories.map((c) => {
                    const active = c.entries?.filter((e) => e.active).length || 0;
                    const total = c.entries?.length || 0;
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{
                          width: 11, height: 11, borderRadius: 3,
                          background: c.color || S.accent, flexShrink: 0,
                        }} />
                        <span style={{ flex: 1, fontSize: 15, color: S.textPrimary }}>{c.label}</span>
                        <span style={{ fontSize: 14, color: S.textMuted, fontFamily: S.mono }}>
                          {active} / {total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SplitCard>

            <SplitCard
              title="Connections"
              href="/admin/scale/settings"
              linkLabel="Settings →"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ConnectionRow
                  label="Google Ads"
                  value={
                    googleStatus?.connected
                      ? `Connected${googleStatus.email ? ` as ${googleStatus.email}` : ''}`
                      : 'Not connected'
                  }
                  status={googleStatus?.connected ? 'ok' : 'warn'}
                />
                <ConnectionRow
                  label="Meta Ads"
                  value="Coming soon"
                  status="pending"
                />
                <ConnectionRow
                  label="AI Provider"
                  value={config ? `${providerLabel} — ${config.model}` : 'Not configured'}
                  status={config?.apiKey || config?.provider === 'openrouter_free' ? 'ok' : 'warn'}
                />
              </div>
            </SplitCard>
          </div>
        </section>

        {/* Section 5 — Footer insights */}
        {(mostAdvertisedProject || activeBrainRules < 5) && (
          <section>
            <div style={sectionLabelStyle}>Insights</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {mostAdvertisedProject && (
                <InsightCard
                  icon="★"
                  title="Most advertised project"
                  body={
                    <>
                      <strong style={{ color: S.white }}>{(mostAdvertisedProject as { name: string }).name}</strong>
                      {' · '}
                      <span style={{ color: S.textMuted }}>
                        {(mostAdvertisedProject as { count: number }).count} campaign{(mostAdvertisedProject as { count: number }).count === 1 ? '' : 's'}
                      </span>
                    </>
                  }
                />
              )}
              {history.length > 0 && (
                <InsightCard
                  icon="↑"
                  title="Top performing campaign"
                  body={
                    <span style={{ color: S.textMuted }}>
                      Connect CRM to track click-through and conversion.
                    </span>
                  }
                />
              )}
              {activeBrainRules < 5 && (
                <InsightCard
                  icon="✦"
                  title="Agent Brain tip"
                  body={
                    <Link href="/admin/scale/brain" style={{ color: S.accent }}>
                      Add more rules to improve ad quality →
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Small components
// ═══════════════════════════════════════════════════════════════
function MetricCard({
  label, value, subtitle, mono,
}: { label: string; value: string; subtitle: string; mono?: boolean }) {
  return (
    <div style={{
      background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28,
      boxShadow: CARD_SHADOW, color: S.textPrimary,
    }}>
      <div style={{
        fontSize: 15, fontWeight: 500, color: S.textSecondary,
        marginBottom: 14, letterSpacing: '-0.005em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 36, fontWeight: 700, color: S.white, letterSpacing: '-0.02em',
        marginBottom: 8, fontFamily: mono ? S.mono : S.font, lineHeight: 1.1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: S.textMuted, lineHeight: 1.55 }}>
        {subtitle}
      </div>
    </div>
  );
}

function SplitCard({
  title, href, linkLabel, subtitle, children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28,
      boxShadow: CARD_SHADOW, color: S.textPrimary,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: subtitle ? 6 : 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 14, color: S.textMuted, marginTop: 6 }}>{subtitle}</div>
          )}
        </div>
        <Link href={href} style={{ fontSize: 14, color: S.accent, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {linkLabel}
        </Link>
      </div>
      {subtitle && <div style={{ height: 20 }} />}
      {children}
    </div>
  );
}

function ConnectionRow({
  label, value, status,
}: { label: string; value: string; status: 'ok' | 'warn' | 'pending' }) {
  const dot =
    status === 'ok' ? { color: S.green, bg: S.greenSoft } :
    status === 'warn' ? { color: S.red, bg: S.redSoft } :
    { color: S.textMuted, bg: 'rgba(255,255,255,0.04)' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 16px', borderRadius: 10,
      background: S.surfaceHover,
    }}>
      <span style={{
        width: 11, height: 11, borderRadius: '50%',
        background: dot.color, boxShadow: `0 0 0 4px ${dot.bg}`,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 16, fontWeight: 500, color: S.textSecondary, minWidth: 130 }}>{label}</span>
      <span style={{
        flex: 1, fontSize: 14,
        color: status === 'pending' ? S.textMuted : S.textPrimary,
        fontFamily: status === 'pending' ? S.font : S.mono,
        textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: HistoryStatus }) {
  const map = {
    Generated: { bg: S.accentSoft, color: '#93C5FD', border: S.accentBorder },
    Pushed:    { bg: S.greenSoft, color: S.green, border: 'rgba(16,185,129,0.3)' },
    Failed:    { bg: S.redSoft,   color: S.red,   border: 'rgba(239,68,68,0.3)' },
  } as const;
  const c = map[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 100,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, fontSize: 13, fontWeight: 600,
    }}>
      {status}
    </span>
  );
}

function InsightCard({ icon, title, body }: { icon: string; title: string; body: React.ReactNode }) {
  return (
    <div style={{
      background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24,
      display: 'flex', gap: 16, alignItems: 'flex-start',
      boxShadow: CARD_SHADOW, color: S.textPrimary,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: S.accentSoft, color: S.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: S.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 15, color: S.textPrimary, lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}

function InlineIcon({ path, color, size }: { path: string; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((d, i) => <path key={i} d={(i === 0 ? '' : 'M') + d} />)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════════════════════════
function prettyProvider(id: string): string {
  if (id === 'anthropic') return 'Anthropic';
  if (id === 'openrouter') return 'OpenRouter';
  if (id === 'openrouter_free') return 'OpenRouter (Free)';
  return id;
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) {
    const mins = Math.max(1, Math.round(diff / (1000 * 60)));
    return `${mins}m ago`;
  }
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
