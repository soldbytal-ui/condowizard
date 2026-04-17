'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCredits, getMonthlyAllocation } from '@/lib/scale-credits';
import IndustryPickerModal, { isIndustrySelected } from '@/components/scale/IndustryPickerModal';

const INK   = '#0B0D11';
const INK2  = '#141720';
const INK3  = '#1A1D25';
const PAPER = '#E8E4DF';
const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

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
      { href: '/admin/scale/intelligence', label: 'Intelligence', match: (p) => p.startsWith('/admin/scale/intelligence'), badge: { text: 'NEW', color: '#fff', bg: '#10B981' } },
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

function ScaleMark() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9,
      background: `linear-gradient(135deg, ${ACCENT} 0%, #FF8C42 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: `0 4px 14px rgba(255,74,28,0.28)`,
    }}>
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5L14 4.5v3c0 4-2.7 6.7-6 7-3.3-.3-6-3-6-7v-3L8 1.5z" />
        <path d="M6 8l1.5 1.5L10.5 6.5" />
      </svg>
    </div>
  );
}

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
      <div style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 400, color: PAPER, marginBottom: 8, lineHeight: 1 }}>
        {balance.toLocaleString()} <span style={{ fontSize: 14, color: MUTED }}>/ {total.toLocaleString()}</span>
      </div>
      {/* Progress bar */}
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

  useEffect(() => {
    if (!isIndustrySelected()) {
      setShowIndustry(true);
    }
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,100..900,0..100&family=Fraunces:opsz,ital,wght,SOFT@9..144,1,100..900,0..100&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .scale-app a { text-decoration: none; }
        .scale-app ::selection { background: rgba(255,74,28,0.3); }
        body:has(.scale-app) { overflow: hidden; }
        .scale-nav-link { transition: all 0.12s ease; }
        .scale-nav-link:hover { background: rgba(255,255,255,0.04) !important; }
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
        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${LINE}`, background: INK2,
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {/* Logo */}
          <Link href="/admin/scale" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 18px 16px' }}>
            <ScaleMark />
            <div style={{ lineHeight: 1.1 }}>
              <span style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 400, color: '#fff', display: 'block' }}>Scale</span>
              <span style={{ fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.04em' }}>by CondoWizard</span>
            </div>
          </Link>

          {/* Nav sections */}
          <nav style={{ flex: 1, padding: '4px 10px' }}>
            {SECTIONS.map((section) => (
              <div key={section.title} style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9, textTransform: 'uppercase',
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
                        color: active ? '#fff' : '#A0A4B0',
                        background: active ? ACCENT_DIM : 'transparent',
                        border: `1px solid ${active ? 'rgba(255,74,28,0.25)' : 'transparent'}`,
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

          {/* Credits widget */}
          <CreditsWidget />

          {/* Back to admin */}
          <Link href="/admin" style={{
            display: 'block', textAlign: 'center', padding: '12px 14px',
            borderTop: `1px solid ${LINE}`, fontSize: 12, color: MUTED,
          }}>
            ← Back to Admin
          </Link>
        </aside>

        {/* Main content */}
        <main style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
          background: INK, color: PAPER,
        }}>
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
