'use client';

import Link from 'next/link';

const INK = '#0B0D11', INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C', ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

// ─── Mock data ───
const KPIS = [
  { label: 'Jobs Today', value: '8', delta: '+3 vs yesterday' },
  { label: 'Revenue Today', value: '$4,240', delta: 'CAD' },
  { label: 'Avg Ticket', value: '$530', delta: '+$45 vs avg' },
  { label: 'Techs on Route', value: '3', delta: 'of 5 active' },
];

const SCHEDULE = [
  { tech: 'Mike', specialty: 'HVAC', status: 'on_route', color: '#3B82F6', jobs: [
    { time: '9:00 AM', type: 'AC Repair', location: 'Mississauga', done: false },
    { time: '11:00 AM', type: 'Furnace Check', location: 'Brampton', done: false },
    { time: '2:00 PM', type: 'Install', location: 'Toronto', done: false },
  ]},
  { tech: 'Sarah', specialty: 'Plumbing', status: 'at_job', color: '#10B981', jobs: [
    { time: '10:00 AM', type: 'Drain Cleaning', location: 'North York', done: false },
    { time: '1:00 PM', type: 'Leak Repair', location: 'Etobicoke', done: false },
  ]},
  { tech: 'Carlos', specialty: 'Electrical', status: 'at_job', color: '#F59E0B', jobs: [
    { time: '8:00 AM', type: 'Panel Upgrade', location: 'Markham', done: true },
    { time: '11:30 AM', type: 'EV Charger', location: 'Vaughan', done: false },
    { time: '3:00 PM', type: 'Rewiring', location: 'Richmond Hill', done: false },
  ]},
];

const AI_AGENTS = [
  { name: 'Job Booker', status: 'On call with customer — booking emergency AC repair', color: GREEN },
  { name: 'Quote Follow-Up', status: 'Sent 4 follow-ups today, 2 closed', color: '#3B82F6' },
  { name: 'Review Collector', status: 'Called 3 customers post-service, 2 reviews pending', color: '#F59E0B' },
];

const CAMPAIGNS = [
  { name: 'Emergency AC Repair Toronto', spent: 127, result: '8 calls' },
  { name: 'Summer Tune-Up Special', spent: 89, result: '5 bookings' },
  { name: 'Service Plan Upsell', spent: 42, result: '2 conversions' },
];

const MODULES = [
  { name: 'Dispatch Board', desc: 'Drag-drop tech assignment, live route mapping', status: 'planned' },
  { name: 'Schedule', desc: 'Calendar view with tech rows and job blocks', status: 'planned' },
  { name: 'Jobs', desc: 'Full job lifecycle from quote to payment', status: 'planned' },
  { name: 'Invoicing', desc: 'Stripe-integrated invoices with financing options', status: 'planned' },
  { name: 'Tech Mobile App', desc: 'Responsive web app techs use in the field', status: 'planned' },
  { name: 'Voice Agent: Job Booker', desc: 'AI picks up after-hours calls and books service', status: 'live' },
  { name: 'Voice Agent: Emergency Dispatcher', desc: '24/7 on-call handling', status: 'live' },
  { name: 'Service Plans', desc: 'Annual maintenance contracts with auto-renewal', status: 'planned' },
  { name: 'QuickBooks Sync', desc: 'Daily financial sync', status: 'planned' },
  { name: 'Review Generator', desc: 'Auto-requests Google reviews 48h after job completion', status: 'live' },
];

const COMPARISON = [
  ['Dispatch & Scheduling', true, true],
  ['Mobile App for Techs', true, true],
  ['Invoicing + Payments', true, true],
  ['AI Voice Agent', 'Core', 'Add-on'],
  ['AI Ad Automation', true, false],
  ['AI Agent Orchestration', true, false],
  ['SEO Intelligence', true, false],
  ['AI CRM with auto-qualification', true, 'Basic'],
  ['Monthly Price', '$249', '$325'],
] as const;

