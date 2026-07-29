'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import ListingCard from '@/components/search/ListingCard';
import { mapMLSToUnified } from '@/lib/data-merge';

// Onboarding wizard — 4 steps:
//   1. Complete profile (phone / VOW required if missing)
//   2. Pick preferred neighbourhoods
//   3. Set search preferences
//   4. Show live matching results (For Sale · Rent · Sold) and offer to
//      save the search as an alert.
//
// The area step is intentionally a pill-based selector — a clickable
// community-boundary map lives inside SearchMap.tsx / the boundary layer
// code, which is off-limits per the task constraint.

const AREAS = [
  'Downtown Core', 'King West', 'Liberty Village', 'Queen West', 'Yorkville',
  'The Annex', 'Midtown', 'Yonge-Eglinton', 'Waterfront Communities C1',
  'North York', 'Leaside', 'Leslieville', 'Riverside', 'Danforth', 'High Park',
  'Mimico', 'Scarborough', 'Etobicoke', 'Mississauga', 'Vaughan', 'Richmond Hill',
  'Markham',
];

const PROPERTY_TYPES = ['Condo', 'Detached', 'Semi-Detached', 'Townhouse', 'Any'] as const;
const BEDS = ['Any', '1+', '2+', '3+', '4+'] as const;
const BATHS = ['Any', '1+', '2+', '3+'] as const;
const PARKING = ['Any', '1+', '2+', '3+'] as const;
const PURPOSES = ['Buy', 'Rent', 'Invest'] as const;

const PRICE_PRESETS: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: 'Under $500K', min: null, max: 500000 },
  { label: '$500K–$750K', min: 500000, max: 750000 },
  { label: '$750K–$1M', min: 750000, max: 1000000 },
  { label: '$1M–$1.5M', min: 1000000, max: 1500000 },
  { label: '$1.5M+', min: 1500000, max: null },
];

interface Prefs {
  areas: string[];
  minPrice: number | null;
  maxPrice: number | null;
  propertyType: typeof PROPERTY_TYPES[number];
  beds: typeof BEDS[number];
  baths: typeof BATHS[number];
  minSqft: number | null;
  maxSqft: number | null;
  parking: typeof PARKING[number];
  purpose: typeof PURPOSES[number];
}

