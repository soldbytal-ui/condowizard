'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
export type LeadStatus =
  | 'new' | 'contacted' | 'showing' | 'offer' | 'under_contract' | 'closed' | 'lost';

export type LeadSource =
  | 'Website Form' | 'Google Ads' | 'Meta Ads' | 'Instagram' | 'Referral' | 'Walk-in' | 'Manual';

export interface Activity {
  id: string;
  type: 'created' | 'status_changed' | 'note_added' | 'follow_up_scheduled' | 'campaign_sent' | 'edited';
  description: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  interest: string;
  budget: string;
  timeline: string;
  status: LeadStatus;
  notes: string;
  activities: Activity[];
  nextFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
export const CRM_LEADS_STORAGE_KEY = 'scale-crm-leads';

interface StageMeta {
  id: LeadStatus;
  label: string;
  accent: string;        // top border + dot color
  badgeColor: string;    // text color for status badge
  badgeBg: string;
}

const STAGES: StageMeta[] = [
  { id: 'new',            label: 'New',            accent: '#0066FF', badgeColor: '#93C5FD', badgeBg: 'rgba(0,102,255,0.16)' },
  { id: 'contacted',      label: 'Contacted',      accent: '#F59E0B', badgeColor: '#FCD34D', badgeBg: 'rgba(245,158,11,0.16)' },
  { id: 'showing',        label: 'Showing',        accent: '#8B5CF6', badgeColor: '#C4B5FD', badgeBg: 'rgba(139,92,246,0.16)' },
  { id: 'offer',          label: 'Offer',          accent: '#06B6D4', badgeColor: '#67E8F9', badgeBg: 'rgba(6,182,212,0.16)' },
  { id: 'under_contract', label: 'Under Contract', accent: '#10B981', badgeColor: '#6EE7B7', badgeBg: 'rgba(16,185,129,0.16)' },
  { id: 'closed',         label: 'Closed',         accent: '#047857', badgeColor: '#A7F3D0', badgeBg: 'rgba(4,120,87,0.22)' },
  { id: 'lost',           label: 'Lost',           accent: '#6B7185', badgeColor: '#9CA3AF', badgeBg: 'rgba(107,113,133,0.18)' },
];

const SOURCES: LeadSource[] = ['Website Form', 'Google Ads', 'Meta Ads', 'Instagram', 'Referral', 'Walk-in', 'Manual'];

const BUDGETS = ['Under $500K', '$500K-$750K', '$750K-$1M', '$1M-$1.5M', '$1.5M-$2M', '$2M+'];

const TIMELINES = ['Immediately', '1-3 months', '3-6 months', '6-12 months', '12+ months'];

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
  surfaceInner: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.14)',
  accentBorder: 'rgba(0,102,255,0.4)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.14)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

// ═══════════════════════════════════════════════════════════════
// Sample data + storage helpers
// ═══════════════════════════════════════════════════════════════
function nowIso() { return new Date().toISOString(); }
function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}
function inDaysIso(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}
function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function defaultLeads(): Lead[] {
  const today = nowIso();
  const make = (
    name: string,
    email: string,
    phone: string,
    source: LeadSource,
    interest: string,
    budget: string,
    timeline: string,
    status: LeadStatus,
    createdDaysAgo: number,
    nextFollowUpDays: number | null,
  ): Lead => {
    const created = daysAgoIso(createdDaysAgo);
    const id = uid('lead');
    const activities: Activity[] = [
      { id: uid('act'), type: 'created', description: `Lead created from ${source}.`, timestamp: created },
    ];
    if (status !== 'new') {
      activities.push({
        id: uid('act'),
        type: 'status_changed',
        description: `Status changed to ${prettyStatus(status)}.`,
        timestamp: daysAgoIso(Math.max(0, createdDaysAgo - 1)),
      });
    }
    return {
      id, name, email, phone, source, interest, budget, timeline, status,
      notes: '',
      activities,
      nextFollowUp: nextFollowUpDays === null ? null : inDaysIso(nextFollowUpDays),
      createdAt: created,
      updatedAt: today,
      assignedTo: 'Tal Shelef',
    };
  };

  return [
    make('Sarah Chen',      'sarah.chen@example.com',     '(416) 555-0142', 'Google Ads',   'KING Toronto',                  '$500K-$750K', '3-6 months', 'new',        1, 1),
    make('Michael Roberts', 'mroberts@example.com',       '(647) 555-0188', 'Website Form', '2bed Yorkville',                '$1M-$1.5M',   '1-3 months', 'contacted',  3, 2),
    make('Priya Sharma',    'priya.sharma@example.com',   '(416) 555-0210', 'Meta Ads',     '8 Wellesley',                   '$500K-$750K', 'Immediately','showing',    5, 0),
    make('James Wilson',    'jwilson@example.com',        '(905) 555-0177', 'Referral',     '429 Walmer',                    '$2M+',        '1-3 months', 'offer',      8, 1),
    make('Lisa Park',       'lisa.park@example.com',      '(416) 555-0234', 'Instagram',    'First-time buyer downtown',     'Under $500K', '6-12 months','new',        0, 3),
  ];
}

