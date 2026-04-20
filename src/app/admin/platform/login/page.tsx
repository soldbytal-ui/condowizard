'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#0B0D11', INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

export default function ScaleLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/platform/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      // Redirect based on user type (super admin → platform, tenant → scale)
      router.push(data.redirect || '/admin/platform');
    } catch { setError('Network error'); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, color: PAPER }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width: 400, maxWidth: '90vw', background: INK2, borderRadius: 20, border: `1px solid ${LINE}`, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', marginBottom: 6 }}>Sign in to Scale</div>
          <div style={{ fontSize: 12, color: MUTED }}>Platform admin or tenant account</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '12px 14px', borderRadius: 9, background: '#1A1D25', border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, background: '#1A1D25', border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
          {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading || !email || !password} style={{ padding: '12px 0', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FB, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/admin/platform/setup" style={{ fontSize: 11, color: MUTED, textDecoration: 'none' }}>First time? Set up super admin →</a>
        </div>
      </div>
    </div>
  );
}
