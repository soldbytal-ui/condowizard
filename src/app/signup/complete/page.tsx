'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const INK = '#0B0D11', INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' };

interface InviteData {
  tenant: { id: string; businessName: string; industry: string; plan: string };
  email: string;
  ownerName: string;
}

export default function SignupCompletePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: FB }}>Loading...</div>}>
      <SignupCompleteInner />
    </Suspense>
  );
}

function SignupCompleteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';

  const [step, setStep] = useState(1);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Step 2
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);

  // Step 3
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError('No invitation token provided.'); setLoading(false); return; }
    fetch(`/api/admin/platform/invite?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInvite(data);
          setBusinessName(data.tenant.businessName);
          setIndustry(data.tenant.industry);
          setLoading(false);
        } else {
          setError(data.error || 'Invalid invitation.');
          setLoading(false);
        }
      })
      .catch(() => { setError('Failed to validate invitation.'); setLoading(false); });
  }, [token]);

  const handleComplete = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true); setError('');

    const res = await fetch('/api/admin/platform/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, businessName, industry }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    router.push('/admin/scale');
  };

  return (
    <div style={{ minHeight: '100vh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, color: PAPER }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ width: 480, maxWidth: '92vw', background: INK2, borderRadius: 20, border: `1px solid ${LINE}`, padding: 40 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: MUTED }}>Validating invitation...</div>
        ) : error && !invite ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>⚠</div>
            <div style={{ fontSize: 16, color: '#EF4444', marginBottom: 8 }}>{error}</div>
            <div style={{ fontSize: 13, color: MUTED }}>Contact the person who invited you for a new link.</div>
          </div>
        ) : invite && step === 1 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', marginBottom: 8 }}>
              Welcome to Scale, {invite.ownerName}!
            </div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>{invite.tenant.businessName}</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 24 }}>
              {invite.tenant.plan} plan · {invite.tenant.industry.replace('_', ' ')}
            </div>
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '14px 0', borderRadius: 10, background: ACCENT, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>
              Get Started →
            </button>
          </div>
        ) : invite && step === 2 ? (
          <div>
            <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, marginBottom: 20, textAlign: 'center' }}>Set your password</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Email</div>
                <div style={{ fontFamily: FM, fontSize: 13, color: PAPER }}>{invite.email}</div>
              </div>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 chars)" type="password" style={inp} />
              <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" type="password" style={inp} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ accentColor: ACCENT, marginTop: 3 }} />
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>I agree to the terms of service and privacy policy.</span>
              </label>
              {error && <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', borderRadius: 9, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 13, cursor: 'pointer', fontFamily: FB }}>Back</button>
                <button onClick={() => { if (password.length < 8) { setError('Min 8 characters'); return; } if (password !== confirmPassword) { setError('Passwords do not match'); return; } if (!terms) { setError('Accept terms to continue'); return; } setError(''); setStep(3); }} style={{ flex: 2, padding: '12px 0', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : invite && step === 3 ? (
          <div>
            <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, marginBottom: 20, textAlign: 'center' }}>Confirm your details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>Business name</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {[['real_estate','Real Estate'],['home_services','Home Services'],['legal','Legal'],['fitness','Fitness / Wellness'],['ecommerce','E-commerce'],['healthcare','Healthcare']].map(([v,l]) => <option key={v} value={v} style={{ background: INK3 }}>{l}</option>)}
                </select>
              </div>
              {error && <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>}
              <button onClick={handleComplete} disabled={submitting} style={{ width: '100%', padding: '14px 0', borderRadius: 10, background: GREEN, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FB, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Creating account...' : 'Create account & enter Scale'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
