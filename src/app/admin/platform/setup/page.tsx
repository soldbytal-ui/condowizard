'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#0B0D11', INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

export default function PlatformSetup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/admin/platform/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_setup' }),
    }).then(r => r.json()).then(data => {
      if (data.hasAdmin) router.replace('/admin/platform/login');
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, [router]);

  const handleSetup = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/platform/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push('/admin/platform');
    } catch { setError('Network error'); setLoading(false); }
  };

  if (checking) return <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: FB }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, color: PAPER }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width: 420, maxWidth: '90vw', background: INK2, borderRadius: 20, border: `1px solid ${LINE}`, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', marginBottom: 6 }}>Set up Scale</div>
          <div style={{ fontSize: 13, color: MUTED }}>Create your super admin account. This is a one-time setup.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '12px 14px', borderRadius: 9, background: '#1A1D25', border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '12px 14px', borderRadius: 9, background: '#1A1D25', border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 chars)" type="password" style={{ width: '100%', padding: '12px 14px', borderRadius: 9, background: '#1A1D25', border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
          {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}>{error}</div>}
          <button onClick={handleSetup} disabled={loading || !name || !email || password.length < 8} style={{ padding: '12px 0', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FB, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create super admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
