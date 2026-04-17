'use client';

import { useState } from 'react';

const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const INK = '#0B0D11';
const INK2 = '#141720';
const INK3 = '#1A1D25';
const PAPER = '#E8E4DF';
const LINE = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const STORAGE_KEY = 'scale-industry-selected';

interface Industry {
  id: string;
  label: string;
  description: string;
}

const INDUSTRIES: Industry[] = [
  { id: 'real_estate',     label: 'Real Estate',       description: 'Pre-construction, resale, area pages, MLS-aware' },
  { id: 'home_services',   label: 'Home Services',     description: 'Multi-city, service × area matrix, Local Services Ads' },
  { id: 'legal',           label: 'Legal',             description: 'Practice areas, compliance-heavy, geo-targeted' },
  { id: 'fitness',         label: 'Fitness / Wellness', description: 'Membership funnels, class schedules, community' },
  { id: 'ecommerce',       label: 'E-commerce',        description: 'Product catalogs, shopping ads, retargeting' },
  { id: 'healthcare',      label: 'Healthcare',        description: 'HIPAA-compliant, booking-first, practitioner pages' },
];

// Real estate specific config
export const REAL_ESTATE_CONFIG = {
  crmStages: ['New', 'Contacted', 'Showing', 'Offer', 'Under Contract', 'Closed', 'Lost'],
  campaignTypes: ['Pre-construction Condos', 'Area Pages', 'Community Listings', 'Staging', 'Short-term Rentals', 'Custom'],
  brainRules: [
    'RECO compliance: all ads must include brokerage name and agent registration.',
    'Brokerage disclosure: "Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage"',
    'No guaranteed ROI or appreciation claims — Ontario advertising regulation.',
    'Toronto market data: median price ~$612K, avg rental yield ~5.8%, 340+ active pre-construction projects.',
    'CASL compliance for all email marketing — express consent required.',
  ],
};

export function isIndustrySelected(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

export function getSelectedIndustry(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (industry: string) => void;
}

export default function IndustryPickerModal({ open, onClose, onSave }: Props) {
  const [selected, setSelected] = useState('real_estate');

  if (!open) return null;

  const selectedLabel = INDUSTRIES.find((i) => i.id === selected)?.label ?? selected;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, selected);

      // If real estate, store industry-specific brain rules
      if (selected === 'real_estate') {
        try {
          const brainKey = 'scale-agent-brain';
          const raw = window.localStorage.getItem(brainKey);
          const cats = raw ? JSON.parse(raw) : [];
          const hasIndustry = cats.some((c: { id: string }) => c.id === 'industry');
          if (!hasIndustry) {
            cats.push({
              id: 'industry',
              label: 'Industry — Real Estate',
              entries: REAL_ESTATE_CONFIG.brainRules.map((text, i) => ({
                id: `ind-${i}`,
                text,
                active: true,
              })),
            });
            window.localStorage.setItem(brainKey, JSON.stringify(cats));
          }
        } catch { /* ignore */ }
      }
    }
    onSave?.(selected);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_BODY,
    }}>
      <div style={{
        background: INK, border: `1px solid ${LINE}`, borderRadius: 20,
        width: 640, maxWidth: '95vw', padding: '40px 36px',
        color: PAPER, position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: MUTED,
          fontSize: 20, cursor: 'pointer', padding: 8,
        }}>×</button>

        <h2 style={{
          fontFamily: FONT_HEADING, fontSize: 30, fontWeight: 400,
          margin: '0 0 8px', lineHeight: 1.2, color: PAPER,
        }}>
          What are you <em style={{ fontStyle: 'italic', color: ACCENT }}>selling today?</em>
        </h2>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
          Scale tailors campaign generation, CRM stages, agent roster, and the Agent Brain based on your industry.
          Pick yours to continue — you can run campaigns across multiple industries on the Team plan.
        </p>

        {/* Industry grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          {INDUSTRIES.map((ind) => {
            const isActive = selected === ind.id;
            return (
              <button key={ind.id} onClick={() => setSelected(ind.id)} style={{
                background: isActive ? ACCENT_DIM : INK3,
                border: `1px solid ${isActive ? ACCENT : LINE}`,
                borderRadius: 12, padding: '18px 16px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
                color: PAPER,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{ind.label}</div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{ind.description}</div>
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} style={{
          width: '100%', padding: '14px 0',
          background: ACCENT, border: 'none', borderRadius: 11,
          color: '#fff', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', fontFamily: FONT_BODY,
        }}>
          Continue with {selectedLabel} →
        </button>
      </div>
    </div>
  );
}
