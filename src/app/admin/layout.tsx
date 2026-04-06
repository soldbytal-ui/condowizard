'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type User = { id: string; name: string; email: string; role: 'admin' | 'agent' } | null;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => r.json())
      .then(d => { setUser(d.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent-green animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Show login page without sidebar
  if (pathname === '/admin/login' || !user) {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setUser(null);
    router.push('/admin/login');
  };

  const isAdmin = user.role === 'admin';
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '◈' },
    { href: '/admin/leads', label: 'Leads', icon: '◎' },
    ...(isAdmin ? [{ href: '/admin/agents', label: 'Agents', icon: '◉' }] : []),
    { href: '/admin/settings', label: 'Settings', icon: '⚙' },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform md:translate-x-0 md:static md:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-accent-green font-semibold text-sm">CW</span>
              <span className="text-text-primary font-light text-sm">CRM</span>
            </Link>
            <p className="text-xs text-text-muted mt-1">{user.name} · {user.role}</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-accent-green/10 text-accent-green'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface2'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-border">
            <button onClick={logout} className="w-full text-left px-3 py-2.5 text-sm text-text-muted hover:text-red-400 rounded-lg hover:bg-surface2 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-surface border-b border-border flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-accent-green font-semibold text-sm">CW CRM</span>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
