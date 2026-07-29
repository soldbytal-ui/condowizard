'use client';

import { useState } from 'react';

const AREAS = [
  'Downtown Core', 'King West', 'Liberty Village', 'Yorkville',
  'The Annex', 'Yonge & Eglinton', 'Waterfront', 'Leslieville',
  'North York', 'Etobicoke', 'Mississauga', 'Vaughan',
];

const TYPES = ['Condo', 'House', 'Townhouse'];

const RANGES = [
  { label: 'Under $600K', min: 0, max: 600000 },
  { label: '$600K – $900K', min: 600000, max: 900000 },
  { label: '$900K – $1.5M', min: 900000, max: 1500000 },
  { label: '$1.5M – $2.5M', min: 1500000, max: 2500000 },
  { label: '$2.5M+', min: 2500000, max: null },
];

export default function AlertsSignup() {
  const [intent, setIntent] = useState<'sale' | 'rent'>('sale');
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [rangeIdx, setRangeIdx] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  function toggle<T>(set: Set<T>, val: T, apply: (n: Set<T>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    apply(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setState('idle');
    setErrMsg('');
    try {
      const range = rangeIdx != null ? RANGES[rangeIdx] : null;
      const summary = [
        `Intent: ${intent === 'sale' ? 'Buy' : 'Rent'}`,
        areas.size ? `Areas: ${Array.from(areas).join(', ')}` : null,
        types.size ? `Types: ${Array.from(types).join(', ')}` : null,
        range ? `Range: ${range.label}` : null,
      ].filter(Boolean).join(' · ');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alert Signup',
          email,
          source: 'homepage_alerts',
          message: summary,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState('ok');
      setEmail('');
      setAreas(new Set());
      setTypes(new Set());
      setRangeIdx(null);
    } catch (err: any) {
      setState('err');
      setErrMsg('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'ok') {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        <p className="font-serif text-2xl text-text-primary">You're on the list.</p>
        <p className="text-sm text-text-muted mt-2">You'll receive matching Toronto listings by email — usually within the day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap gap-6 md:gap-10">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">I'm looking to</p>
          <div className="inline-flex bg-surface2 rounded-full p-1">
            {(['sale', 'rent'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setIntent(v)}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                  intent === v ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted'
                }`}
              >
                {v === 'sale' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[220px]">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Property type</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(types, t, setTypes)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  types.has(t)
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Preferred areas</p>
        <div className="flex flex-wrap gap-1.5">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggle(areas, a, setAreas)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                areas.has(a)
                  ? 'bg-text-primary text-white border-text-primary'
                  : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Price range</p>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRangeIdx(rangeIdx === i ? null : i)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                rangeIdx === i
                  ? 'bg-text-primary text-white border-text-primary'
                  : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-white text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent-blue text-white font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Set up alert'}
        </button>
      </div>

      {state === 'err' && <p className="mt-2 text-xs text-red-500">{errMsg}</p>}
      <p className="mt-3 text-[11px] text-text-muted">
        Alerts are managed by CondoWizard.ca. Unsubscribe anytime from any email.
      </p>
    </form>
  );
}
