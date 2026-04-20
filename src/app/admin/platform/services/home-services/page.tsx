'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { MapPin, MapRoute } from '../_components/ScheduleMap';

const ScheduleMap = dynamic(() => import('../_components/ScheduleMap'), { ssr: false, loading: () => <div style={{ height: 440, background: '#1a1a2e', borderRadius: 12 }} /> });

// ─── Light theme tokens ───
const NAVY = '#0F1B2D', WHITE = '#FFFFFF', LIGHT = '#F7F8FA';
const ORANGE = '#E8450C', GREEN = '#16A34A', BLUE = '#0284C7', YELLOW = '#EAB308';
const MUTED = '#6B7280', BORDER = '#E5E7EB';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ─── Mock schedule data ───
const PINS: MapPin[] = [
  { id: '1', lat: 43.6480, lng: -79.5300, label: 'AC Repair', time: '8:00 AM', status: 'completed', color: GREEN, details: '2891 Bloor St W, Etobicoke' },
  { id: '2', lat: 43.6570, lng: -79.3990, label: 'Drain Cleaning', time: '9:30 AM', status: 'completed', color: GREEN, details: '456 Spadina Ave, Toronto' },
  { id: '3', lat: 43.8600, lng: -79.3370, label: 'Panel Upgrade', time: '11:00 AM', status: 'completed', color: GREEN, details: '789 Markham Rd, Markham' },
  { id: '4', lat: 43.5890, lng: -79.6440, label: 'Furnace Check', time: '11:30 AM', status: 'completed', color: GREEN, details: '123 Hurontario St, Mississauga' },
  { id: '5', lat: 43.6540, lng: -79.3800, label: 'Leak Repair', time: '1:00 PM', status: 'in_progress', color: ORANGE, details: '234 Yonge St, Toronto' },
  { id: '6', lat: 43.6370, lng: -79.4240, label: 'AC Install', time: '2:00 PM', status: 'next', color: YELLOW, details: '567 Lakeshore Blvd, Toronto' },
  { id: '7', lat: 43.8580, lng: -79.5300, label: 'EV Charger', time: '3:30 PM', status: 'scheduled', color: '#8B8FA3', details: '890 Major Mackenzie, Vaughan' },
  { id: '8', lat: 43.6470, lng: -79.3830, label: 'Emergency Call', time: '5:00 PM', status: 'emergency', color: '#EF4444', details: '111 King St W, Toronto' },
];

const ROUTES: MapRoute[] = [
  { techId: 'mike', path: [[-79.5300,43.6480],[-79.6440,43.5890],[-79.4240,43.6370]], color: '#3B82F6' },
  { techId: 'sarah', path: [[-79.3990,43.6570],[-79.3800,43.6540]], color: '#10B981' },
  { techId: 'carlos', path: [[-79.3370,43.8600],[-79.5300,43.8580]], color: '#F59E0B' },
];

const TECHS = [
  { name: 'Mike', specialty: 'HVAC', jobs: 3, remaining: 1, color: '#3B82F6' },
  { name: 'Sarah', specialty: 'Plumbing', jobs: 2, remaining: 0, color: '#10B981' },
  { name: 'Carlos', specialty: 'Electrical', jobs: 2, remaining: 1, color: '#F59E0B' },
];

const LEADS = [
  { name: 'Jennifer R.', phone: '(647) 555-0112', city: 'Mississauga', service: 'AC Repair', status: 'New', ago: '2h ago' },
  { name: 'Robert K.', phone: '(416) 555-0287', city: 'Toronto', service: 'Furnace Install', status: 'Contacted', ago: '4h ago' },
  { name: 'Sarah L.', phone: '(905) 555-0398', city: 'Vaughan', service: 'Emergency Plumbing', status: 'Qualified', ago: '5h ago' },
  { name: 'Michael T.', phone: '(647) 555-0445', city: 'Markham', service: 'Panel Upgrade', status: 'Scheduled', ago: '7h ago' },
  { name: 'Ashley W.', phone: '(416) 555-0521', city: 'North York', service: 'Drain Cleaning', status: 'New', ago: '11h ago' },
];