const DEFAULT_PREFS: Prefs = {
  areas: [],
  minPrice: null,
  maxPrice: null,
  propertyType: 'Any',
  beds: 'Any',
  baths: 'Any',
  minSqft: null,
  maxSqft: null,
  parking: 'Any',
  purpose: 'Buy',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { authUser, profile, loading, isAuthenticated } = useAuth();
  const { saveSearch } = useSavedSearches();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRealtor, setIsRealtor] = useState(false);
  const [vowAgreed, setVowAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [results, setResults] = useState<{
    sale: any[]; rent: any[]; sold: any[];
    saleTotal: number; rentTotal: number; soldTotal: number;
  } | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [savedAsSearch, setSavedAsSearch] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.replace('/'); return; }
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setIsRealtor(!!profile.is_realtor);
      setVowAgreed(!!profile.vow_agreed);
      if (Array.isArray(profile.preferred_areas)) {
        setPrefs((prev) => ({ ...prev, areas: profile.preferred_areas as string[] }));
      }
      if (profile.preferences) {
        const p: any = profile.preferences;
        setPrefs((prev) => ({
          ...prev,
          minPrice: p.minPrice ?? prev.minPrice,
          maxPrice: p.maxPrice ?? prev.maxPrice,
          propertyType: p.propertyType ?? prev.propertyType,
          beds: p.beds ?? prev.beds,
          baths: p.baths ?? prev.baths,
          minSqft: p.minSqft ?? prev.minSqft,
          maxSqft: p.maxSqft ?? prev.maxSqft,
          parking: p.parking ?? prev.parking,
          purpose: p.purpose ?? prev.purpose,
        }));
      }
      if (profile.phone && profile.first_name && profile.vow_agreed) {
        // Profile is already complete — skip step 1
        setStep(2);
      }
    }
  }, [profile, loading, isAuthenticated, router]);

  const persistProfile = async () => {
    if (!authUser) return;
    await supabase.from('user_profiles').upsert({
      id: authUser.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: profile?.email || authUser.email || '',
      phone: phone.trim(),
      is_realtor: isRealtor,
      vow_agreed: vowAgreed,
      vow_agreed_at: vowAgreed ? new Date().toISOString() : null,
    });
  };

  const persistPreferences = async (nextPrefs: Prefs) => {
    if (!authUser) return;
    await supabase.from('user_profiles').update({
      preferred_areas: nextPrefs.areas,
      preferences: {
        minPrice: nextPrefs.minPrice,
        maxPrice: nextPrefs.maxPrice,
        propertyType: nextPrefs.propertyType,
        beds: nextPrefs.beds,
        baths: nextPrefs.baths,
        minSqft: nextPrefs.minSqft,
        maxSqft: nextPrefs.maxSqft,
        parking: nextPrefs.parking,
        purpose: nextPrefs.purpose,
      },
    }).eq('id', authUser.id);
  };

  const handleStep1Continue = async () => {
    setError('');
    if (!firstName.trim() || !lastName.trim()) return setError('Please enter your first and last name');
    if (!phone.trim()) return setError('Please enter your phone number');
    if (!vowAgreed) return setError('You must agree to the VOW Terms of Use');
    setSaving(true);
    await persistProfile();
    setSaving(false);
    setStep(2);
  };

  const toggleArea = (name: string) => {
    setPrefs((prev) => {
      const has = prev.areas.includes(name);
      return { ...prev, areas: has ? prev.areas.filter((a) => a !== name) : [...prev.areas, name] };
    });
  };

  const fetchMatches = async (p: Prefs) => {
    setResultsLoading(true);
    const buildBody = (status: string, type?: string, lastStatus?: string): Record<string, unknown> => {
      const b: Record<string, unknown> = {
        boardId: 91,
        resultsPerPage: 6,
        city: 'Toronto',
        sortBy: status === 'U' ? 'soldDateDesc' : 'updatedOnDesc',
        status,
      };
      if (type) b.type = type;
      if (lastStatus) b.lastStatus = lastStatus;
      if (p.propertyType === 'Condo') b.class = 'condo';
      else if (p.propertyType === 'Detached') { b.class = 'residential'; b.propertyType = 'Detached'; }
      else if (p.propertyType === 'Semi-Detached') { b.class = 'residential'; b.propertyType = 'Semi-Detached'; }
      else if (p.propertyType === 'Townhouse') { b.class = 'condo'; b.propertyType = 'Att/Row/Twnhouse'; }
      const bedsNum = p.beds === 'Any' ? null : parseInt(p.beds);
      if (bedsNum) b.minBedrooms = bedsNum;
      const bathsNum = p.baths === 'Any' ? null : parseInt(p.baths);
      if (bathsNum) b.minBaths = bathsNum;
      if (p.minPrice) b.minPrice = p.minPrice;
      if (p.maxPrice) b.maxPrice = p.maxPrice;
      const parkNum = p.parking === 'Any' ? null : parseInt(p.parking);
      if (parkNum) b.minParkingSpaces = parkNum;
      if (p.minSqft) b.minSqft = p.minSqft;
      if (p.maxSqft) b.maxSqft = p.maxSqft;
      if (p.areas.length > 0) b.neighborhood = p.areas[0];
      return b;
    };

    try {
      const [sale, rent, sold] = await Promise.all([
        fetch('/api/repliers/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody('A', 'sale')) }).then((r) => r.json()).catch(() => ({ listings: [], total: 0 })),
        fetch('/api/repliers/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody('A', 'lease')) }).then((r) => r.json()).catch(() => ({ listings: [], total: 0 })),
        fetch('/api/repliers/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody('U', 'sale', 'Sld')) }).then((r) => r.json()).catch(() => ({ listings: [], total: 0 })),
      ]);
      setResults({
        sale: (sale.listings || []).slice(0, 6),
        rent: (rent.listings || []).slice(0, 6),
        sold: (sold.listings || []).slice(0, 6),
        saleTotal: sale.total || 0,
        rentTotal: rent.total || 0,
        soldTotal: sold.total || 0,
      });
    } catch {
      setResults({ sale: [], rent: [], sold: [], saleTotal: 0, rentTotal: 0, soldTotal: 0 });
    } finally {
      setResultsLoading(false);
    }
  };

  const buildSearchUrl = (tab: 'sale' | 'rent' | 'sold' = 'sale'): string => {
    const p = new URLSearchParams();
    if (tab !== 'sold') p.set('tab', tab);
    if (prefs.minPrice) p.set('priceMin', String(prefs.minPrice));
    if (prefs.maxPrice) p.set('priceMax', String(prefs.maxPrice));
    if (prefs.beds !== 'Any') p.set('beds', prefs.beds.replace('+', ''));
    if (prefs.areas[0]) p.set('neighborhood', prefs.areas[0]);
    const base = tab === 'sold' ? '/sold' : '/search';
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const saveAsAlert = async () => {
    const filters = {
      class: prefs.propertyType === 'Condo' ? 'condo' : prefs.propertyType === 'Any' ? null : 'residential',
      propertyType: prefs.propertyType === 'Any' ? null : prefs.propertyType,
      minBedrooms: prefs.beds === 'Any' ? null : parseInt(prefs.beds),
      minPrice: prefs.minPrice,
      maxPrice: prefs.maxPrice,
      neighborhood: prefs.areas[0] || null,
      areas: prefs.areas,
    };
    await saveSearch(filters);
    setSavedAsSearch(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const stepper = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`w-2 h-2 rounded-full ${n === step ? 'bg-text-primary w-8' : n < step ? 'bg-text-primary/40' : 'bg-border'} transition-all`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F6F3] pt-20 pb-16 px-5">
      <div className="max-w-3xl mx-auto">
        {stepper}

        {step === 1 && (
          <div className="max-w-lg mx-auto bg-white border border-border rounded-2xl p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Step 1 of 4</p>
            <h1 className="font-serif text-3xl font-bold text-text-primary leading-tight">Welcome to CondoWizard</h1>
            <p className="text-text-muted mt-2">Complete your profile so we can send you the right listings.</p>

            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
              </div>
              <input type="email" value={profile?.email || authUser?.email || ''} disabled placeholder="Email" className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-surface2 text-text-muted" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />

              <div className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <span className="text-sm text-text-primary">Are you a licensed realtor?</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsRealtor(false)} className={`px-3 py-1 text-xs rounded-md ${!isRealtor ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-muted'}`}>No</button>
                  <button type="button" onClick={() => setIsRealtor(true)} className={`px-3 py-1 text-xs rounded-md ${isRealtor ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-muted'}`}>Yes</button>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={vowAgreed} onChange={(e) => setVowAgreed(e.target.checked)} className="mt-1 rounded border-border text-accent-blue focus:ring-accent-blue" />
                <span className="text-xs text-text-muted leading-relaxed">
                  I agree to the <a href="/terms/vow" target="_blank" rel="noreferrer" className="text-accent-blue underline">VOW Terms of Use</a> and acknowledge a lawful broker-consumer relationship with Rare Real Estate Inc.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={saving}
              className="mt-6 w-full py-3 bg-accent-blue text-white rounded-lg font-semibold hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Continue →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Step 2 of 4</p>
            <h1 className="font-serif text-3xl font-bold text-text-primary leading-tight">Where are you looking?</h1>
            <p className="text-text-muted mt-2">Pick the neighbourhoods that interest you. You can change this later.</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {AREAS.map((a) => {
                const on = prefs.areas.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArea(a)}
                    className={`text-sm font-medium px-3.5 py-2 rounded-full border transition-all ${
                      on ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>

            {prefs.areas.length > 0 && (
              <div className="mt-5 p-3 bg-surface2 rounded-lg">
                <p className="text-xs text-text-muted">Selected: {prefs.areas.length} area{prefs.areas.length === 1 ? '' : 's'}</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-text-primary">← Back</button>
              <button
                type="button"
                onClick={async () => { await persistPreferences(prefs); setStep(3); }}
                className="bg-accent-blue text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Step 3 of 4</p>
            <h1 className="font-serif text-3xl font-bold text-text-primary leading-tight">What are you looking for?</h1>
            <p className="text-text-muted mt-2">Set your preferences. Skip anything you don&rsquo;t know.</p>

            <div className="mt-6 space-y-6">
              <Field label="Budget">
                <div className="flex gap-3">
                  <input type="number" inputMode="numeric" value={prefs.minPrice ?? ''} onChange={(e) => setPrefs((p) => ({ ...p, minPrice: e.target.value ? Number(e.target.value) : null }))} placeholder="Min $" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
                  <input type="number" inputMode="numeric" value={prefs.maxPrice ?? ''} onChange={(e) => setPrefs((p) => ({ ...p, maxPrice: e.target.value ? Number(e.target.value) : null }))} placeholder="Max $" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((r) => (
                    <button key={r.label} type="button" onClick={() => setPrefs((p) => ({ ...p, minPrice: r.min, maxPrice: r.max }))} className="text-xs px-3 py-1.5 border border-border rounded-full text-text-muted hover:bg-surface2">
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Property type">
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setPrefs((p) => ({ ...p, propertyType: t }))} className={pill(prefs.propertyType === t)}>{t}</button>
                  ))}
                </div>
              </Field>

              <Field label="Bedrooms">
                <div className="flex flex-wrap gap-2">
                  {BEDS.map((b) => (
                    <button key={b} type="button" onClick={() => setPrefs((p) => ({ ...p, beds: b }))} className={pillFixed(prefs.beds === b)}>{b}</button>
                  ))}
                </div>
              </Field>

              <Field label="Bathrooms">
                <div className="flex flex-wrap gap-2">
                  {BATHS.map((b) => (
                    <button key={b} type="button" onClick={() => setPrefs((p) => ({ ...p, baths: b }))} className={pillFixed(prefs.baths === b)}>{b}</button>
                  ))}
                </div>
              </Field>

              <Field label="Square footage">
                <div className="flex gap-3">
                  <input type="number" inputMode="numeric" value={prefs.minSqft ?? ''} onChange={(e) => setPrefs((p) => ({ ...p, minSqft: e.target.value ? Number(e.target.value) : null }))} placeholder="Min sqft" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
                  <input type="number" inputMode="numeric" value={prefs.maxSqft ?? ''} onChange={(e) => setPrefs((p) => ({ ...p, maxSqft: e.target.value ? Number(e.target.value) : null }))} placeholder="Max sqft" className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue" />
                </div>
              </Field>

              <Field label="Parking">
                <div className="flex flex-wrap gap-2">
                  {PARKING.map((p) => (
                    <button key={p} type="button" onClick={() => setPrefs((prev) => ({ ...prev, parking: p }))} className={pillFixed(prefs.parking === p)}>{p}</button>
                  ))}
                </div>
              </Field>

              <Field label="I'm looking to…">
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((p) => (
                    <button key={p} type="button" onClick={() => setPrefs((prev) => ({ ...prev, purpose: p }))} className={pill(prefs.purpose === p)}>{p}</button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-text-muted hover:text-text-primary">← Back</button>
              <button
                type="button"
                onClick={async () => { await persistPreferences(prefs); setStep(4); fetchMatches(prefs); }}
                className="bg-accent-blue text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110"
              >
                Show me results →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="text-center mb-8">
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Step 4 of 4</p>
              <h1 className="font-serif text-3xl font-bold text-text-primary leading-tight">
                {resultsLoading ? 'Finding your matches…' : results
                  ? `Found ${(results.saleTotal + results.rentTotal + results.soldTotal).toLocaleString()} properties for you`
                  : 'Your matches'}
              </h1>
              <p className="text-text-muted mt-2">Based on your preferences</p>
            </div>

            {resultsLoading && (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full" />
              </div>
            )}

            {!resultsLoading && results && (
              <div className="space-y-10">
                <ResultRow title="For Sale" count={results.saleTotal} href={buildSearchUrl('sale')} rows={results.sale} />
                <ResultRow title="Recently Sold" count={results.soldTotal} href={buildSearchUrl('sold')} rows={results.sold} isSold />
                <ResultRow title="For Rent" count={results.rentTotal} href={buildSearchUrl('rent')} rows={results.rent} isRent />

                <div className="bg-white border border-border rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Save as alert</p>
                  <p className="font-serif text-2xl font-bold text-text-primary leading-tight">Get alerts for new matches</p>
                  <p className="text-text-muted mt-2 text-sm max-w-lg mx-auto leading-relaxed">
                    We&rsquo;ll email you when new listings match your criteria. You can change or turn this off from your dashboard.
                  </p>
                  <button
                    type="button"
                    onClick={saveAsAlert}
                    disabled={savedAsSearch}
                    className="mt-5 bg-text-primary text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110 disabled:opacity-60"
                  >
                    {savedAsSearch ? 'Saved ✓' : 'Save & get alerts'}
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    href={buildSearchUrl('sale')}
                    className="inline-flex items-center gap-1 bg-accent-blue text-white text-sm font-semibold px-6 py-3 rounded-lg hover:brightness-110"
                  >
                    Explore on the map →
                  </Link>
                  <div className="mt-3">
                    <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-primary">Skip to dashboard</Link>
                  </div>
                </div>
              </div>
            )}

            {!resultsLoading && !results && (
              <div className="text-center py-16">
                <p className="text-text-muted">Something went wrong. <button className="text-accent-blue underline" onClick={() => fetchMatches(prefs)}>Try again</button></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary mb-2">{label}</p>
      {children}
    </div>
  );
}

function pill(on: boolean): string {
  return `text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
    on ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
  }`;
}

function pillFixed(on: boolean): string {
  return `text-sm font-medium w-14 py-2 rounded-lg border transition-all text-center ${
    on ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
  }`;
}

function ResultRow({ title, count, href, rows, isSold, isRent }: { title: string; count: number; href: string; rows: any[]; isSold?: boolean; isRent?: boolean; }) {
  const unified = useMemo(() => (rows || []).map((r) => {
    try { return mapMLSToUnified(r); } catch { return null; }
  }).filter(Boolean), [rows]);
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary">{title} <span className="text-text-muted font-medium">({count.toLocaleString()})</span></h2>
        <Link href={href} className="text-sm font-medium text-accent-blue hover:underline">View all →</Link>
      </div>
      {unified.length === 0 ? (
        <p className="text-sm text-text-muted">No matches yet — try broadening your preferences.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(unified as any[]).map((l) => (
            <ListingCard key={l.id} listing={l} isSoldView={!!isSold} isRentView={!!isRent} />
          ))}
        </div>
      )}
    </section>
  );
}
