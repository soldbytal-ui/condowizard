'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UnifiedListing, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';

const ListingMiniMap = dynamic(() => import('./ListingMiniMap'), { ssr: false });

interface HistoryEntry { mlsNumber?: string; listDate?: string; listPrice?: number; soldDate?: string; soldPrice?: number; status?: string; lastStatus?: string; }
interface Room { name: string; level: string; length: string; width: string; features: string; }
interface PropertyDetails {
  propertyType: string | null; style: string | null; yearBuilt: string | null; sqft: string | null;
  lotWidth: number | null; lotDepth: number | null; lotAcres: number | null;
  parking: number | null; garage: number | null; garageType: string | null; driveway: string | null;
  basement1: string | null; basement2: string | null; heating: string | null; cooling: string | null;
  fireplace: number | null; exterior1: string | null; exterior2: string | null; roof: string | null;
  waterSource: string | null; sewer: string | null; taxes: number | null; taxYear: string | null;
  maintenanceFee: string | null; extras: string | null; den: string | null; pool: string | null;
  waterfront: string | null; zoning: string | null; virtualTour: string | null; description: string | null;
  communityCode: string | null; postalCode: string | null;
}

interface Props { listing: UnifiedListing; propertyDetails: PropertyDetails; rooms: Room[]; history: HistoryEntry[]; }

