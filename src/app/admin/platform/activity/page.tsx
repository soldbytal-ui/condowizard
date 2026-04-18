'use client';

import { useState, useEffect } from 'react';

const INK2 = '#141414', PAPER = '#F3F0E8', ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', sans-serif", FM = "'JetBrains Mono', monospace";

export default function ActivityPage() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: FB, color: PAPER }}>
      <h1 style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Activity Feed</h1>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px' }}>Real-time activity across all tenants.</p>
      <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 32, textAlign: 'center', color: MUTED }}>
        <div style={{ fontSize: 13 }}>Activity feed loads from tenant activity tables.</div>
        <div style={{ fontSize: 11, marginTop: 8 }}>Add tenants to start seeing activity here.</div>
      </div>
    </div>
  );
}
