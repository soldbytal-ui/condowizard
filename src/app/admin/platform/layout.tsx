'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const INK = '#0B0D11', INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

const NAV = [
  { href: '/admin/platform', label: 'Overview', match: (p: string) => p === '/admin/platform' },
  { href: '/admin/platform/tenants', label: 'Tenants', match: (p: string) => p.startsWith('/admin/platform/tenants') },
  { href: '/admin/platform/services', label: 'Services', match: (p: string) => p.startsWith('/admin/platform/services') },
  { href: '/admin/platform/activity', label: 'Activity', match: (p: string) => p.startsWith('/admin/platform/activity') },
  { href: '/admin/platform/audit-log', label: 'Audit Log', match: (p: string) => p.startsWith('/admin/platform/audit-log') },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAuth = pathname.includes('/login') || pathname.includes('/setup');

  if (isAuth) return <>{children}</>;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,400&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: INK, color: PAPER, fontFamily: FB, display: 'flex', overflow: 'hidden' }}>
        <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${LINE}`, background: INK2 }}>
          <div style={{ padding: '20px 18px 16px' }}>
            <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, color: PAPER, letterSpacing: '-0.02em' }}>Scale</div>
            <div style={{ fontFamily: FM, fontSize: 9, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PLATFORM ADMIN</div>
          </div>
          <nav style={{ flex: 1, padding: '4px 10px' }}>
            {NAV.map(item => {
              const active = item.match(pathname);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'block', padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  fontSize: 13, fontWeight: 500, color: active ? ACCENT : '#A0A4B0',
                  background: active ? 'rgba(255,74,28,0.08)' : 'transparent',
                  borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                  textDecoration: 'none',
                }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/admin/scale" style={{ display: 'block', textAlign: 'center', padding: '12px', borderTop: `1px solid ${LINE}`, fontSize: 11, color: MUTED, textDecoration: 'none' }}>
            ← Scale Dashboard
          </Link>
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: INK, color: PAPER }}>
          {children}
        </main>
      </div>
    </>
  );
}
