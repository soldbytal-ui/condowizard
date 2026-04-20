'use client';
import Link from 'next/link';
const INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C', LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";
const FEATURES = ['Patient intake forms', 'Appointment scheduling', 'Practitioner profiles', 'Insurance verification', 'HIPAA compliance rules', 'Telehealth integration'];
export default function HealthcarePreview() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER, maxWidth: 800 }}>
      <Link href="/admin/platform/services" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← Back to Services</Link>
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏥</div>
        <h1 style={{ fontFamily: FH, fontSize: 36, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Healthcare</h1>
        <div style={{ fontFamily: FM, fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>COMING SOON</div>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 500, margin: '0 auto 28px' }}>HIPAA-compliant patient intake, practitioner booking, and medical practice marketing.</p>
        <div style={{ background: INK2, borderRadius: 16, border: `1px solid ${LINE}`, padding: 24, textAlign: 'left', marginBottom: 28 }}>
          <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, marginBottom: 14, color: PAPER }}>Planned features</div>
          {FEATURES.map((f, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: MUTED, marginBottom: 6 }}><span style={{ color: ACCENT, flexShrink: 0 }}>→</span> {f}</div>)}
        </div>
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20, fontSize: 13, color: MUTED }}>Based on tenant interest, we&apos;ll prioritize this vertical.</div>
      </div>
    </div>
  );
}
