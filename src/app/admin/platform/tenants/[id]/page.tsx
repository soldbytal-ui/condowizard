'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const INK = '#0B0D11', INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

const PLAN_LABELS: Record<string, string> = { starter: 'Starter $79/mo', pro: 'Pro $249/mo', team: 'Team $749/mo', enterprise: 'Enterprise' };
const STATUS_COLORS: Record<string, string> = { trial: '#F59E0B', active: GREEN, paused: MUTED, churned: '#EF4444' };

interface Tenant {
  id: string; businessName: string; ownerEmail: string; ownerName: string;
  industry: string; plan: string; status: string;
  creditsBalance: number; creditsMonthly: number;
  brandColor: string | null; logo: string | null;
  createdAt: string; acceptedAt: string | null; lastActiveAt: string | null;
  _count: { leads: number; activities: number; users: number };
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/platform/tenants')
      .then(r => r.json())
      .then(data => {
        const found = data.tenants?.find((t: Tenant) => t.id === id);
        setTenant(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleImpersonate = async () => {
    const res = await fetch('/api/admin/platform/impersonate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: id }),
    });
    if (res.ok) router.push('/admin/scale');
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: MUTED, fontFamily: FB }}>Loading...</div>;
  if (!tenant) return <div style={{ padding: 60, textAlign: 'center', color: MUTED, fontFamily: FB }}>Tenant not found. <Link href="/admin/platform" style={{ color: ACCENT }}>Back</Link></div>;

  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER, maxWidth: 1000 }}>
      <Link href="/admin/platform" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', marginBottom: 16, display: 'block' }}>← Back to tenants</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>{tenant.businessName}</h1>
          <div style={{ fontSize: 13, color: MUTED }}>{tenant.ownerName} · {tenant.ownerEmail}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleImpersonate} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(139,63,191,0.12)', border: '1px solid rgba(139,63,191,0.3)', color: '#B670E8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>
            View as tenant
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Plan</div>
          <div style={{ fontFamily: FH, fontSize: 22, color: PAPER, letterSpacing: '-0.02em' }}>{tenant.plan}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{PLAN_LABELS[tenant.plan] || tenant.plan}</div>
        </div>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[tenant.status] || MUTED }} />
            <span style={{ fontFamily: FH, fontSize: 22, color: STATUS_COLORS[tenant.status] || PAPER, textTransform: 'capitalize' }}>{tenant.status}</span>
          </div>
        </div>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Credits</div>
          <div style={{ fontFamily: FH, fontSize: 22, color: PAPER }}>{tenant.creditsBalance.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>of {tenant.creditsMonthly.toLocaleString()} monthly</div>
        </div>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 18 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Leads</div>
          <div style={{ fontFamily: FH, fontSize: 22, color: PAPER }}>{tenant._count.leads}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{tenant._count.activities} activities</div>
        </div>
      </div>

      {/* Details */}
      <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 22 }}>
        <h3 style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, margin: '0 0 16px', color: PAPER }}>Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          {[
            ['Industry', tenant.industry.replace('_', ' ')],
            ['Created', new Date(tenant.createdAt).toLocaleDateString()],
            ['Accepted', tenant.acceptedAt ? new Date(tenant.acceptedAt).toLocaleDateString() : 'Not yet'],
            ['Last Active', tenant.lastActiveAt ? new Date(tenant.lastActiveAt).toLocaleDateString() : '—'],
            ['Team Members', String(tenant._count.users)],
            ['Brand Color', tenant.brandColor || '#FF4A1C'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: MUTED }}>{label}</span>
              <span style={{ color: PAPER, fontFamily: FM, fontSize: 12 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