function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CRM_LEADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  // First-time visit: seed with sample leads.
  const seeded = defaultLeads();
  try { window.localStorage.setItem(CRM_LEADS_STORAGE_KEY, JSON.stringify(seeded)); } catch {}
  return seeded;
}

function saveLeads(leads: Lead[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(CRM_LEADS_STORAGE_KEY, JSON.stringify(leads)); } catch {}
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function prettyStatus(s: LeadStatus): string {
  return STAGES.find((x) => x.id === s)?.label || s;
}
function stageMeta(s: LeadStatus): StageMeta {
  return STAGES.find((x) => x.id === s) || STAGES[0];
}
function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  // overdue if date is today or earlier (date-only comparison)
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() <= t.getTime();
}
function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso).getTime();
  return !Number.isNaN(d) && Date.now() - d <= days * 86400000;
}

// ═══════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════
export default function CrmPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all');
  const [sort, setSort] = useState<{ key: keyof Lead; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [addOpen, setAddOpen] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  useEffect(() => {
    setLeads(loadLeads());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLeads(leads);
  }, [leads, hydrated]);

  // Stats
  const totalLeads = leads.length;
  const newThisWeek = useMemo(() => leads.filter((l) => isWithinDays(l.createdAt, 7)).length, [leads]);
  const followUpsDue = useMemo(() => leads.filter((l) => isOverdue(l.nextFollowUp)).length, [leads]);
  const conversionRate = useMemo(() => {
    if (totalLeads === 0) return 0;
    const closed = leads.filter((l) => l.status === 'closed').length;
    return Math.round((closed / totalLeads) * 100);
  }, [leads, totalLeads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (q) {
        const hay = `${l.name} ${l.email} ${l.phone} ${l.interest} ${l.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const as = av == null ? '' : String(av);
      const bs = bv == null ? '' : String(bv);
      const cmp = as.localeCompare(bs, undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort]);

  const openLead = (id: string) => router.push(`/admin/scale/crm/${id}`);

  // ── Lead mutations ───────────────────────────────────────────
  const addLead = (input: Omit<Lead, 'id' | 'activities' | 'createdAt' | 'updatedAt' | 'notes'> & { notes?: string }) => {
    const created = nowIso();
    const lead: Lead = {
      id: uid('lead'),
      ...input,
      notes: input.notes || '',
      activities: [{
        id: uid('act'), type: 'created',
        description: `Lead created from ${input.source}.`,
        timestamp: created,
      }],
      createdAt: created,
      updatedAt: created,
    };
    setLeads((prev) => [lead, ...prev]);
  };

  const moveLead = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      if (l.status === status) return l;
      return {
        ...l,
        status,
        updatedAt: nowIso(),
        activities: [
          { id: uid('act'), type: 'status_changed', description: `Status changed to ${prettyStatus(status)}.`, timestamp: nowIso() },
          ...l.activities,
        ],
      };
    }));
  };

  return (
    <div style={{ background: S.pageBg, minHeight: '100%', fontFamily: S.font, color: S.pageHeading, fontSize: 16, lineHeight: 1.6 }}>
      <style>{`
        @keyframes sFadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes sSlideRight { from { transform: translateX(100%);} to { transform: translateX(0);} }
        .crm-row:hover { background: ${S.surfaceHover} !important; }
        .crm-card-hover:hover { border-color: ${S.borderHover} !important; }
        .crm-scroll::-webkit-scrollbar { height: 10px; width: 8px; }
        .crm-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 5px; }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 40px 96px', animation: 'sFadeIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              CRM
            </h1>
            <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 0', lineHeight: 1.6 }}>
              Manage leads, follow-ups, and pipeline.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              padding: '13px 28px', borderRadius: 11,
              background: S.accent, color: S.white, border: 'none',
              fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 6px 20px rgba(0,102,255,0.25)',
            }}
          >
            + Add Lead
          </button>
        </div>

        {/* Stats */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20, marginBottom: 40,
        }}>
          <StatCard label="Total Leads" value={totalLeads.toString()} subtitle="all-time" />
          <StatCard label="New This Week" value={newThisWeek.toString()} subtitle="last 7 days" accent={S.accent} />
          <StatCard
            label="Follow-Ups Due"
            value={followUpsDue.toString()}
            subtitle={followUpsDue > 0 ? 'today or overdue' : 'all caught up'}
            accent={followUpsDue > 0 ? S.red : undefined}
          />
          <StatCard label="Conversion Rate" value={`${conversionRate}%`} subtitle="closed / total" accent={S.green} />
        </section>

        {/* Toolbar — view toggle + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', padding: 4, borderRadius: 11,
            background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            {(['board', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '9px 18px', borderRadius: 8,
                  background: view === v ? S.accent : 'transparent',
                  color: view === v ? S.white : S.pageHeading,
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, fontFamily: S.font,
                }}
              >
                {v === 'board' ? 'Board' : 'Table'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 11,
                background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                color: S.pageHeading, fontSize: 14, fontFamily: S.font, outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'all' | LeadStatus)}
            options={[{ value: 'all', label: 'All statuses' }, ...STAGES.map((s) => ({ value: s.id, label: s.label }))]}
          />

          <FilterSelect
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as 'all' | LeadSource)}
            options={[{ value: 'all', label: 'All sources' }, ...SOURCES.map((s) => ({ value: s, label: s }))]}
          />
        </div>

        {/* Board or Table */}
        {view === 'board' ? (
          <Board
            leads={filtered}
            onOpen={openLead}
            onMove={moveLead}
            dragOverColumn={dragOverColumn}
            setDragOverColumn={setDragOverColumn}
          />
        ) : (
          <Table
            leads={sorted}
            sort={sort}
            setSort={setSort}
            onOpen={openLead}
          />
        )}

        {addOpen && (
          <AddLeadModal
            onClose={() => setAddOpen(false)}
            onAdd={(payload) => { addLead(payload); setAddOpen(false); }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stat card
// ═══════════════════════════════════════════════════════════════
function StatCard({ label, value, subtitle, accent }: { label: string; value: string; subtitle: string; accent?: string }) {
  return (
    <div style={{
      background: S.surface, color: S.textPrimary,
      border: `1px solid ${S.border}`, borderRadius: 16, padding: 28,
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ fontSize: 15, color: S.textSecondary, marginBottom: 14, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: accent || S.white, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: S.textMuted }}>{subtitle}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Filter dropdown (styled, light theme)
// ═══════════════════════════════════════════════════════════════
function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const active = value !== 'all';
  return (
    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: '13px 38px 13px 16px', borderRadius: 11,
          background: active ? 'rgba(0,102,255,0.10)' : '#fff',
          border: `1px solid ${active ? S.accentBorder : 'rgba(0,0,0,0.12)'}`,
          color: active ? S.accent : S.pageHeading,
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, outline: 'none',
          minWidth: 180,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#fff', color: S.pageHeading }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: S.pageSubtitle, display: 'flex',
      }}>
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>
      </span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════
// Pipeline board
// ═══════════════════════════════════════════════════════════════
function Board({
  leads, onOpen, onMove, dragOverColumn, setDragOverColumn,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onMove: (id: string, status: LeadStatus) => void;
  dragOverColumn: LeadStatus | null;
  setDragOverColumn: (s: LeadStatus | null) => void;
}) {
  return (
    <div className="crm-scroll" style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 16, minWidth: STAGES.length * 296 }}>
        {STAGES.map((stage) => {
          const cards = leads.filter((l) => l.status === stage.id);
          const isOver = dragOverColumn === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(stage.id); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/lead-id');
                if (id) onMove(id, stage.id);
                setDragOverColumn(null);
              }}
              style={{
                width: 280, flexShrink: 0,
                background: S.surface, color: S.textPrimary,
                border: `1px solid ${isOver ? stage.accent : S.border}`,
                borderTop: `2px solid ${stage.accent}`,
                borderRadius: 16,
                boxShadow: isOver ? `0 0 0 4px ${hexAlpha(stage.accent, 0.18)}, ${CARD_SHADOW}` : CARD_SHADOW,
                transition: 'box-shadow 0.15s, border-color 0.15s',
                display: 'flex', flexDirection: 'column',
                maxHeight: 'calc(100vh - 360px)', minHeight: 360,
              }}
            >
              <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.accent }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: S.white }}>{stage.label}</span>
                </div>
                <span style={{
                  fontSize: 12, fontFamily: S.mono,
                  padding: '3px 10px', borderRadius: 100,
                  background: S.surfaceInner, color: S.textSecondary,
                }}>
                  {cards.length}
                </span>
              </div>

              <div className="crm-scroll" style={{
                padding: '4px 12px 12px',
                display: 'flex', flexDirection: 'column', gap: 8,
                overflowY: 'auto', flex: 1,
              }}>
                {cards.length === 0 && (
                  <div style={{ fontSize: 13, color: S.textMuted, padding: 16, textAlign: 'center' }}>
                    No leads here.
                  </div>
                )}
                {cards.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onOpen={() => onOpen(lead.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const overdue = isOverdue(lead.nextFollowUp);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/lead-id', lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onOpen}
      className="crm-card-hover"
      style={{
        background: S.surfaceInner, border: `1px solid ${S.border}`,
        borderRadius: 11, padding: 14, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 6,
        color: S.textPrimary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: S.white }}>{lead.name}</span>
        <span style={{
          fontSize: 11, fontFamily: S.mono,
          padding: '2px 8px', borderRadius: 5,
          background: 'rgba(255,255,255,0.05)', color: S.textSecondary,
          flexShrink: 0,
        }}>
          {lead.source}
        </span>
      </div>
      {lead.interest && (
        <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.45 }}>{lead.interest}</div>
      )}
      {lead.phone && (
        <div style={{ fontSize: 14, color: '#C8CBD3', fontFamily: S.mono }}>{lead.phone}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: S.textMuted }}>
          {timeAgo(lead.updatedAt)}
        </span>
        {lead.nextFollowUp && (
          <span style={{
            fontSize: 12, fontFamily: S.mono,
            color: overdue ? S.red : S.textMuted,
            fontWeight: overdue ? 600 : 500,
          }}>
            {overdue ? 'Due ' : 'Follow-up '}{formatDate(lead.nextFollowUp)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function hexAlpha(hex: string, alpha: number): string {
  // Convert #RRGGBB to rgba
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ═══════════════════════════════════════════════════════════════
// Table view
// ═══════════════════════════════════════════════════════════════
function Table({
  leads, sort, setSort, onOpen,
}: {
  leads: Lead[];
  sort: { key: keyof Lead; dir: 'asc' | 'desc' };
  setSort: (s: { key: keyof Lead; dir: 'asc' | 'desc' }) => void;
  onOpen: (id: string) => void;
}) {
  const headers: Array<{ key: keyof Lead; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source' },
    { key: 'interest', label: 'Interest' },
    { key: 'status', label: 'Status' },
    { key: 'updatedAt', label: 'Last Activity' },
    { key: 'nextFollowUp', label: 'Next Follow-Up' },
    { key: 'assignedTo', label: 'Assigned To' },
  ];

  const toggleSort = (key: keyof Lead) => {
    if (sort.key === key) setSort({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else setSort({ key, dir: 'asc' });
  };

  return (
    <div style={{
      background: S.surface, color: S.textPrimary,
      border: `1px solid ${S.border}`, borderRadius: 16, overflow: 'hidden',
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.font }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
              {headers.map((h) => {
                const active = sort.key === h.key;
                return (
                  <th key={h.key as string} style={{
                    textAlign: 'left', fontSize: 13, fontWeight: 600,
                    color: active ? S.white : S.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '14px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
                  }} onClick={() => toggleSort(h.key)}>
                    {h.label}
                    {active && (
                      <span style={{ marginLeft: 6, color: S.accent }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: 36, textAlign: 'center', color: S.textMuted, fontSize: 14 }}>
                  No leads match these filters.
                </td>
              </tr>
            ) : leads.map((l) => {
              const overdue = isOverdue(l.nextFollowUp);
              const stage = stageMeta(l.status);
              return (
                <tr key={l.id} className="crm-row" onClick={() => onOpen(l.id)} style={{ borderBottom: `1px solid ${S.border}`, cursor: 'pointer' }}>
                  <td style={{ padding: '14px 16px', fontSize: 15, fontWeight: 600, color: S.white, whiteSpace: 'nowrap' }}>
                    {l.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                    {l.email || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                    {l.phone || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary }}>
                    {l.source}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.interest || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={l.status} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                    {timeAgo(l.updatedAt)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: overdue ? S.red : S.textMuted, fontFamily: S.mono, fontWeight: overdue ? 600 : 500, whiteSpace: 'nowrap' }}>
                    {l.nextFollowUp ? formatDate(l.nextFollowUp) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary, whiteSpace: 'nowrap' }}>
                    {l.assignedTo || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const stage = stageMeta(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '5px 12px', borderRadius: 100,
      background: stage.badgeBg, color: stage.badgeColor,
      fontSize: 12, fontWeight: 600,
      border: `1px solid ${hexAlpha(stage.accent, 0.4)}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.accent }} />
      {stage.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Add Lead modal
// ═══════════════════════════════════════════════════════════════
function AddLeadModal({
  onClose, onAdd,
}: {
  onClose: () => void;
  onAdd: (payload: {
    name: string; email: string; phone: string;
    source: LeadSource; interest: string; budget: string; timeline: string;
    status: LeadStatus; nextFollowUp: string | null; assignedTo: string | null; notes?: string;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('Website Form');
  const [interest, setInterest] = useState('');
  const [budget, setBudget] = useState(BUDGETS[1]);
  const [timeline, setTimeline] = useState(TIMELINES[1]);
  const [status, setStatus] = useState<LeadStatus>('new');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    onAdd({
      name: name.trim(), email: email.trim(), phone: phone.trim(),
      source, interest: interest.trim(), budget, timeline, status,
      nextFollowUp: nextFollowUp || null,
      assignedTo: 'Tal Shelef',
      notes: notes.trim(),
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(11,13,17,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: S.font,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540, maxWidth: '92vw', maxHeight: '88vh',
          background: S.bg, color: S.textPrimary,
          border: `1px solid ${S.border}`, borderRadius: 18,
          padding: 32, overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.015em' }}>
            Add lead
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Full Name *">
            <Input value={name} onChange={setName} placeholder="Sarah Chen" autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Email">
              <Input value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={setPhone} placeholder="(416) 555-0100" type="tel" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Source">
              <Select value={source} onChange={(v) => setSource(v as LeadSource)} options={SOURCES.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(v) => setStatus(v as LeadStatus)} options={STAGES.map((s) => ({ value: s.id, label: s.label }))} />
            </Field>
          </div>
          <Field label="Interest">
            <Input value={interest} onChange={setInterest} placeholder="KING Toronto, 2bed downtown under $800K, etc." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Budget Range">
              <Select value={budget} onChange={setBudget} options={BUDGETS.map((b) => ({ value: b, label: b }))} />
            </Field>
            <Field label="Timeline">
              <Select value={timeline} onChange={setTimeline} options={TIMELINES.map((t) => ({ value: t, label: t }))} />
            </Field>
          </div>
          <Field label="Next Follow-Up">
            <Input value={nextFollowUp} onChange={setNextFollowUp} type="date" />
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember about this lead…"
              rows={3}
              style={inputStyle()}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={ghostButton()}>Cancel</button>
          <button onClick={submit} disabled={!canSave} style={primaryButton(!canSave)}>
            Save lead
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// Generic field/input/select for the modal + edit form (dark)
// ═══════════════════════════════════════════════════════════════
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: S.textMuted, fontWeight: 500, letterSpacing: '0.01em' }}>{label}</span>
      {children}
    </label>
  );
}

function Input({
  value, onChange, type = 'text', placeholder, autoFocus,
}: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={inputStyle()}
    />
  );
}

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          ...inputStyle(),
          paddingRight: 36, cursor: 'pointer',
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
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`,
    color: S.textPrimary, fontSize: 14, fontFamily: S.font, outline: 'none',
    lineHeight: 1.55,
  };
}

function sectionLabelStyle(): React.CSSProperties {
  return {
    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: S.textMuted, fontWeight: 600, marginBottom: 10, display: 'block',
  };
}

function ghostButton(): React.CSSProperties {
  return {
    padding: '12px 22px', borderRadius: 10,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: S.font,
  };
}

function primaryButton(disabled?: boolean): React.CSSProperties {
  return {
    padding: '12px 22px', borderRadius: 10,
    background: disabled ? 'rgba(255,255,255,0.05)' : S.accent,
    color: disabled ? S.textMuted : S.white,
    border: 'none', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: S.font,
  };
}

function tinyGhostBtn(): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 7,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: S.font,
  };
}

function tinyPrimaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 7,
    background: disabled ? 'rgba(255,255,255,0.04)' : S.accent,
    color: disabled ? S.textMuted : S.white,
    border: 'none', fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: S.font,
  };
}
