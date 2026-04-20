'use client';

import Link from 'next/link';

const INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C', ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

const KPIS = [
  { label: 'New Leads 24h', value: '7', delta: '+3 vs yesterday' },
  { label: 'Ad Spend 24h', value: '$142', delta: 'CAD' },
  { label: 'Showings Booked', value: '3', delta: 'this week' },
  { label: 'Active Campaigns', value: '5', delta: 'running' },
];

const PIPELINE = [
  { stage: 'New', count: 4, color: '#3B82F6' },
  { stage: 'Contacted', count: 3, color: '#F59E0B' },
  { stage: 'Showing', count: 2, color: '#8B5CF6' },
  { stage: 'Offer', count: 1, color: '#06B6D4' },
  { stage: 'Under Contract', count: 1, color: GREEN },
  { stage: 'Closed', count: 2, color: '#047857' },
];

const AI_AGENTS = [
  { name: 'Lead Qualifier', status: 'Qualified 3 leads overnight — 2 hot, 1 cold', color: GREEN },
  { name: 'Showing Confirmer', status: 'Confirmed 2 showings for tomorrow', color: '#3B82F6' },
  { name: 'Cold Lead Re-engager', status: 'Called 5 cold leads, 1 re-engaged', color: '#F59E0B' },
];

const CAMPAIGNS = [
  { name: 'KING Toronto · Google Search', spent: 68, result: '3 leads' },
  { name: '429 Walmer · Meta Lead Gen', spent: 42, result: '2 leads' },
  { name: 'Yorkville Area Page · SEO', spent: 0, result: '#4 ranking' },
  { name: 'Liberty Village · IG Carousel', spent: 22, result: '1 lead' },
  { name: 'Email Nurture · KING Toronto', spent: 10, result: '2 opens' },
];

const MODULES = [
  { name: 'Pre-construction Database', desc: '340+ active projects with floor plans, pricing, incentives', status: 'live' },
  { name: 'Area Pages (Programmatic SEO)', desc: 'Auto-generated neighbourhood landing pages', status: 'live' },
  { name: 'MLS Integration (Repliers API)', desc: 'Live resale and rental listings from TRREB', status: 'live' },
  { name: 'Assignment Sales Marketplace', desc: 'Pre-construction assignment listings', status: 'planned' },
  { name: 'Neighbourhood Map', desc: '3D buildings, walk score, transit, amenities', status: 'live' },
  { name: 'Voice Agent: Lead Qualifier', desc: 'AI calls new leads within 30s of registration', status: 'live' },
  { name: 'Voice Agent: Showing Confirmer', desc: 'Confirms showings 24h before', status: 'live' },
  { name: 'Mortgage Calculator', desc: 'Pre-approval estimates with live rates', status: 'planned' },
  { name: 'Client Portal', desc: 'Buyers track their purchase journey', status: 'planned' },
  { name: 'Agent Brain: RECO Compliance', desc: 'Ontario real estate advertising rules baked in', status: 'live' },
];

const MARKET_INTEL = [
  'King West: 12 active pre-con projects, median $1,150/sqft',
  'Yorkville: 3 new launches this month, avg $1,800/sqft',
  'Liberty Village: rental yields at 4.8%, investor-heavy',
  'Mississauga: fastest growing suburb, 18 projects launching',
];

export default function RealEstatePreview() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER, maxWidth: 1200 }}>
      <style>{`.re-card { transition: all 0.15s; } .re-card:hover { border-color: rgba(255,255,255,0.12) !important; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Link href="/admin/platform/services" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>← Back to Services</Link>
        <span style={{ fontFamily: FM, fontSize: 9, padding: '4px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#B670E8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PREVIEW MODE · REAL ESTATE</span>
      </div>

      <h1 style={{ fontFamily: FH, fontSize: 32, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Real Estate Dashboard</h1>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px' }}>This is what a Real Estate tenant sees. Pre-construction focused with RECO compliance built in.</p>

      {/* Mock tenant bar */}
      <div style={{ background: INK2, borderRadius: 10, border: `1px solid ${LINE}`, padding: '10px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏢</span>
          <span style={{ fontFamily: FH, fontSize: 16, color: PAPER }}>CondoWizard</span>
          <span style={{ fontFamily: FM, fontSize: 9, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PRO · REAL ESTATE</span>
        </div>
        <span style={{ fontFamily: FM, fontSize: 10, color: MUTED }}>Credits: 6,812 / 10,000</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {KPIS.map(k => (
          <div key={k.label} style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20 }}>
            <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: FH, fontSize: 30, fontWeight: 400, letterSpacing: '-0.03em', color: PAPER }}>{k.value}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {['New Campaign', 'New Lead', 'Call Lead', 'Edit Site'].map(a => (
          <button key={a} style={{ padding: '12px 18px', borderRadius: 10, background: ACCENT_DIM, border: `1px solid rgba(255,74,28,0.2)`, color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'default', fontFamily: FB }}>{a}</button>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 32 }}>
        {/* Pipeline */}
        <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 20 }}>
          <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, color: PAPER, marginBottom: 16 }}>CRM Pipeline</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PIPELINE.map(s => (
              <div key={s.stage} style={{ flex: 1, background: INK3, borderRadius: 10, padding: 14, borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
                <div style={{ fontFamily: FH, fontSize: 24, color: PAPER, marginBottom: 4 }}>{s.count}</div>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: FM }}>{s.stage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
            <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 400, color: PAPER, marginBottom: 14 }}>AI Agents at Work</div>
            {AI_AGENTS.map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: PAPER }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{a.status}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
            <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 400, color: PAPER, marginBottom: 14 }}>Active Campaigns</div>
            {CAMPAIGNS.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: PAPER }}>{c.name}</span>
                <span style={{ fontFamily: FM, fontSize: 10, color: MUTED }}>${c.spent} · {c.result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Intel */}
      <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontFamily: FH, fontSize: 20, fontWeight: 400, margin: '0 0 14px' }}>Toronto/GTA Market Intelligence</h2>
        {MARKET_INTEL.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: MUTED }}>
            <span style={{ color: ACCENT, flexShrink: 0 }}>•</span> {t}
          </div>
        ))}
      </div>

      {/* Modules */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Modules available in Real Estate</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {MODULES.map(m => (
            <div key={m.name} className="re-card" style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: PAPER }}>{m.name}</span>
                <span style={{ fontFamily: FM, fontSize: 9, padding: '2px 8px', borderRadius: 4, background: m.status === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: m.status === 'live' ? GREEN : MUTED, textTransform: 'uppercase' }}>{m.status}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