export default function HomeServicesPreview() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER, maxWidth: 1200 }}>
      <style>{`.hs-card { transition: all 0.15s; } .hs-card:hover { border-color: rgba(255,255,255,0.12) !important; }`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Link href="/admin/platform/services" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>← Back to Services</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FM, fontSize: 9, padding: '4px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#B670E8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PREVIEW MODE · HOME SERVICES</span>
        </div>
      </div>

      <h1 style={{ fontFamily: FH, fontSize: 32, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Home Services Dashboard</h1>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>
        This is what a Home Services tenant sees when they log into Scale. Powered by industry-specific AI agents, dispatch tools, and field service automation.
      </p>

      {/* Mock tenant bar */}
      <div style={{ background: INK2, borderRadius: 10, border: `1px solid ${LINE}`, padding: '10px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔧</span>
          <span style={{ fontFamily: FH, fontSize: 16, color: PAPER }}>ACME HVAC</span>
          <span style={{ fontFamily: FM, fontSize: 9, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PRO · HOME SERVICES</span>
        </div>
        <span style={{ fontFamily: FM, fontSize: 10, color: MUTED }}>Credits: 8,420 / 10,000</span>
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
        {['Schedule Job', 'Send Estimate', 'Dispatch Tech', 'New Campaign'].map(a => (
          <button key={a} style={{ padding: '12px 18px', borderRadius: 10, background: ACCENT_DIM, border: `1px solid rgba(255,74,28,0.2)`, color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'default', fontFamily: FB }}>
            {a}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 32 }}>
        {/* Left — Today's Schedule */}
        <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${LINE}` }}>
            <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, color: PAPER }}>Today&apos;s Schedule</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SCHEDULE.length}, 1fr)`, minHeight: 300 }}>
            {SCHEDULE.map(tech => (
              <div key={tech.tech} style={{ borderRight: `1px solid ${LINE}`, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${tech.color}20`, color: tech.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FH, fontSize: 13, fontWeight: 700 }}>
                    {tech.tech[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: PAPER }}>{tech.tech}</div>
                    <div style={{ fontSize: 10, color: MUTED }}>{tech.specialty}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tech.jobs.map((job, i) => (
                    <div key={i} style={{ background: INK3, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${tech.color}`, opacity: job.done ? 0.5 : 1 }}>
                      <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, marginBottom: 3 }}>{job.time}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: PAPER, textDecoration: job.done ? 'line-through' : 'none' }}>{job.type}</div>
                      <div style={{ fontSize: 10, color: MUTED }}>{job.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Stacked cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* AI Agents */}
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
            <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 400, color: PAPER, marginBottom: 14 }}>AI Agents Working</div>
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

          {/* Active Campaigns */}
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
            <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 400, color: PAPER, marginBottom: 14 }}>Active Campaigns</div>
            {CAMPAIGNS.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: PAPER }}>{c.name}</span>
                <span style={{ fontFamily: FM, fontSize: 10, color: MUTED }}>${c.spent} · {c.result}</span>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
            <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 400, color: PAPER, marginBottom: 14 }}>Today&apos;s Insights</div>
            {[
              'HVAC search volume spiked 34% in Mississauga — increase bid?',
              '3 techs available in Scarborough this afternoon',
              'Customer satisfaction 4.8★ this week',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: MUTED }}>
                <span style={{ color: ACCENT, flexShrink: 0 }}>•</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Modules available in Home Services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {MODULES.map(m => (
            <div key={m.name} className="hs-card" style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: PAPER }}>{m.name}</span>
                <span style={{ fontFamily: FM, fontSize: 9, padding: '2px 8px', borderRadius: 4, background: m.status === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: m.status === 'live' ? GREEN : MUTED, textTransform: 'uppercase' }}>
                  {m.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Knowledge */}
      <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontFamily: FH, fontSize: 20, fontWeight: 400, margin: '0 0 14px' }}>AI Industry Knowledge</h2>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>Scale&apos;s Home Services AI agents are trained on:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            '2,000+ keywords specific to HVAC, plumbing, electrical, cleaning',
            'Seasonal patterns (AC in summer, furnace in fall, emergency pricing)',
            'Service area optimization (radius-based targeting)',
            'Tech dispatch efficiency rules',
            'Call tracking → booking conversion playbooks',
            'RECO/licensing compliance where applicable',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: MUTED }}>
              <span style={{ color: GREEN, flexShrink: 0 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Scale vs Workiz comparison</h2>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: FM, fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scale</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workiz Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([feature, scale, workiz], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td style={{ padding: '10px 16px', color: PAPER }}>{feature}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: scale === true ? GREEN : scale === false ? '#EF4444' : PAPER, fontWeight: 600 }}>
                    {scale === true ? '✓' : scale === false ? '✗' : String(scale)}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: workiz === true ? GREEN : workiz === false ? '#EF4444' : MUTED }}>
                    {workiz === true ? '✓' : workiz === false ? '✗' : String(workiz)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-seeded config */}
      <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 24 }}>
        <h2 style={{ fontFamily: FH, fontSize: 20, fontWeight: 400, margin: '0 0 14px' }}>Pre-seeded for Home Services tenants</h2>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>When a tenant signs up with industry=home_services, they automatically get:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            '12 campaign templates (Emergency Service, Seasonal Tune-up, etc.)',
            '6 voice agent templates configured (Job Booker, Dispatcher, etc.)',
            'Service areas input form',
            'Industry-specific CRM stages (New Inquiry → Quoted → Scheduled → In Progress → Completed → Invoiced)',
            'HVAC / Plumbing / Electrical / Cleaning sub-industry selector',
            'Tech profile setup wizard',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: MUTED }}>
              <span style={{ color: ACCENT, flexShrink: 0 }}>→</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