function DetailRow({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null;
  return <div className="flex justify-between py-2 border-b border-border text-sm"><span className="text-text-muted">{label}</span><span className="font-medium text-text-primary text-right">{value}</span></div>;
}

// ===== MORTGAGE CALCULATOR =====
function MortgageCalculator({ price, maintenanceFee, annualTax }: { price: number; maintenanceFee: number; annualTax: number }) {
  const [dp, setDp] = useState(20);
  const [rate, setRate] = useState(4.5);
  const [amort, setAmort] = useState(25);
  const [freq, setFreq] = useState<'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [firstTime, setFirstTime] = useState(false);

  const principal = price * (1 - dp / 100);
  const mr = rate / 100 / 12;
  const np = amort * 12;
  const monthlyMortgage = mr > 0 ? (principal * mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1) : principal / np;
  const maint = maintenanceFee || 0;
  const tax = (annualTax || price * 0.0065) / 12;
  const totalMonthly = monthlyMortgage + maint + tax;
  const totalInterest = monthlyMortgage * np - principal;

  // Payment by frequency
  const payment = freq === 'monthly' ? monthlyMortgage : freq === 'biweekly' ? monthlyMortgage * 12 / 26 : monthlyMortgage * 12 / 52;

  // Stress test (rate + 2%)
  const stressMr = (rate + 2) / 100 / 12;
  const stressPayment = stressMr > 0 ? (principal * stressMr * Math.pow(1 + stressMr, np)) / (Math.pow(1 + stressMr, np) - 1) : principal / np;

  // Land transfer tax (Ontario + Toronto if applicable)
  const ontLtt = price <= 55000 ? price * 0.005 : price <= 250000 ? 275 + (price - 55000) * 0.01 : price <= 400000 ? 2225 + (price - 250000) * 0.015 : price <= 2000000 ? 4475 + (price - 400000) * 0.02 : 36475 + (price - 2000000) * 0.025;
  const torontoLtt = price <= 55000 ? price * 0.005 : price <= 400000 ? 275 + (price - 55000) * 0.01 : price <= 2000000 ? 3725 + (price - 400000) * 0.02 : 35725 + (price - 2000000) * 0.025;
  const ftbRebateOnt = firstTime ? Math.min(ontLtt, 4000) : 0;
  const ftbRebateTor = firstTime ? Math.min(torontoLtt, 4475) : 0;

  return (
    <div className="space-y-5">
      <div>
        <label className="flex justify-between text-sm"><span>Down Payment</span><span className="font-medium">{dp}% (${Math.round(price * dp / 100).toLocaleString()})</span></label>
        <input type="range" min={5} max={50} value={dp} onChange={(e) => setDp(parseInt(e.target.value))} className="w-full mt-1 accent-accent-blue" />
      </div>
      <div>
        <label className="flex justify-between text-sm"><span>Interest Rate</span><span className="font-medium">{rate}%</span></label>
        <input type="range" min={2} max={10} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full mt-1 accent-accent-blue" />
      </div>
      <div>
        <label className="flex justify-between text-sm"><span>Amortization</span><span className="font-medium">{amort} years</span></label>
        <div className="flex gap-2 mt-1">
          {[15, 20, 25, 30].map((y) => (
            <button key={y} onClick={() => setAmort(y)} className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${amort === y ? 'bg-accent-blue text-white border-accent-blue' : 'border-border text-text-muted'}`}>{y}yr</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-text-muted">Payment Frequency</label>
        <div className="flex gap-2 mt-1">
          {([['monthly', 'Monthly'], ['biweekly', 'Bi-weekly'], ['weekly', 'Weekly']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFreq(k)} className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${freq === k ? 'bg-accent-blue text-white border-accent-blue' : 'border-border text-text-muted'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-text-muted">Mortgage ({freq})</span><span className="font-bold text-lg text-accent-blue">${Math.round(payment).toLocaleString()}</span></div>
        <div className="flex justify-between text-sm"><span className="text-text-muted">+ Maintenance</span><span>${Math.round(maint).toLocaleString()}/mo</span></div>
        <div className="flex justify-between text-sm"><span className="text-text-muted">+ Property Tax</span><span>${Math.round(tax).toLocaleString()}/mo</span></div>
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-border"><span>Total Monthly Cost</span><span className="text-accent-blue">${Math.round(totalMonthly).toLocaleString()}/mo</span></div>
        <div className="flex justify-between text-xs text-text-muted"><span>Total Interest ({amort} yrs)</span><span>${Math.round(totalInterest).toLocaleString()}</span></div>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg">
        <p className="text-xs font-medium text-amber-800">OSFI Stress Test</p>
        <p className="text-xs text-amber-700 mt-1">At {(rate + 2).toFixed(1)}% stress rate: <strong>${Math.round(stressPayment).toLocaleString()}/mo</strong></p>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Land Transfer Tax</h4>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} className="rounded" />
          First-time home buyer
        </label>
        <DetailRow label="Ontario LTT" value={`$${Math.round(ontLtt - ftbRebateOnt).toLocaleString()}${ftbRebateOnt > 0 ? ` (rebate -$${ftbRebateOnt.toLocaleString()})` : ''}`} />
        <DetailRow label="Toronto Municipal LTT" value={`$${Math.round(torontoLtt - ftbRebateTor).toLocaleString()}${ftbRebateTor > 0 ? ` (rebate -$${ftbRebateTor.toLocaleString()})` : ''}`} />
        <div className="flex justify-between text-sm font-bold pt-1"><span>Total Closing Costs (est.)</span><span>${Math.round(ontLtt + torontoLtt - ftbRebateOnt - ftbRebateTor + 2500).toLocaleString()}</span></div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ListingDetail({ listing, propertyDetails: pd, rooms, history }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImage, setActiveImage] = useState(0);
  const [estimate, setEstimate] = useState<any>(null);
  const [comps, setComps] = useState<UnifiedListing[] | null>(null);
  const [nearby, setNearby] = useState<UnifiedListing[] | null>(null);
  const [rentalComps, setRentalComps] = useState<UnifiedListing[] | null>(null);
  const { savedListingIds, toggleSaveListing, requireAuth } = useAuth();

  const images = listing?.images || [];
  const buildingColor = BUILDING_TYPE_COLORS[listing.buildingType] || '#6B7280';
  const buildingLabel = BUILDING_TYPE_LABELS[listing.buildingType] || listing.buildingType;

  // Lazy-load data per tab
  const fetchTabData = useCallback(async (tab: string) => {
    if (tab === 'estimate' && !estimate) {
      try {
        const res = await fetch('/api/repliers/estimates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mlsNumber: listing.mlsNumber }) });
        if (res.ok) setEstimate(await res.json());
      } catch {}
    }
    if (tab === 'comparables' && !comps) {
      try {
        const sqft = parseInt(listing.sqft) || 800;
        const res = await fetch('/api/repliers/listings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: listing.city || 'Toronto', status: 'U', lastStatus: 'Sld', neighborhood: listing.neighborhood, propertyType: pd.propertyType, minBeds: Math.max(1, listing.beds - 1), maxBeds: listing.beds + 1, minSqft: Math.max(0, sqft - 300), maxSqft: sqft + 300, resultsPerPage: 10, sortBy: 'soldDateDesc', minSoldDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0] }),
        });
        if (res.ok) { const d = await res.json(); setComps(d.listings || []); }
      } catch {}
    }
    if (tab === 'nearby' && !nearby) {
      try {
        const res = await fetch('/api/repliers/listings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: listing.city || 'Toronto', status: 'A', type: 'sale', neighborhood: listing.neighborhood, resultsPerPage: 8, sortBy: 'updatedOnDesc' }),
        });
        if (res.ok) { const d = await res.json(); setNearby((d.listings || []).filter((l: any) => l.mlsNumber !== listing.mlsNumber)); }
      } catch {}
    }
    if (tab === 'investment' && !rentalComps) {
      try {
        const res = await fetch('/api/repliers/listings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: listing.city || 'Toronto', status: 'A', type: 'lease', neighborhood: listing.neighborhood, minBeds: listing.beds, resultsPerPage: 5, sortBy: 'listPriceDesc' }),
        });
        if (res.ok) { const d = await res.json(); setRentalComps(d.listings || []); }
      } catch {}
    }
  }, [listing, pd, estimate, comps, nearby, rentalComps]);

  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);

  if (!listing) return <div className="pt-20 text-center text-text-muted">Listing not found.</div>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'comparables', label: 'Sold Comps' },
    { key: 'history', label: 'History' },
    { key: 'estimate', label: 'AI Estimate' },
    { key: 'neighbourhood', label: 'Neighbourhood' },
    { key: 'mortgage', label: 'Mortgage' },
    { key: 'investment', label: 'Investment' },
    { key: 'nearby', label: 'Nearby' },
  ];

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">Home</Link><span>/</span>
          <Link href="/search" className="hover:text-accent-blue">Search</Link><span>/</span>
          {listing.neighborhood && <><Link href={`/search?neighborhood=${encodeURIComponent(listing.neighborhood)}`} className="hover:text-accent-blue">{listing.neighborhood}</Link><span>/</span></>}
          <span className="text-text-primary">{listing.mlsNumber}</span>
        </nav>

        {/* Image Gallery */}
        <div className="rounded-xl overflow-hidden bg-surface2 mb-6">
          {images.length > 0 ? (
            <div className="relative">
              <img src={images[activeImage] || images[0]} alt={listing.address} className="w-full aspect-[16/10] object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-property.jpg'; }} />
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage((p) => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                  <button onClick={() => setActiveImage((p) => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">{activeImage + 1}/{images.length}</div>
                </>
              )}
            </div>
          ) : <div className="aspect-[16/10] flex items-center justify-center text-text-muted">No images</div>}
          {images.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto">
              {images.slice(0, 12).map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 ${i === activeImage ? 'border-accent-blue' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Price + Stats */}
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-serif text-3xl font-bold">{listing.priceDisplay || 'Contact'}</h1>
                  <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: buildingColor + '20', color: buildingColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: buildingColor }} />{buildingLabel}
                  </span>
                </div>
                {estimate?.estimatedValue && (
                  <p className="text-sm mt-1"><span className="text-text-muted">AI Estimate:</span> <span className="text-accent-green font-medium">${estimate.estimatedValue.toLocaleString()}</span></p>
                )}
                <p className="text-lg text-text-muted mt-1">{listing.address}</p>
                <p className="text-sm text-text-muted">{listing.neighborhood}, {listing.city}</p>
              </div>
              <div className="text-right text-sm text-text-muted">
                <p>MLS# {listing.mlsNumber}</p>
                <p>{listing.dom || 0} days on market</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Beds', value: listing.beds },
                { label: 'Baths', value: listing.baths },
                { label: 'Sqft', value: listing.sqft || 'N/A' },
                { label: 'Parking', value: listing.parking || 0 },
                { label: 'Year', value: listing.yearBuilt || 'N/A' },
                { label: 'DOM', value: listing.dom || 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-bold text-text-primary">{s.value}</p>
                  <p className="text-[10px] text-text-muted uppercase">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => toggleSaveListing(listing.id, listing.source)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${savedListingIds.has(listing.id) ? 'border-red-200 text-red-500 bg-red-50' : 'border-border text-text-muted hover:border-accent-blue/30'}`}>
                <svg className="w-4 h-4" fill={savedListingIds.has(listing.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {savedListingIds.has(listing.id) ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => navigator.share?.({ title: listing.address, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href))} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-text-muted hover:border-accent-blue/30">Share</button>
              <a href="tel:6478904082" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90">Contact Agent</a>
            </div>

            {/* Tab bar (sticky) */}
            <div className="sticky top-14 z-20 bg-bg border-b border-border -mx-4 px-4 overflow-x-auto">
              <div className="flex gap-0 min-w-max">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {pd.description && <div><h3 className="font-semibold text-lg mb-2">Description</h3><p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{pd.description}</p></div>}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Property Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 bg-white rounded-xl border border-border p-4">
                      <DetailRow label="Property Type" value={pd.propertyType} />
                      <DetailRow label="Style" value={pd.style} />
                      <DetailRow label="Year Built" value={pd.yearBuilt} />
                      <DetailRow label="Sqft" value={pd.sqft} />
                      <DetailRow label="Lot Size" value={pd.lotWidth && pd.lotDepth ? `${pd.lotWidth} x ${pd.lotDepth} ft` : pd.lotAcres ? `${pd.lotAcres} acres` : null} />
                      <DetailRow label="Parking" value={pd.parking} />
                      <DetailRow label="Garage" value={pd.garage ? `${pd.garage} (${pd.garageType || 'N/A'})` : pd.garageType} />
                      <DetailRow label="Driveway" value={pd.driveway} />
                      <DetailRow label="Basement" value={[pd.basement1, pd.basement2].filter(Boolean).join(', ') || null} />
                      <DetailRow label="Heating" value={pd.heating} />
                      <DetailRow label="A/C" value={pd.cooling} />
                      <DetailRow label="Fireplace" value={pd.fireplace} />
                      <DetailRow label="Exterior" value={[pd.exterior1, pd.exterior2].filter(Boolean).join(', ') || null} />
                      <DetailRow label="Roof" value={pd.roof} />
                      <DetailRow label="Water" value={pd.waterSource} />
                      <DetailRow label="Sewer" value={pd.sewer} />
                      <DetailRow label="Tax" value={pd.taxes ? `$${pd.taxes.toLocaleString()}/yr (${pd.taxYear || ''})` : null} />
                      <DetailRow label="Maintenance Fee" value={pd.maintenanceFee ? `$${pd.maintenanceFee}/mo` : listing.maintenanceFee ? `$${Math.round(listing.maintenanceFee)}/mo` : null} />
                    </div>
                  </div>
                  {pd.extras && <div><h3 className="font-semibold text-lg mb-2">Extras</h3><p className="text-sm text-text-muted">{pd.extras}</p></div>}
                  {rooms.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Rooms ({rooms.length})</h3>
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-surface border-b border-border"><th className="text-left px-4 py-2 text-text-muted font-medium">Room</th><th className="text-left px-4 py-2 text-text-muted font-medium">Level</th><th className="text-left px-4 py-2 text-text-muted font-medium">Size</th><th className="text-left px-4 py-2 text-text-muted font-medium hidden sm:table-cell">Features</th></tr></thead>
                          <tbody>
                            {rooms.map((r, i) => (
                              <tr key={i} className="border-b border-border last:border-0"><td className="px-4 py-2 font-medium">{r.name}</td><td className="px-4 py-2 text-text-muted">{r.level}</td><td className="px-4 py-2 text-text-muted">{r.length && r.width ? `${r.length} x ${r.width}` : ''}</td><td className="px-4 py-2 text-text-muted hidden sm:table-cell">{r.features}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {listing.lat && listing.lng && <div><h3 className="font-semibold text-lg mb-2">Location</h3><div className="h-64 rounded-xl overflow-hidden"><ListingMiniMap lat={listing.lat} lng={listing.lng} zoom={15} /></div></div>}
                </div>
              )}

              {activeTab === 'comparables' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Sold Comparables (Last 6 Months)</h3>
                  {comps === null ? <p className="text-text-muted text-sm">Loading comparables...</p> : comps.length === 0 ? <p className="text-text-muted text-sm">No comparable sales found in this area. Try checking the full neighbourhood on the search page.</p> : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">{comps.length}</p><p className="text-xs text-text-muted">Comps Found</p></div>
                        <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">${Math.round(comps.reduce((a, c) => a + (c.soldPrice || c.price), 0) / comps.length).toLocaleString()}</p><p className="text-xs text-text-muted">Avg Sold Price</p></div>
                        <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">{Math.round(comps.reduce((a, c) => a + c.dom, 0) / comps.length)}</p><p className="text-xs text-text-muted">Avg DOM</p></div>
                        <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">${Math.round(comps.reduce((a, c) => a + (c.soldPrice || c.price), 0) / comps.length / (parseInt(listing.sqft) || 800)).toLocaleString()}</p><p className="text-xs text-text-muted">Avg $/Sqft</p></div>
                      </div>
                      <div className="space-y-3">
                        {comps.map((c) => (
                          <Link key={c.id} href={`/listing/${c.mlsNumber}`} className="flex gap-4 p-3 bg-white rounded-xl border border-border hover:border-accent-blue/30 transition-colors">
                            {c.images?.[0] && <img src={c.images[0]} alt="" className="w-24 h-18 object-cover rounded flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-bold">${(c.soldPrice || c.price).toLocaleString()}</p>
                              {c.originalPrice && c.soldPrice && c.originalPrice !== c.soldPrice && (
                                <p className="text-xs"><span className="line-through text-text-muted">${c.originalPrice.toLocaleString()}</span> <span className={c.soldPrice > c.originalPrice ? 'text-accent-green' : 'text-red-500'}>{c.soldPrice > c.originalPrice ? '+' : ''}{((c.soldPrice - c.originalPrice) / c.originalPrice * 100).toFixed(1)}%</span></p>
                              )}
                              <p className="text-sm text-text-muted truncate">{c.address}</p>
                              <p className="text-xs text-text-muted">{c.beds}bd · {c.baths}ba · {c.sqft} sqft · {c.dom}DOM · Sold {c.soldDate?.split('T')[0]}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Listing History</h3>
                  {history.length === 0 ? <p className="text-text-muted text-sm">No history available.</p> : (
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                      {history.map((h, i) => (
                        <div key={i} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-accent-blue border-2 border-white" />
                          <div className="bg-white rounded-lg border border-border p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{h.lastStatus || h.status || 'Event'}</p>
                                <p className="text-xs text-text-muted">{h.listDate?.split('T')[0] || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                {h.listPrice && <p className="text-sm font-medium">${h.listPrice.toLocaleString()}</p>}
                                {h.soldPrice && <p className="text-xs text-accent-green font-medium">Sold ${h.soldPrice.toLocaleString()}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'estimate' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">CondoWizard AI Estimate</h3>
                  {!estimate ? <p className="text-text-muted text-sm">Loading estimate...</p> : !estimate.estimatedValue ? <p className="text-text-muted text-sm">Estimate not available for this property.</p> : (
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-border p-6 text-center">
                        <p className="text-xs text-text-muted uppercase mb-1">Estimated Value</p>
                        <p className="font-serif text-4xl font-bold text-accent-blue">${estimate.estimatedValue.toLocaleString()}</p>
                        {estimate.confidenceScore && <p className="text-sm text-text-muted mt-1">Confidence: {Math.round(estimate.confidenceScore * 100)}%</p>}
                        <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                          <span className="text-text-muted">Low: ${(estimate.low || estimate.estimatedValue * 0.9).toLocaleString()}</span>
                          <span className="text-text-muted">High: ${(estimate.high || estimate.estimatedValue * 1.1).toLocaleString()}</span>
                        </div>
                      </div>
                      {listing.price > 0 && (
                        <div className="bg-white rounded-xl border border-border p-4">
                          <p className="text-sm text-text-muted">vs. Asking Price (${listing.price.toLocaleString()})</p>
                          <p className={`text-lg font-bold mt-1 ${estimate.estimatedValue > listing.price ? 'text-accent-green' : estimate.estimatedValue < listing.price * 0.95 ? 'text-red-500' : 'text-text-primary'}`}>
                            {estimate.estimatedValue > listing.price * 1.05 ? 'Undervalued' : estimate.estimatedValue < listing.price * 0.95 ? 'Overpriced' : 'Fairly Priced'}
                            {' '}({((estimate.estimatedValue - listing.price) / listing.price * 100).toFixed(1)}%)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'neighbourhood' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">{listing.neighborhood || 'Neighbourhood'}</h3>
                  <div className="bg-white rounded-xl border border-border p-4 mb-4">
                    <p className="text-sm text-text-muted">View all listings and market stats for this neighbourhood.</p>
                    <Link href={`/search?neighborhood=${encodeURIComponent(listing.neighborhood || '')}`} className="inline-block mt-2 text-accent-blue text-sm font-medium hover:underline">View Neighbourhood Listings &rarr;</Link>
                  </div>
                  {listing.lat && listing.lng && <div className="h-48 rounded-xl overflow-hidden"><ListingMiniMap lat={listing.lat} lng={listing.lng} zoom={13} /></div>}
                </div>
              )}

              {activeTab === 'mortgage' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Mortgage Calculator</h3>
                  <div className="max-w-lg bg-white rounded-xl border border-border p-6">
                    <MortgageCalculator price={listing.price || 0} maintenanceFee={listing.maintenanceFee || 0} annualTax={pd.taxes || 0} />
                  </div>
                </div>
              )}

              {activeTab === 'investment' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Investment Analysis</h3>
                  {rentalComps === null ? <p className="text-text-muted text-sm">Loading rental data...</p> : rentalComps.length === 0 ? <p className="text-text-muted text-sm">No rental comparables found in this area.</p> : (() => {
                    const avgRent = Math.round(rentalComps.reduce((a, c) => a + c.price, 0) / rentalComps.length);
                    const annualRent = avgRent * 12;
                    const grossYield = listing.price > 0 ? (annualRent / listing.price * 100) : 0;
                    const monthlyMortgage = listing.price * 0.8 * (0.045 / 12) * Math.pow(1 + 0.045 / 12, 300) / (Math.pow(1 + 0.045 / 12, 300) - 1);
                    const monthlyCosts = monthlyMortgage + (listing.maintenanceFee || 0) + ((pd.taxes || listing.price * 0.0065) / 12) + 100;
                    const cashFlow = avgRent - monthlyCosts;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">${avgRent.toLocaleString()}</p><p className="text-xs text-text-muted">Est. Monthly Rent</p></div>
                          <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">{grossYield.toFixed(1)}%</p><p className="text-xs text-text-muted">Gross Yield</p></div>
                          <div className="bg-white rounded-lg border border-border p-3 text-center"><p className={`text-xl font-bold ${cashFlow >= 0 ? 'text-accent-green' : 'text-red-500'}`}>${Math.abs(Math.round(cashFlow)).toLocaleString()}</p><p className="text-xs text-text-muted">{cashFlow >= 0 ? 'Monthly Surplus' : 'Monthly Deficit'}</p></div>
                          <div className="bg-white rounded-lg border border-border p-3 text-center"><p className="text-xl font-bold">${Math.round(monthlyCosts).toLocaleString()}</p><p className="text-xs text-text-muted">Monthly Costs</p></div>
                        </div>
                        <h4 className="font-medium text-sm mt-4">Rental Comparables</h4>
                        {rentalComps.map((r) => (
                          <div key={r.id} className="flex justify-between p-3 bg-white rounded-lg border border-border text-sm">
                            <div><p className="font-medium">${r.price.toLocaleString()}/mo</p><p className="text-xs text-text-muted">{r.address}</p></div>
                            <p className="text-xs text-text-muted">{r.beds}bd · {r.baths}ba</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'nearby' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Nearby Active Listings</h3>
                  {nearby === null ? <p className="text-text-muted text-sm">Loading...</p> : nearby.length === 0 ? <p className="text-text-muted text-sm">No nearby active listings found.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nearby.map((n) => (
                        <Link key={n.id} href={`/listing/${n.mlsNumber}`} className="bg-white rounded-xl border border-border p-3 hover:border-accent-blue/30 transition-colors">
                          <div className="flex gap-3">
                            {n.images?.[0] && <img src={n.images[0]} alt="" className="w-20 h-16 object-cover rounded flex-shrink-0" />}
                            <div className="min-w-0"><p className="font-serif font-bold text-sm">{n.priceDisplay}</p><p className="text-xs text-text-muted truncate">{n.address}</p><p className="text-xs text-text-muted">{n.beds}bd · {n.baths}ba · {n.sqft}</p></div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Agent card */}
          <div>
            <div className="bg-white rounded-xl border border-border p-6 sticky top-20">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-3"><span className="text-accent-blue font-bold text-xl">TS</span></div>
                <h3 className="font-semibold">Tal Shelef</h3>
                <p className="text-sm text-text-muted">Sales Representative</p>
                <p className="text-xs text-text-muted">Rare Real Estate Inc., Brokerage</p>
              </div>
              <a href="tel:6478904082" className="block w-full text-center bg-accent-blue text-white py-2.5 rounded-lg font-medium hover:bg-accent-blue/90 mb-2">Call 647-890-4082</a>
              <form onSubmit={async (e) => {
                e.preventDefault(); const form = e.target as HTMLFormElement; const fd = new FormData(form);
                await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), message: fd.get('message') || `Inquiry about MLS# ${listing.mlsNumber}`, source: 'listing_page', projectSlug: listing.mlsNumber }) });
                form.reset(); alert('Inquiry sent!');
              }} className="space-y-3 mt-4">
                <input name="name" placeholder="Your name" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input name="phone" placeholder="Phone" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <textarea name="message" placeholder="I'm interested..." rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none" />
                <button type="submit" className="w-full bg-accent-green text-white py-2.5 rounded-lg font-medium hover:bg-accent-green/90">Send Inquiry</button>
              </form>
              <p className="text-[10px] text-text-muted mt-4 text-center">Rare Real Estate Inc., Brokerage<br />1701 Avenue Rd, Toronto, ON M5M 3Y3</p>
            </div>
          </div>
        </div>

        {/* RECO */}
        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p className="font-medium text-text-primary mb-1">RECO Disclosure</p>
          <p>Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage. 1701 Avenue Rd, Toronto, ON M5M 3Y3. 647-890-4082 | Contact@condowizard.ca</p>
          <p className="mt-1">All information is provided by TRREB and is deemed reliable but not guaranteed.</p>
        </div>
      </div>
    </div>
  );
}
