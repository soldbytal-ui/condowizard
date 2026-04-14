'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BG = '#0B0D11';
const BORDER = 'rgba(255,255,255,0.06)';
const ACCENT = '#0066FF';
const ACCENT_SOFT = 'rgba(0,102,255,0.10)';
const ACCENT_BORDER = 'rgba(0,102,255,0.35)';
const TEXT_PRIMARY = '#E2E4E9';
const TEXT_MUTED = '#8B8FA3';
const FONT = "'DM Sans', -apple-system, sans-serif";

const TABS = [
  { href: '/admin/scale', label: 'Campaigns', match: (p: string) => p === '/admin/scale' },
  { href: '/admin/scale/brain', label: 'Agent Brain', match: (p: string) => p.startsWith('/admin/scale/brain') },
  { href: '/admin/scale/settings', label: 'Settings', match: (p: string) => p.startsWith('/admin/scale/settings') },
];

function ScaleMark() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5L14 4.5v3c0 4-2.7 6.7-6 7-3.3-.3-6-3-6-7v-3L8 1.5z" />
        <path d="M6 8l1.5 1.5L10.5 6.5" />
      </svg>
    </div>
  );
}

export default function ScaleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div className="scale-shell" style={{ minHeight: '100vh', background: BG, color: TEXT_PRIMARY, fontFamily: FONT }}>
      <style>{`
        .scale-shell { margin: -16px; }
        @media (min-width: 768px) { .scale-shell { margin: -32px; } }
        .scale-root a { text-decoration: none; }
        .scale-root ::selection { background: rgba(0,102,255,0.3); }
      `}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="scale-root">
        <div
          style={{
            borderBottom: `1px solid ${BORDER}`,
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            height: 56,
            gap: 28,
            background: BG,
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <Link href="/admin/scale" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScaleMark />
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>Scale</span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 7,
                    fontSize: 13,
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
              fontSize: 12,
              color: TEXT_MUTED,
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${BORDER}`,
            }}
          >
            ← Admin
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
