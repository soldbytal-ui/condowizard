'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UnifiedListing, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';

const ListingMiniMap = dynamic(() => import('./ListingMiniMap'), { ssr: false });

interface HistoryEntry {
  mlsNumber?: string;
  listDate?: string;
  listPrice?: number;
  soldDate?: string;
  soldPrice?: number;
  status?: string;
  lastStatus?: string;
}

interface Props {
  listing: UnifiedListing;
  comparables: UnifiedListing[];
  history: HistoryEntry[];
}

function MortgageCalculator({ price }: { price: number }) {
  const safePrice = price || 500000;
  const [downPayment, setDownPayment] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [amortization, setAmortization] = useState(25);
  const [maintenanceFee] = useState(0);
  const [propertyTax] = useState(Math.round(safePrice * 0.0065 / 12));

  const principal = safePrice * (1 - downPayment / 100);
  const monthlyRate = rate / 100 / 12;
  const numPayments = amortization * 12;
  const monthlyMortgage = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : principal / numPayments;
  const totalMonthly = monthlyMortgage + maintenanceFee + propertyTax;

  return (
    <div className="space-y-4">
      <div>
        <label className="flex justify-between text-sm">
          <span>Down Payment</span>
          <span className="font-medium">{downPayment}% (${Math.round(safePrice * downPayment / 100).toLocaleString()})</span>
        </label>
        <input type="range" min={5} max={50} value={downPayment} onChange={(e) => setDownPayment(parseInt(e.target.value))} className="w-full mt-1 accent-accent-blue" />
      </div>
      <div>
        <label className="flex justify-between text-sm">
          <span>Interest Rate</span>
          <span className="font-medium">{rate}%</span>
        </label>
        <input type="range" min={2} max={10} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full mt-1 accent-accent-blue" />
      </div>
      <div>
        <label className="flex justify-between text-sm">
          <span>Amortization</span>
          <span className="font-medium">{amortization} years</span>
        </label>
        <input type="range" min={5} max={30} step={5} value={amortization} onChange={(e) => setAmortization(parseInt(e.target.value))} className="w-full mt-1 accent-accent-blue" />
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Mortgage</span>
          <span className="font-medium">${Math.round(monthlyMortgage).toLocaleString()}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Maintenance</span>
          <span>${maintenanceFee.toLocaleString()}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Property Tax (est.)</span>
          <span>${propertyTax.toLocaleString()}/mo</span>
        </div>
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
          <span>Total Monthly</span>
          <span className="text-accent-blue">${Math.round(totalMonthly).toLocaleString()}/mo</span>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetail({ listing, comparables, history }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImage, setActiveImage] = useState(0);
  const [estimate, setEstimate] = useState<{ estimatedValue: number; low: number; high: number } | null>(null);

  const images = listing?.images || [];
  const features = listing?.features || [];
  const safeComparables = comparables || [];
  const safeHistory = history || [];

  useEffect(() => {
    if (!listing?.mlsNumber) return;
    fetch('/api/repliers/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mlsNumber: listing.mlsNumber }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.estimatedValue) setEstimate(data);
      })
      .catch(() => {});
  }, [listing?.mlsNumber]);

  if (!listing) {
    return (
      <div className="pt-14 bg-bg min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Listing not found.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'History' },
    { key: 'comparables', label: 'Comparables' },
    { key: 'mortgage', label: 'Mortgage' },
  ];

  const buildingTypeColor = BUILDING_TYPE_COLORS[listing.buildingType] || '#6B7280';
  const buildingTypeLabel = BUILDING_TYPE_LABELS[listing.buildingType] || listing.buildingType || 'Unknown';

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-accent-blue">Search</Link>
          <span>/</span>
          {listing.neighborhood ? (
            <>
              <Link href={`/neighborhood/${listing.neighborhood.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-accent-blue">
                {listing.neighborhood}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-text-primary">{listing.mlsNumber || listing.id}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="rounded-xl overflow-hidden bg-surface2">
              {images.length > 0 ? (
                <div className="relative">
                  <img
                    src={images[activeImage] || images[0]}
                    alt={`${listing.address || 'Property'} - Photo ${activeImage + 1}`}
                    className="w-full aspect-[16/10] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-property.jpg'; }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {activeImage + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] flex items-center justify-center text-text-muted">No images available</div>
              )}
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-1 p-2 overflow-x-auto">
                  {images.slice(0, 10).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                        i === activeImage ? 'border-accent-blue' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price + quick stats */}
            <div className="mt-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-serif text-3xl font-bold">{listing.priceDisplay || 'Contact for pricing'}</h1>
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: buildingTypeColor + '20', color: buildingTypeColor }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: buildingTypeColor }} />
                      {buildingTypeLabel}
                    </span>
                  </div>
                  {estimate && (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="text-text-muted">AI Estimate:</span>
                      <span className="font-medium text-accent-green">${estimate.estimatedValue.toLocaleString()}</span>
                      <span className="text-text-muted text-xs">(${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()})</span>
                    </div>
                  )}
                  <p className="text-lg text-text-muted mt-1">{listing.address || 'Address unavailable'}</p>
                  <p className="text-sm text-text-muted">
                    {[listing.neighborhood, listing.city].filter(Boolean).join(', ') || 'Toronto'}
                  </p>
                </div>
                <div className="text-right text-sm text-text-muted">
                  {listing.mlsNumber && <p>MLS# {listing.mlsNumber}</p>}
                  <p>{listing.dom || 0} days on market</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 p-4 bg-white rounded-xl border border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.beds ?? 'N/A'}</p>
                  <p className="text-xs text-text-muted">Bedrooms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.baths ?? 'N/A'}</p>
                  <p className="text-xs text-text-muted">Bathrooms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.sqft || 'N/A'}</p>
                  <p className="text-xs text-text-muted">Sqft</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.parking ?? 0}</p>
                  <p className="text-xs text-text-muted">Parking</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{listing.yearBuilt || 'N/A'}</p>
                  <p className="text-xs text-text-muted">Year Built</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b border-border">
              <div className="flex gap-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-accent-blue text-accent-blue'
                        : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {listing.description ? (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{listing.description}</p>
                    </div>
                  ) : null}
                  {features.length > 0 ? (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Features & Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {features.map((f, i) => (
                          <span key={i} className="px-3 py-1.5 bg-surface2 rounded-full text-sm text-text-muted">{f}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {listing.maintenanceFee ? (
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border">
                      <div>
                        <p className="text-sm text-text-muted">Maintenance Fee</p>
                        <p className="text-lg font-bold">${Math.round(listing.maintenanceFee).toLocaleString()}/mo</p>
                      </div>
                      {listing.taxes ? (
                        <div className="border-l border-border pl-4">
                          <p className="text-sm text-text-muted">Property Tax</p>
                          <p className="text-lg font-bold">${listing.taxes.toLocaleString()}/yr</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {/* Mini map */}
                  {listing.lat && listing.lng ? (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Location</h3>
                      <div className="h-64 rounded-xl overflow-hidden">
                        <ListingMiniMap lat={listing.lat} lng={listing.lng} zoom={15} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Listing History</h3>
                  {safeHistory.length > 0 ? (
                    <div className="space-y-3">
                      {safeHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium">
                              {h.status || 'Unknown'}
                              {h.lastStatus ? ` (${h.lastStatus})` : ''}
                            </p>
                            <p className="text-xs text-text-muted">{h.listDate || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {h.listPrice ? `$${h.listPrice.toLocaleString()}` : 'N/A'}
                            </p>
                            {h.soldPrice ? (
                              <p className="text-xs text-accent-green">Sold: ${h.soldPrice.toLocaleString()}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No history available for this listing.</p>
                  )}
                </div>
              )}

              {activeTab === 'comparables' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Comparable Sales</h3>
                  {safeComparables.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {safeComparables.map((comp) => (
                        <Link
                          key={comp.id}
                          href={`/listing/${comp.mlsNumber || comp.id}`}
                          className="block p-4 bg-white rounded-xl border border-border hover:border-accent-blue/30 transition-colors"
                        >
                          <div className="flex gap-3">
                            {comp.images?.[0] ? (
                              <img src={comp.images[0]} alt={comp.address || ''} className="w-20 h-16 object-cover rounded" />
                            ) : null}
                            <div>
                              <p className="font-serif font-bold">{comp.priceDisplay || 'N/A'}</p>
                              <p className="text-sm text-text-muted truncate">{comp.address || 'Address unavailable'}</p>
                              <p className="text-xs text-text-muted">
                                {comp.beds ?? 0} bd | {comp.baths ?? 0} ba{comp.sqft ? ` | ${comp.sqft} sqft` : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No comparable sales available.</p>
                  )}
                </div>
              )}

              {activeTab === 'mortgage' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Mortgage Calculator</h3>
                  <div className="max-w-md bg-white p-6 rounded-xl border border-border">
                    <MortgageCalculator price={listing.price || 0} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent card */}
            <div className="bg-white rounded-xl border border-border p-6 sticky top-20">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-accent-blue font-bold text-xl">TS</span>
                </div>
                <h3 className="font-semibold">Tal Shelef</h3>
                <p className="text-sm text-text-muted">Sales Representative</p>
                <p className="text-xs text-text-muted">Rare Real Estate Inc., Brokerage</p>
              </div>

              <a
                href="tel:6478904082"
                className="block w-full text-center bg-accent-blue text-white py-2.5 rounded-lg font-medium hover:bg-accent-blue/90 transition-colors mb-2"
              >
                Call 647-890-4082
              </a>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  try {
                    await fetch('/api/leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        message: formData.get('message') || `Inquiry about MLS# ${listing.mlsNumber || listing.id}`,
                        source: 'listing_page',
                        projectSlug: listing.mlsNumber || listing.id,
                      }),
                    });
                    form.reset();
                    alert('Your inquiry has been sent!');
                  } catch {
                    alert('Something went wrong. Please try again.');
                  }
                }}
                className="space-y-3 mt-4"
              >
                <input name="name" placeholder="Your name" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input name="phone" placeholder="Phone (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <textarea name="message" placeholder="I'm interested in this property..." rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none" />
                <button type="submit" className="w-full bg-accent-green text-white py-2.5 rounded-lg font-medium hover:bg-accent-green/90 transition-colors">
                  Send Inquiry
                </button>
              </form>

              <p className="text-[10px] text-text-muted mt-4 text-center">
                Rare Real Estate Inc., Brokerage<br />
                1701 Avenue Rd, Toronto, ON M5M 3Y3
              </p>
            </div>
          </div>
        </div>

        {/* RECO disclosure */}
        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p className="font-medium text-text-primary mb-1">RECO Disclosure</p>
          <p>Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage. 1701 Avenue Rd, Toronto, ON M5M 3Y3. 647-890-4082 | Contact@condowizard.ca</p>
          <p className="mt-1">All information is provided by the Toronto Regional Real Estate Board (TRREB) and is deemed reliable but not guaranteed. This is not intended to solicit buyers or sellers currently under contract.</p>
        </div>
      </div>
    </div>
  );
}
