'use client';

import { useState } from 'react';
import { ListingFilters, BuildingType, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';

interface Props {
  filters: ListingFilters;
  onFilterChange: (filters: Partial<ListingFilters>) => void;
  onClose: () => void;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface2 transition-colors">
        {title}
        <svg className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function RangeInputs({ label, minVal, maxVal, onMin, onMax, placeholder }: {
  label: string; minVal?: number | string; maxVal?: number | string;
  onMin: (v: string) => void; onMax: (v: string) => void; placeholder?: [string, string];
}) {
  return (
    <div>
      <label className="text-xs text-text-muted mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input type="number" placeholder={placeholder?.[0] || 'Min'} value={minVal || ''} onChange={(e) => onMin(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
        <input type="number" placeholder={placeholder?.[1] || 'Max'} value={maxVal || ''} onChange={(e) => onMax(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
      </div>
    </div>
  );
}

function DateRange({ label, minVal, maxVal, onMin, onMax }: {
  label: string; minVal?: string; maxVal?: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input type="date" value={minVal || ''} onChange={(e) => onMin(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
        <input type="date" value={maxVal || ''} onChange={(e) => onMax(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
      </div>
    </div>
  );
}

function MultiCheck({ label, options, selected, onChange }: {
  label: string; options: string[]; selected?: string[];
  onChange: (v: string[]) => void;
}) {
  const sel = selected || [];
  return (
    <div>
      <label className="text-xs text-text-muted mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = sel.includes(opt);
          return (
            <button key={opt} onClick={() => onChange(active ? sel.filter((s) => s !== opt) : [...sel, opt])}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${active ? 'bg-accent-blue text-white border-accent-blue' : 'border-border text-text-muted hover:border-accent-blue/30'}`}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

const num = (v: string) => v ? parseInt(v) : undefined;

const PROPERTY_TYPES = ['Condo Apt', 'Detached', 'Semi-Detached', 'Att/Row/Twnhouse', 'Condo Townhouse', 'Link', 'Multiplex', 'Vacant Land', 'Farm', 'Store W/Apt/Ofc', 'Comm Element Condo', 'Co-Op Apt', 'Det Condo', 'Leasehold Condo'];
const STYLES = ['Apartment', 'Bungalow', '2-Storey', '3-Storey', 'Backsplit', 'Sidesplit', 'Loft', '1 1/2 Storey', 'Bungalow-Raised', 'Multi-Level', 'Other'];
const LAST_STATUSES = [
  { value: 'New', label: 'New' }, { value: 'Pc', label: 'Price Change' }, { value: 'Ext', label: 'Extension' },
  { value: 'Sld', label: 'Sold' }, { value: 'Sc', label: 'Sold Conditional' }, { value: 'Sce', label: 'Sold Cond. Escaped' },
  { value: 'Dft', label: 'Draft' }, { value: 'Exp', label: 'Expired' }, { value: 'Sus', label: 'Suspended' },
  { value: 'Ter', label: 'Terminated' }, { value: 'Lsd', label: 'Leased' }, { value: 'Lc', label: 'Lease Conditional' },
];
const BASEMENT_TYPES = ['Apartment', 'Finished', 'Fin W/O', 'Full', 'Half', 'None', 'Part Fin', 'Sep Entrance', 'Unfinished', 'Walk-Up', 'Walk-Out', 'Crawl Space'];
const GARAGE_TYPES = ['Attached', 'Detached', 'Built-In', 'Underground', 'None', 'Carport', 'Other'];
const HEATING_TYPES = ['Forced Air', 'Radiant', 'Baseboard', 'Heat Pump', 'Other'];
const POOL_TYPES = ['Indoor', 'Inground', 'Above Ground', 'None'];
const TRREB_COMMUNITIES = [
  'C01', 'C02', 'C03', 'C04', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15',
  'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10', 'E11',
  'W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10',
  'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09', 'N10', 'N11',
];

export default function AdvancedFilters({ filters: f, onFilterChange: set, onClose }: Props) {
  const isSold = f.tab === 'sold';
  const isRent = f.tab === 'rent';

  function clearAll() {
    set({
      mlsNumber: undefined, propertyType: undefined, style: undefined, class: undefined,
      lastStatus: undefined, domMin: undefined, domMax: undefined, updatedOnMin: undefined, updatedOnMax: undefined,
      listDateMin: undefined, listDateMax: undefined, soldDateMin: undefined, soldDateMax: undefined,
      soldPriceMin: undefined, soldPriceMax: undefined, soldDateRange: undefined,
      maintenanceFeeMax: undefined, taxMin: undefined, taxMax: undefined, priceChangeType: undefined,
      bedsPlus: undefined, halfBathMin: undefined, halfBathMax: undefined, kitchensMin: undefined,
      lotSizeMin: undefined, lotSizeMax: undefined, storiesMin: undefined, storiesMax: undefined,
      yearBuiltMin: undefined, yearBuiltMax: undefined, parkingMin: undefined, garageMin: undefined,
      garageType: undefined, driveway: undefined, locker: undefined, basement: undefined,
      heating: undefined, exterior: undefined, pool: undefined, balcony: undefined,
      waterfront: undefined, den: undefined, openHouse: undefined, openHouseDateMin: undefined,
      openHouseDateMax: undefined, hasImages: undefined, hasAgents: undefined,
      streetName: undefined, streetNumberMin: undefined, streetNumberMax: undefined,
      streetDirection: undefined, unitNumber: undefined, area: undefined, municipality: undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto pt-16 pb-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Advanced Filters</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface2">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* LOCATION */}
          <Section title="Location" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted">Community (TRREB)</label>
                <select value={f.community || ''} onChange={(e) => set({ community: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                  <option value="">Any</option>
                  {TRREB_COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted">Neighborhood</label>
                <input type="text" placeholder="e.g. Yorkville" value={f.neighborhood || ''} onChange={(e) => set({ neighborhood: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-text-muted">Area</label>
                <input type="text" placeholder="e.g. Toronto" value={f.area || ''} onChange={(e) => set({ area: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-text-muted">Municipality</label>
                <input type="text" value={f.municipality || ''} onChange={(e) => set({ municipality: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-text-muted">Street Name</label>
                <input type="text" placeholder="e.g. Bay Street" value={f.streetName || ''} onChange={(e) => set({ streetName: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <RangeInputs label="Street # Range" minVal={f.streetNumberMin} maxVal={f.streetNumberMax}
                onMin={(v) => set({ streetNumberMin: num(v) })} onMax={(v) => set({ streetNumberMax: num(v) })} placeholder={['From #', 'To #']} />
              <div>
                <label className="text-xs text-text-muted">Apt/Unit #</label>
                <input type="text" value={f.unitNumber || ''} onChange={(e) => set({ unitNumber: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-text-muted">Street Direction</label>
                <select value={f.streetDirection || ''} onChange={(e) => set({ streetDirection: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                  <option value="">Any</option>
                  <option value="N">N</option><option value="S">S</option><option value="E">E</option><option value="W">W</option>
                </select>
              </div>
            </div>
          </Section>

          {/* PROPERTY */}
          <Section title="Property">
            <div>
              <label className="text-xs text-text-muted">MLS # (direct lookup)</label>
              <input type="text" placeholder="e.g. C1234567" value={f.mlsNumber || ''} onChange={(e) => set({ mlsNumber: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
            </div>
            <MultiCheck label="Property Type" options={PROPERTY_TYPES} selected={f.propertyType} onChange={(v) => set({ propertyType: v.length ? v : undefined })} />
            <MultiCheck label="Style" options={STYLES} selected={f.style} onChange={(v) => set({ style: v.length ? v : undefined })} />
            <div>
              <label className="text-xs text-text-muted">Class</label>
              <div className="flex gap-2 mt-1">
                {['residential', 'condo', 'commercial'].map((c) => (
                  <button key={c} onClick={() => set({ class: f.class === c ? undefined : c })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${f.class === c ? 'bg-accent-blue text-white border-accent-blue' : 'border-border text-text-muted'}`}
                  >{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Building Type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['low-rise', 'mid-rise', 'high-rise', 'loft', 'luxury', 'precon'] as BuildingType[]).map((bt) => {
                  const active = f.buildingTypes?.includes(bt);
                  return (
                    <button key={bt} onClick={() => {
                      const curr = f.buildingTypes || [];
                      set({ buildingTypes: active ? curr.filter((t) => t !== bt) : [...curr, bt] });
                    }} className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors ${active ? 'border-accent-blue bg-accent-blue/10' : 'border-border text-text-muted'}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BUILDING_TYPE_COLORS[bt] }} />
                      {BUILDING_TYPE_LABELS[bt]}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* STATUS */}
          <Section title="Status & Dates">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Last Status</label>
              <div className="flex flex-wrap gap-1.5">
                {LAST_STATUSES.map(({ value, label }) => {
                  const active = f.lastStatus?.includes(value);
                  return (
                    <button key={value} onClick={() => {
                      const curr = f.lastStatus || [];
                      set({ lastStatus: active ? curr.filter((s) => s !== value) : [...curr, value] });
                    }} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${active ? 'bg-accent-blue text-white border-accent-blue' : 'border-border text-text-muted'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <RangeInputs label="Days on Market" minVal={f.domMin} maxVal={f.domMax} onMin={(v) => set({ domMin: num(v) })} onMax={(v) => set({ domMax: num(v) })} />
            <DateRange label="Last Updated" minVal={f.updatedOnMin} maxVal={f.updatedOnMax} onMin={(v) => set({ updatedOnMin: v || undefined })} onMax={(v) => set({ updatedOnMax: v || undefined })} />
            <DateRange label="List Date" minVal={f.listDateMin} maxVal={f.listDateMax} onMin={(v) => set({ listDateMin: v || undefined })} onMax={(v) => set({ listDateMax: v || undefined })} />
            {isSold && (
              <>
                <DateRange label="Sold Date" minVal={f.soldDateMin} maxVal={f.soldDateMax} onMin={(v) => set({ soldDateMin: v || undefined })} onMax={(v) => set({ soldDateMax: v || undefined })} />
                <RangeInputs label="Sold Price" minVal={f.soldPriceMin} maxVal={f.soldPriceMax} onMin={(v) => set({ soldPriceMin: num(v) })} onMax={(v) => set({ soldPriceMax: num(v) })} />
              </>
            )}
          </Section>

          {/* PRICE & FINANCIALS */}
          <Section title="Price & Financials">
            <RangeInputs label="Price Range" minVal={f.priceMin} maxVal={f.priceMax} onMin={(v) => set({ priceMin: num(v) })} onMax={(v) => set({ priceMax: num(v) })} />
            <div>
              <label className="text-xs text-text-muted">Max Maintenance Fee</label>
              <input type="number" placeholder="Any" value={f.maintenanceFeeMax || ''} onChange={(e) => set({ maintenanceFeeMax: num(e.target.value) })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
            </div>
            <RangeInputs label="Annual Tax" minVal={f.taxMin} maxVal={f.taxMax} onMin={(v) => set({ taxMin: num(v) })} onMax={(v) => set({ taxMax: num(v) })} />
            <div>
              <label className="text-xs text-text-muted">Price Change</label>
              <select value={f.priceChangeType || ''} onChange={(e) => set({ priceChangeType: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                <option value="">Any</option>
                <option value="increase">Price Increase</option>
                <option value="decrease">Price Decrease</option>
              </select>
            </div>
          </Section>

          {/* SIZE & FEATURES */}
          <Section title="Size & Features">
            <RangeInputs label="Bedrooms" minVal={f.bedsMin} maxVal={f.bedsMax} onMin={(v) => set({ bedsMin: num(v) })} onMax={(v) => set({ bedsMax: num(v) })} />
            <div>
              <label className="text-xs text-text-muted">Bedrooms Plus (e.g. den/basement)</label>
              <input type="number" placeholder="Min" value={f.bedsPlus || ''} onChange={(e) => set({ bedsPlus: num(e.target.value) })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
            </div>
            <RangeInputs label="Bathrooms" minVal={f.bathsMin} maxVal={f.bathsMax} onMin={(v) => set({ bathsMin: num(v) })} onMax={(v) => set({ bathsMax: num(v) })} />
            <RangeInputs label="Sqft" minVal={f.sqftMin} maxVal={f.sqftMax} onMin={(v) => set({ sqftMin: num(v) })} onMax={(v) => set({ sqftMax: num(v) })} />
            <RangeInputs label="Lot Size (sqft)" minVal={f.lotSizeMin} maxVal={f.lotSizeMax} onMin={(v) => set({ lotSizeMin: num(v) })} onMax={(v) => set({ lotSizeMax: num(v) })} />
            <RangeInputs label="Stories" minVal={f.storiesMin} maxVal={f.storiesMax} onMin={(v) => set({ storiesMin: num(v) })} onMax={(v) => set({ storiesMax: num(v) })} />
            <RangeInputs label="Year Built" minVal={f.yearBuiltMin} maxVal={f.yearBuiltMax} onMin={(v) => set({ yearBuiltMin: num(v) })} onMax={(v) => set({ yearBuiltMax: num(v) })} />
          </Section>

          {/* PARKING */}
          <Section title="Parking & Garage">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted">Min Parking Spaces</label>
                <input type="number" value={f.parkingMin || ''} onChange={(e) => set({ parkingMin: num(e.target.value) })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-text-muted">Min Garage Spaces</label>
                <input type="number" value={f.garageMin || ''} onChange={(e) => set({ garageMin: num(e.target.value) })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg" />
              </div>
            </div>
            <MultiCheck label="Garage Type" options={GARAGE_TYPES} selected={f.garageType} onChange={(v) => set({ garageType: v.length ? v : undefined })} />
            <div>
              <label className="text-xs text-text-muted">Locker</label>
              <select value={f.locker || ''} onChange={(e) => set({ locker: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                <option value="">Any</option>
                <option value="Owned">Owned</option><option value="Ensuite">Ensuite</option><option value="Exclusive">Exclusive</option><option value="None">None</option>
              </select>
            </div>
          </Section>

          {/* BUILDING FEATURES */}
          <Section title="Building Features">
            <MultiCheck label="Basement" options={BASEMENT_TYPES} selected={f.basement} onChange={(v) => set({ basement: v.length ? v : undefined })} />
            <MultiCheck label="Heating" options={HEATING_TYPES} selected={f.heating} onChange={(v) => set({ heating: v.length ? v : undefined })} />
            <MultiCheck label="Pool" options={POOL_TYPES} selected={f.pool} onChange={(v) => set({ pool: v.length ? v : undefined })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted">Waterfront</label>
                <select value={f.waterfront || ''} onChange={(e) => set({ waterfront: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                  <option value="">Any</option><option value="Y">Yes</option><option value="N">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted">Den</label>
                <select value={f.den || ''} onChange={(e) => set({ den: e.target.value || undefined })} className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded-lg">
                  <option value="">Any</option><option value="Y">Yes</option><option value="N">No</option>
                </select>
              </div>
            </div>
          </Section>

          {/* OPEN HOUSE */}
          <Section title="Open House">
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input type="checkbox" checked={f.openHouse || false} onChange={(e) => set({ openHouse: e.target.checked || undefined })} className="rounded" />
              Has Open House
            </label>
            {f.openHouse && (
              <DateRange label="Open House Date" minVal={f.openHouseDateMin} maxVal={f.openHouseDateMax}
                onMin={(v) => set({ openHouseDateMin: v || undefined })} onMax={(v) => set({ openHouseDateMax: v || undefined })} />
            )}
          </Section>

          {/* DISPLAY */}
          <Section title="Display Options">
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input type="checkbox" checked={f.hasImages || false} onChange={(e) => set({ hasImages: e.target.checked || undefined })} className="rounded" />
              Has Images
            </label>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input type="checkbox" checked={f.hasAgents || false} onChange={(e) => set({ hasAgents: e.target.checked || undefined })} className="rounded" />
              Has Agent Info
            </label>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-shrink-0">
          <button onClick={clearAll} className="text-sm text-red-500 hover:underline">Clear All</button>
          <button onClick={onClose} className="px-6 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
