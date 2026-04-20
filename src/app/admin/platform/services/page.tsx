'use client';

import Link from 'next/link';

const INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

const INDUSTRIES = [
  { slug: 'real-estate', icon: '🏢', title: 'Real Estate', desc: 'Pre-construction, resale, MLS-aware, Toronto/GTA-focused', status: 'active', tenants: 1 },
  { slug: 'home-services', icon: '🔧', title: 'Home Services', desc: 'HVAC, plumbing, electrical, cleaning — field service operations', status: 'active', tenants: 1 },
  { slug: 'legal', icon: '⚖️', title: 'Legal', desc: 'Practice areas, intake qualification, consult booking', status: 'coming' },
  { slug: 'fitness', icon: '💪', title: 'Fitness & Wellness', desc: 'Gym memberships, class schedules, trial conversions', status: 'coming' },
  { slug: 'ecommerce', icon: '🛒', title: 'E-commerce', desc: 'Product ads, catalog management, shopping campaigns', status: 'coming' },
  { slug: 'healthcare', icon: '🏥', title: 'Healthcare', desc: 'HIPAA-compliant, practitioner booking, patient intake', status: 'coming' },
];

export default function ServicesPage() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER, maxWidth: 1100 }}>
      <style>{`.svc-card { transition: all 0.15s; } .svc-card:hover { border-color: ${ACCENT} !important; transform: translateY(-2px); }`}</style>
      <h1 style={{ fontFamily: FH, fontSize: 32, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Industry Services</h1>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
        Preview each industry&apos;s tenant experience. This is how Scale looks to customers in different verticals.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {INDUSTRIES.map(ind => (
          <Link key={ind.slug} href={`/admin/platform/services/${ind.slug}`} className="svc-card" style={{
            background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 24,
            textDecoration: 'none', color: PAPER, display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{ind.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em' }}>{ind.title}</span>
                <span style={{
                  fontFamily: FM, fontSize: 9, padding: '3px 8px', borderRadius: 6,
                  background: ind.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                  color: ind.status === 'active' ? GREEN : MUTED,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                }}>
                  {ind.status === 'active' ? `Active · ${ind.tenants} tenant${(ind.tenants || 0) > 1 ? 's' : ''}` : 'Coming soon'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{ind.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
