'use client';

import { useState } from 'react';
import { ListingFilters, BuildingType, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';

interface SearchFiltersProps {
  filters: ListingFilters;
  onFilterChange: (filters: Partial<ListingFilters>) => void;
  totalCount: number;
  avgPrice?: number;
  avgDom?: number;
}

export default function SearchFilters({ filters, onFilterChange, totalCount, avgPrice, avgDom }: SearchFiltersProps) {
  const [showMore, setShowMore] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  const tabs: { key: ListingFilters['tab']; label: string }[] = [
    { key: 'sale', label: 'For Sale' },
    { key: 'precon', label: 'Pre-Construction' },
    { key: 'sold', label: 'Sold' },
    { key: 'rent', label: 'For Rent' },
  ];

  const bedOptions = [
    { label: 'Any', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
  ];

  const sortOptions = [
    { label: 'Newest', value: 'newest' as const },
    { label: 'Price: Low to High', value: 'price_asc' as const },
    { label: 'Price: High to Low', value: 'price_desc' as const },
    { label: 'Largest', value: 'largest' as const },
  ];

  const buildingTypes: BuildingType[] = ['low-rise', 'mid-rise', 'high-rise', 'loft', 'luxury', 'precon'];

  return (
    <div className="bg-white border-b border-border">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange({ tab: tab.key, page: 1 })}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              filters.tab === tab.key
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2">
        {/* Price dropdown */}
        <div className="relative">
          <button
            onClick={() => { setPriceOpen(!priceOpen); setSizeOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:border-accent-blue/30 transition-colors"
          >
            Price
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {priceOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border p-4 z-20 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted">Min Price</label>
                  <input
                    type="number"
                    placeholder="No min"
                    value={filters.priceMin || ''}
                    onChange={(e) => onFilterChange({ priceMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Max Price</label>
                  <input
                    type="number"
                    placeholder="No max"
                    value={filters.priceMax || ''}
                    onChange={(e) => onFilterChange({ priceMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={() => setPriceOpen(false)}
                  className="w-full py-2 bg-accent-blue text-white rounded-lg text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Size dropdown */}
        <div className="relative">
          <button
            onClick={() => { setSizeOpen(!sizeOpen); setPriceOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:border-accent-blue/30 transition-colors"
          >
            Size
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sizeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border p-4 z-20 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted">Min Sqft</label>
                  <input
                    type="number"
                    placeholder="No min"
                    value={filters.sqftMin || ''}
                    onChange={(e) => onFilterChange({ sqftMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Max Sqft</label>
                  <input
                    type="number"
                    placeholder="No max"
                    value={filters.sqftMax || ''}
                    onChange={(e) => onFilterChange({ sqftMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={() => setSizeOpen(false)}
                  className="w-full py-2 bg-accent-blue text-white rounded-lg text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Beds selector */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {bedOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onFilterChange({ bedsMin: opt.value })}
              className={`px-3 py-2 text-sm transition-colors ${
                filters.bedsMin === opt.value
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:bg-surface2'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Baths */}
        <select
          value={filters.bathsMin || ''}
          onChange={(e) => onFilterChange({ bathsMin: e.target.value ? parseInt(e.target.value) : undefined })}
          className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted"
        >
          <option value="">Baths</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>

        {/* More+ */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
            showMore ? 'border-accent-blue text-accent-blue bg-accent-blue/5' : 'border-border text-text-muted hover:border-accent-blue/30'
          }`}
        >
          More+
        </button>

        <div className="flex-1" />

        {/* Sort */}
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as ListingFilters['sortBy'] })}
          className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Get Alerts */}
        <button className="px-4 py-2 text-sm font-medium bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors">
          Get Alerts
        </button>
      </div>

      {/* More filters (expanded) */}
      {showMore && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Max DOM</label>
            <input
              type="number"
              placeholder="Any"
              value={filters.domMax || ''}
              onChange={(e) => onFilterChange({ domMax: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-24 px-3 py-1.5 text-sm border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Max Maint. Fee</label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maintenanceFeeMax || ''}
              onChange={(e) => onFilterChange({ maintenanceFeeMax: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-24 px-3 py-1.5 text-sm border border-border rounded-lg"
            />
          </div>
          {filters.tab === 'precon' && (
            <>
              <div>
                <label className="text-xs text-text-muted block mb-1">Developer</label>
                <input
                  type="text"
                  placeholder="Any"
                  value={filters.developer || ''}
                  onChange={(e) => onFilterChange({ developer: e.target.value || undefined })}
                  className="w-36 px-3 py-1.5 text-sm border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Occupancy Year</label>
                <select
                  value={filters.occupancyYear || ''}
                  onChange={(e) => onFilterChange({ occupancyYear: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg"
                >
                  <option value="">Any</option>
                  {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={filters.parking || false}
              onChange={(e) => onFilterChange({ parking: e.target.checked || undefined })}
              className="rounded"
            />
            Parking
          </label>
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={filters.openHouse || false}
              onChange={(e) => onFilterChange({ openHouse: e.target.checked || undefined })}
              className="rounded"
            />
            Open House
          </label>
        </div>
      )}

      {/* Building type legend */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-3">
        {buildingTypes.map((bt) => {
          const active = !filters.buildingTypes || filters.buildingTypes.includes(bt);
          return (
            <button
              key={bt}
              onClick={() => {
                if (!filters.buildingTypes) {
                  onFilterChange({ buildingTypes: [bt] });
                } else if (filters.buildingTypes.includes(bt)) {
                  const remaining = filters.buildingTypes.filter((t) => t !== bt);
                  onFilterChange({ buildingTypes: remaining.length ? remaining : undefined });
                } else {
                  onFilterChange({ buildingTypes: [...filters.buildingTypes, bt] });
                }
              }}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: BUILDING_TYPE_COLORS[bt] }}
              />
              {BUILDING_TYPE_LABELS[bt]}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="px-4 pb-2 flex items-center gap-4 text-xs text-text-muted">
        <span className="font-medium text-text-primary">{totalCount.toLocaleString()} listings</span>
        {avgPrice && <span>Avg ${Math.round(avgPrice).toLocaleString()}</span>}
        {avgDom !== undefined && avgDom > 0 && <span>Avg {Math.round(avgDom)} DOM</span>}
      </div>
    </div>
  );
}
