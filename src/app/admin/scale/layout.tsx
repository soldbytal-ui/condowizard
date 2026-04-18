'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getCredits, getMonthlyAllocation } from '@/lib/scale-credits';
import IndustryPickerModal, { isIndustrySelected } from '@/components/scale/IndustryPickerModal';

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

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

interface NavItem {
  href: string;
  label: string;
  match: (p: string) => boolean;
  badge?: { text: string; color: string; bg: string };
  badgeCount?: () => string;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'OPERATE',
    items: [
      { href: '/admin/scale',           label: 'Dashboard',  match: (p) => p === '/admin/scale' },
      { href: '/admin/scale/crm',       label: 'CRM',        match: (p) => p.startsWith('/admin/scale/crm'), badgeCount: () => {
        if (typeof window === 'undefined') return '';
        try { const r = window.localStorage.getItem('scale-crm-leads'); return r ? JSON.parse(r).length.toString() : ''; } catch { return ''; }
      }},
      { href: '/admin/scale/campaigns', label: 'Campaigns',  match: (p) => p.startsWith('/admin/scale/campaigns') },
      { href: '/admin/scale/agents',    label: 'Agents',     match: (p) => p.startsWith('/admin/scale/agents') },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { href: '/admin/scale/intelligence', label: 'Intelligence', match: (p) => p.startsWith('/admin/scale/intelligence'), badge: { text: 'NEW', color: '#fff', bg: GREEN } },
      { href: '/admin/scale/skills',       label: 'Skills',       match: (p) => p.startsWith('/admin/scale/skills'), badgeCount: () => '47' },
      { href: '/admin/scale/brain',        label: 'Agent Brain',  match: (p) => p.startsWith('/admin/scale/brain') },
    ],
  },
  {
    title: 'BUILD',
    items: [
      { href: '/admin/scale/studio',   label: 'Scale Studio', match: (p) => p.startsWith('/admin/scale/studio'), badge: { text: 'BETA', color: '#111', bg: '#F59E0B' } },
      { href: '/admin/scale/media',    label: 'Media',        match: (p) => p.startsWith('/admin/scale/media') },
      { href: '/admin/scale/settings', label: 'Settings',     match: (p) => p.startsWith('/admin/scale/settings') },
    ],
  },
];

// ─── Animated logo mark ───
function ScaleMark() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: PAPER, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', background: ACCENT,
        animation: 'pulse 2.6s infinite ease-in-out',
      }} />
    </div>
  );
}

// ─── Credits widget ───
function CreditsWidget() {
  const [balance, setBalance] = useState(0);
  const [total, setTotal] = useState(10000);

  useEffect(() => {
    setBalance(getCredits());
    setTotal(getMonthlyAllocation());
  }, []);

  const pct = total > 0 ? Math.round((balance / total) * 100) : 0;

  return (
    <div style={{
      margin: '12px 14px 14px', padding: '16px 14px', borderRadius: 12,
      border: `1px solid rgba(255,74,28,0.35)`,
      background: `linear-gradient(135deg, rgba(255,74,28,0.06) 0%, rgba(255,140,66,0.04) 100%)`,
    }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, marginBottom: 8 }}>
        AI Credits
      </div>
      <div style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 400, letterSpacing: '-0.025em', color: PAPER, marginBottom: 8, lineHeight: 1 }}>
        {balance.toLocaleString()} <span style={{ fontSize: 14, color: MUTED }}>/ {total.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${ACCENT}, #FF8C42)`,
          width: `${pct}%`, transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginBottom: 10, lineHeight: 1.4 }}>
        {pct}% remaining · Resets Apr 30
      </div>
      <Link href="/admin/scale/settings" style={{
        display: 'block', textAlign: 'center', padding: '8px 0',
        borderRadius: 8, background: ACCENT, color: '#fff',
        fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY,
        textDecoration: 'none',
      }}>
        Top up credits →
      </Link>
    </div>
  );
}

export default function ScaleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [showIndustry, setShowIndustry] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isIndustrySelected()) {
      setShowIndustry(true);
    }
  }, []);

  // Reset scroll to top when navigating between pages
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .scale-app a { text-decoration: none; }
        .scale-app ::selection { background: rgba(255,74,28,0.3); }
        body:has(.scale-app) { overflow: hidden; }
        .scale-nav-link { transition: all 0.12s ease; }
        .scale-nav-link:hover { background: rgba(255,255,255,0.04) !important; }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.65); opacity: 0.8; } }
        @keyframes sSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div
        className="scale-app"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw', height: '100vh', zIndex: 9999,
          background: INK, color: PAPER,
          fontFamily: FONT_BODY,
          display: 'flex', overflow: 'hidden',
        }}
      >
        {/* Noise overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999,
          opacity: 0.04, mixBlendMode: 'overlay' as const,
          backgroundImage: NOISE_BG,
        }} />

        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${LINE}`, background: INK2,
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {/* Tenant switcher */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '20px 18px 8px', cursor: 'pointer',
          }}>
            <ScaleMark />
            <div style={{ flex: 1, lineHeight: 1.1, minWidth: 0 }}>
              <span style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 400, letterSpacing: '-0.025em', color: PAPER, display: 'block' }}>CondoWizard</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>PRO · REAL ESTATE</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round"><path d="M3 5l3 3 3-3"/></svg>
          </div>

          {/* Nav sections */}
          <nav style={{ flex: 1, padding: '12px 10px 4px' }}>
            {SECTIONS.map((section) => (
              <div key={section.title} style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: MUTED, padding: '0 8px', marginBottom: 4,
                  fontWeight: 500,
                }}>
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const active = item.match(pathname);
                  const countBadge = item.badgeCount?.();
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="scale-nav-link"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                        fontSize: 13.5, fontWeight: 500,
                        color: active ? ACCENT : '#A0A4B0',
                        background: active ? ACCENT_DIM : 'transparent',
                        borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                        position: 'relative',
                      }}
                    >
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                          padding: '2px 6px', borderRadius: 4,
                          background: item.badge.bg, color: item.badge.color,
                          letterSpacing: '0.04em', lineHeight: 1,
                        }}>
                          {item.badge.text}
                        </span>
                      )}
                      {countBadge && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, fontFamily: FONT_MONO,
                          padding: '2px 7px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.08)', color: MUTED,
                        }}>
                          {countBadge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <CreditsWidget />

          <Link href="/admin" style={{
            display: 'block', textAlign: 'center', padding: '12px 14px',
            borderTop: `1px solid ${LINE}`, fontSize: 12, color: MUTED,
          }}>
            ← Back to Admin
          </Link>
        </aside>

        {/* Main content */}
        <main
          ref={mainRef}
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
            background: INK, color: PAPER,
          }}
        >
          {children}
        </main>
      </div>

      <IndustryPickerModal
        open={showIndustry}
        onClose={() => setShowIndustry(false)}
      />
    </>
  );
}
