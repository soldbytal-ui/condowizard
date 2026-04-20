'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const INK = '#0B0D11', INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C', ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

interface Tenant {
  id: string; businessName: string; ownerEmail: string; ownerName: string;
  industry: string; plan: string; status: string; creditsBalance: number; creditsMonthly: number;
  lastActiveAt: string | null; createdAt: string;
  _count?: { leads?: number; activities?: number; users?: number };
}

const PLAN_MRR: Record<string, number> = { starter: 79, pro: 249, team: 749, enterprise: 0 };
const STATUS_COLORS: Record<string, string> = { trial: '#F59E0B', active: GREEN, paused: '#8B8FA3', churned: '#EF4444' };

export default function PlatformDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/platform/tenants')
      .then(r => { if (r.status === 401) { router.push('/admin/platform/login'); return null; } return r.json(); })
      .then(data => { if (data?.tenants) setTenants(data.tenants); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/platform/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.push('/admin/platform/login');
  };

  const handleImpersonate = async (tenantId: string) => {
    const res = await fetch('/api/admin/platform/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId }) });
    if (res.ok) router.push('/admin/scale');
  };

  const activeTenants = tenants.filter(t => t.status === 'active' || t.status === 'trial');
  const mrr = tenants.filter(t => t.status === 'active').reduce((s, t) => s + (PLAN_MRR[t.plan] || 0), 0);
  const totalCreditsUsed = tenants.reduce((s, t) => s + (t.creditsMonthly - t.creditsBalance), 0);
  const totalLeads = tenants.reduce((s, t) => s + (t._count?.leads ?? 0), 0);

  const filtered = tenants.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.businessName.toLowerCase().includes(q) || t.ownerEmail.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .pt-row { transition: background 0.1s; }
        .pt-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      <div style={{ animation: 'fadeIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FH, fontSize: 32, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Platform Admin</h1>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Scale by Tal Shelef · Super Admin Console</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setAddModal(true)} style={{ padding: '10px 20px', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>+ Add Tenant</button>
            <button onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: 9, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 12, cursor: 'pointer', fontFamily: FB }}>Logout</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Active Tenants', value: String(activeTenants.length), delta: `${tenants.length} total` },
            { label: 'Monthly Recurring Revenue', value: `$${mrr.toLocaleString()}`, delta: 'CAD' },
            { label: 'Credits Used (all)', value: totalCreditsUsed.toLocaleString(), delta: 'this month' },
            { label: 'Total Leads', value: totalLeads.toLocaleString(), delta: 'across tenants' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20 }}>
              <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{kpi.label}</div>
              <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: PAPER, marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{kpi.delta}</div>
            </div>
          ))}
        </div>

        {/* Tenants table */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..." style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: INK2, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none', maxWidth: 320 }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 9, background: INK2, border: `1px solid ${LINE}`, color: PAPER, fontSize: 12, fontFamily: FB, cursor: 'pointer' }}>
              {['all', 'trial', 'active', 'paused', 'churned'].map(s => <option key={s} value={s} style={{ background: INK2 }}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Loading tenants...</div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>{error}</div>
          ) : (
            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                    {['Business', 'Owner', 'Industry', 'Plan', 'Status', 'Credits', 'Leads', 'Last Active', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: FM, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: MUTED }}>No tenants found</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className="pt-row" style={{ borderBottom: `1px solid ${LINE}`, cursor: 'pointer' }} onClick={() => router.push(`/admin/platform/tenants/${t.id}`)}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: PAPER }}>{t.businessName}</td>
                      <td style={{ padding: '12px 14px', color: MUTED }}>{t.ownerName}<br /><span style={{ fontFamily: FM, fontSize: 10 }}>{t.ownerEmail}</span></td>
                      <td style={{ padding: '12px 14px', fontFamily: FM, fontSize: 11, color: MUTED, textTransform: 'capitalize' }}>{t.industry.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 14px', fontFamily: FM, fontSize: 11, color: PAPER, textTransform: 'capitalize' }}>{t.plan}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: FM, color: STATUS_COLORS[t.status] || MUTED, textTransform: 'capitalize' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[t.status] || MUTED }} />{t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: FM, fontSize: 11, color: PAPER }}>{t.creditsBalance.toLocaleString()} / {t.creditsMonthly.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', fontFamily: FM, fontSize: 11, color: MUTED }}>{t._count?.leads ?? 0}</td>
                      <td style={{ padding: '12px 14px', fontFamily: FM, fontSize: 10, color: MUTED }}>{t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleImpersonate(t.id)} style={{ padding: '5px 10px', borderRadius: 6, background: ACCENT_DIM, border: `1px solid rgba(255,74,28,0.2)`, color: ACCENT, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: FM }}>
                          View as tenant
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addModal && <AddTenantModal onClose={() => setAddModal(false)} onCreated={(t) => { setTenants(prev => [t, ...prev]); setAddModal(false); }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Add Tenant Modal
// ═══════════════════════════════════════════════════════════════
function AddTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Tenant) => void }) {
  const [biz, setBiz] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('real_estate');
  const [plan, setPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ inviteLink: string; emailSent: boolean } | null>(null);

  const handleCreate = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/admin/platform/tenants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: biz, ownerEmail: email, ownerName: name, industry, plan }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setResult({ inviteLink: data.inviteLink, emailSent: data.emailSent });
    onCreated(data.tenant);
    setLoading(false);
  };

  const [copied, setCopied] = useState(false);
  const copyLink = () => { if (result) { navigator.clipboard.writeText(result.inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB }}>
      <div onClick={e => e.stopPropagation()} style={{ background: INK2, border: `1px solid ${LINE}`, borderRadius: 20, width: 500, maxWidth: '95vw', padding: 32, color: PAPER }}>
        <h2 style={{ fontFamily: FH, fontSize: 22, fontWeight: 400, margin: '0 0 20px' }}>Add new tenant</h2>

        {result ? (
          <div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: GREEN, fontWeight: 600, marginBottom: 6 }}>Tenant created!</div>
              <div style={{ fontSize: 12, color: MUTED }}>{result.emailSent ? 'Invitation email sent.' : 'Email not sent — copy the link below.'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <code style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: INK3, border: `1px solid ${LINE}`, fontFamily: FM, fontSize: 10, color: PAPER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.inviteLink}</code>
              <button onClick={copyLink} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${LINE}`, color: copied ? GREEN : MUTED, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>Done</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input value={biz} onChange={e => setBiz(e.target.value)} placeholder="Business name" style={{ width: '100%', padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Owner name" style={{ padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Owner email" type="email" style={{ padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, cursor: 'pointer' }}>
                {[['real_estate','Real Estate'],['home_services','Home Services'],['legal','Legal'],['fitness','Fitness / Wellness'],['ecommerce','E-commerce'],['healthcare','Healthcare']].map(([v,l]) => <option key={v} value={v} style={{ background: INK3 }}>{l}</option>)}
              </select>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{ padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, cursor: 'pointer' }}>
                {[['starter','Starter $79/mo'],['pro','Pro $249/mo'],['team','Team $749/mo'],['enterprise','Enterprise']].map(([v,l]) => <option key={v} value={v} style={{ background: INK3 }}>{l}</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 12, cursor: 'pointer', fontFamily: FB }}>Cancel</button>
              <button onClick={handleCreate} disabled={loading || !biz || !email || !name} style={{ padding: '10px 22px', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating...' : 'Create & send invite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
