'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_BG = '#F5F5F7';
const NAV_BG = '#111318';
const BORDER = 'rgba(255,255,255,0.06)';
const ACCENT_SOFT = 'rgba(0,102,255,0.18)';
const ACCENT_BORDER = 'rgba(0,102,255,0.5)';
const TEXT_PRIMARY = '#E2E4E9';
const TEXT_MUTED = '#8B8FA3';
const FONT = "'DM Sans', -apple-system, sans-serif";

const TABS = [
  { href: '/admin/scale', label: 'Dashboard', match: (p: string) => p === '/admin/scale' },
  { href: '/admin/scale/campaigns', label: 'Campaigns', match: (p: string) => p.startsWith('/admin/scale/campaigns') },
  { href: '/admin/scale/agents', label: 'Agents', match: (p: string) => p.startsWith('/admin/scale/agents') },
  { href: '/admin/scale/crm', label: 'CRM', match: (p: string) => p.startsWith('/admin/scale/crm') },
  { href: '/admin/scale/brain', label: 'Agent Brain', match: (p: string) => p.startsWith('/admin/scale/brain') },
  { href: '/admin/scale/settings', label: 'Settings', match: (p: string) => p.startsWith('/admin/scale/settings') },
];

function ScaleMark() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(0,102,255,0.28)',
      }}
    >
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5L14 4.5v3c0 4-2.7 6.7-6 7-3.3-.3-6-3-6-7v-3L8 1.5z" />
        <path d="M6 8l1.5 1.5L10.5 6.5" />
      </svg>
    </div>
  );
}

export default function ScaleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .scale-app a { text-decoration: none; }
        .scale-app ::selection { background: rgba(0,102,255,0.3); }
        body:has(.scale-app) { overflow: hidden; }
      `}</style>

      <div
        className="scale-app"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          background: PAGE_BG,
          color: '#111318',
          fontFamily: FONT,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Scale top bar */}
        <header
          style={{
            flexShrink: 0,
            borderBottom: `1px solid rgba(0,0,0,0.06)`,
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            height: 64,
            gap: 28,
            background: NAV_BG,
            color: TEXT_PRIMARY,
          }}
        >
          <Link href="/admin/scale" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScaleMark />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>Scale</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500, letterSpacing: '0.04em' }}>
                by CondoWizard
              </span>
            </div>
          </Link>

          <div style={{ flex: 1 }} />

          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 500,
                    color: active ? '#fff' : TEXT_MUTED,
                    background: active ? ACCENT_SOFT : 'transparent',
                    border: `1px solid ${active ? ACCENT_BORDER : 'transparent'}`,
                    transition: 'all 0.12s ease',
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/admin"
            style={{
              fontSize: 14,
              color: TEXT_MUTED,
              padding: '9px 16px',
              borderRadius: 9,
              border: `1px solid ${BORDER}`,
              marginLeft: 10,
            }}
          >
            ← Back to Admin
          </Link>
        </header>

        {/* Scrollable content area */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: PAGE_BG,
            color: '#111318',
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