const STATUS_BG: Record<string, string> = { completed: '#DCFCE7', in_progress: '#FEF3C7', next: '#FEF9C3', scheduled: '#F3F4F6', emergency: '#FEE2E2' };
const STATUS_COLOR: Record<string, string> = { completed: GREEN, in_progress: ORANGE, next: '#A16207', scheduled: MUTED, emergency: '#DC2626' };
const STATUS_LABEL: Record<string, string> = { completed: 'Completed', in_progress: 'In Progress', next: 'Next', scheduled: 'Scheduled', emergency: 'Emergency' };

const COMPARISON = [
  ['Dispatch & Scheduling', true, true],
  ['Mobile App for Techs', true, true],
  ['Invoicing + Payments', true, true],
  ['AI Voice Agent', 'Core', 'Add-on'],
  ['AI Ad Automation', true, false],
  ['AI Agent Orchestration', true, false],
  ['SEO Intelligence', true, false],
  ['AI CRM + auto-qualification', true, 'Basic'],
  ['Monthly Price', '$249', '$325'],
] as const;

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style }}>{children}</div>;
}

export default function HomeServicesPreview() {
  return (
    <div style={{ background: WHITE, minHeight: '100vh', fontFamily: FONT, color: NAVY }}>
      {/* Top header bar */}
      <div style={{ background: NAVY, color: '#fff', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>[Tenant] Scale</span>
          <nav style={{ display: 'flex', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {['Dashboard', 'CRM', 'Campaigns', 'Agents', 'Agent Brain', 'Settings'].map(n => (
              <span key={n} style={{ cursor: 'default' }}>{n}</span>
            ))}
          </nav>
        </div>
        <Link href="/admin/platform/services" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Back to Services</Link>
      </div>
      <div style={{ background: ORANGE, color: '#fff', padding: '6px 32px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center' }}>
        PREVIEW MODE — Home Services Industry
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 80px' }}>
        {/* Heading */}
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Scale Control Room</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 4px' }}>AI ad ops, CRM, dispatch, and agent orchestration for [Tenant Name]</p>
        <div style={{ fontSize: 11, color: MUTED, fontFamily: MONO, marginBottom: 24 }}>Home Services · HVAC / Plumbing / Electrical</div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'TOTAL LEADS', value: '47', color: ORANGE },
            { label: 'LEADS THIS WEEK', value: '12', sub: 'last 7 days', color: YELLOW },
            { label: 'JOBS TODAY', value: '8', sub: '4 completed, 4 remaining', color: BLUE },
            { label: 'CONVERSION RATE', value: '32%', sub: 'won ÷ total', color: GREEN },
          ].map(k => (
            <div key={k.label} style={{ background: NAVY, borderRadius: 14, padding: 20, color: '#fff' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: k.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* ★ Today's Schedule Map */}
        <Card style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>Today&apos;s Schedule</h2>
              <div style={{ fontSize: 12, color: MUTED }}>Tuesday, April 23 · AI-optimized route for your field team</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TECHS.map(t => (
                <span key={t.name} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: `${t.color}12`, color: t.color, fontWeight: 600 }}>
                  {t.name} · {t.remaining} left
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 16 }}>
            <ScheduleMap pins={PINS} routes={ROUTES} center={[-79.42, 43.70]} zoom={10} height={440} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 440, overflowY: 'auto' }}>
              {PINS.map((pin, i) => (
                <div key={pin.id} style={{ background: LIGHT, borderRadius: 10, padding: '10px 12px', borderLeft: `3px solid ${pin.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{pin.time}</span>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: STATUS_BG[pin.status] || '#F3F4F6', color: STATUS_COLOR[pin.status] || MUTED, fontWeight: 600 }}>
                      {STATUS_LABEL[pin.status] || pin.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{pin.label}</div>
                  <div style={{ fontSize: 10, color: MUTED }}>{pin.details}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ★ AI Scheduling Copilot */}
        <Card style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Scale AI — Your Scheduling Copilot</h2>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Live suggestions based on today&apos;s schedule</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { border: BLUE, icon: '💡', title: "Mike's afternoon route", body: "Switching job #6 (AC Install) with job #4 (Furnace Check) would save 22 minutes of driving time. Want me to reschedule?", btn: 'Accept' },
              { border: ORANGE, icon: '📱', title: 'Carlos running behind', body: "Carlos is 18 min behind schedule. Should I text the 3:30 PM customer a delay notice + 15% off coupon?", btn: 'Accept' },
              { border: GREEN, icon: '💰', title: 'Upsell detected', body: "3 of today's completed jobs are older furnaces (10+ years). Recommend sending Service Plan upsell SMS — 18% historical close rate.", btn: 'Send to all 3' },
            ].map(s => (
              <div key={s.title} style={{ borderLeft: `4px solid ${s.border}`, borderRadius: 10, background: LIGHT, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.icon} {s.title}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, marginBottom: 12 }}>{s.body}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ padding: '6px 14px', borderRadius: 6, background: s.border, border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'default' }}>{s.btn}</button>
                  <button style={{ padding: '6px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 11, cursor: 'default' }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { color: '#3B82F6', label: 'Google Search', sub: 'Service x area campaigns' },
            { color: GREEN, label: 'Local Services Ads', sub: 'Pay per verified lead' },
            { color: '#06B6D4', label: 'Meta Lead Gen', sub: 'Facebook + Instagram' },
            { color: '#14B8A6', label: 'Nextdoor', sub: 'Neighborhood targeting' },
            { color: '#8B5CF6', label: 'Seasonal Promo', sub: 'Retargeting display' },
            { color: ORANGE, label: 'Custom Campaign', sub: 'Free-form brief' },
          ].map(a => (
            <Card key={a.label} style={{ padding: 14, cursor: 'default' }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: a.color, marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{a.sub}</div>
            </Card>
          ))}
        </div>

        {/* Recent Leads */}
        <Card style={{ marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Recent Leads</div>
              <div style={{ fontSize: 11, color: MUTED }}>Last 10 submissions</div>
            </div>
            <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, cursor: 'default' }}>View full CRM →</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Name', 'Phone', 'City', 'Service', 'Status', 'Created'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEADS.map(l => (
                <tr key={l.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{l.name}</td>
                  <td style={{ padding: '10px 16px', fontFamily: MONO, fontSize: 12, color: MUTED }}>{l.phone}</td>
                  <td style={{ padding: '10px 16px', color: MUTED }}>{l.city}</td>
                  <td style={{ padding: '10px 16px' }}>{l.service}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600, background: l.status === 'New' ? '#DBEAFE' : l.status === 'Contacted' ? '#FEF3C7' : l.status === 'Qualified' ? '#DCFCE7' : '#F3E8FF', color: l.status === 'New' ? BLUE : l.status === 'Contacted' ? '#92400E' : l.status === 'Qualified' ? GREEN : '#7C3AED' }}>{l.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontFamily: MONO, fontSize: 11, color: MUTED }}>{l.ago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Agent Brain + Connections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>AGENT BRAIN</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: ORANGE, marginBottom: 4 }}>12 <span style={{ fontSize: 14, fontWeight: 500, color: MUTED }}>active rules</span></div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Active agents: 4. Agents use the Brain as their operating rulebook on every task.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['Always quote a range before confirming', 'Confirm service area before booking', 'Emergency pricing applies after 6pm', 'Tech skill-match required for jobs', 'Collect access info during booking'].map(r => (
                <div key={r} style={{ fontSize: 11, color: MUTED, display: 'flex', gap: 6 }}><span style={{ color: ORANGE }}>•</span> {r}</div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>CONNECTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Google Ads', true], ['Meta Ads', true], ['Google Local Services', false],
                ['QuickBooks', true], ['Twilio Voice', true], ['ElevenLabs Voice AI', true], ['Stripe Payments', true],
              ].map(([name, connected]) => (
                <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: NAVY }}>{name as string}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: connected ? GREEN : MUTED }}>{connected ? '✓ Connected' : 'Not configured'}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Scale vs Workiz */}
        <Card style={{ marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Scale vs Workiz Pro</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase' }}>Feature</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: ORANGE, textTransform: 'uppercase' }}>Scale</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase' }}>Workiz Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([f, s, w], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 16px' }}>{f}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: s === true ? GREEN : s === false ? '#EF4444' : NAVY }}>{s === true ? '✓' : s === false ? '✗' : String(s)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: w === true ? GREEN : w === false ? '#EF4444' : MUTED }}>{w === true ? '✓' : w === false ? '✗' : String(w)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
