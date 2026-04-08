'use client';

import { useState } from 'react';
import { ListingFilters, BuildingType, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS, countAdvancedFilters } from '@/types/listing';
import AdvancedFilters from './AdvancedFilters';

interface SearchFiltersProps {
  filters: ListingFilters;
  onFilterChange: (filters: Partial<ListingFilters>) => void;
  totalCount: number;
  avgPrice?: number;
  avgDom?: number;
  medianSoldPrice?: number;
}

function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function SearchFilters({ filters, onFilterChange, totalCount, avgPrice, avgDom, medianSoldPrice }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  const isSold = filters.tab === 'sold';
  const isRent = filters.tab === 'rent';
  const advancedCount = countAdvancedFilters(filters);

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

  const sortOptions = isSold
    ? [
        { label: 'Sold Date (Newest)', value: 'newest' as const },
        { label: 'Sold Price: Low to High', value: 'price_asc' as const },
        { label: 'Sold Price: High to Low', value: 'price_desc' as const },
        { label: 'Largest', value: 'largest' as const },
      ]
    : [
        { label: 'Newest', value: 'newest' as const },
        { label: 'Price: Low to High', value: 'price_asc' as const },
        { label: 'Price: High to Low', value: 'price_desc' as const },
        { label: 'Largest', value: 'largest' as const },
      ];

  const buildingTypes: BuildingType[] = ['low-rise', 'mid-rise', 'high-rise', 'loft', 'luxury', 'precon'];

  const soldDateRanges = [
    { label: '30d', value: '30' },
    { label: '90d', value: '90' },
    { label: '6mo', value: '180' },
    { label: '1yr', value: '365' },
    { label: '2yr', value: '730' },
    { label: 'Custom', value: 'custom' },
  ];

  function handleSoldDateRange(value: string) {
    if (value === 'custom') {
      onFilterChange({ soldDateRange: 'custom' });
    } else {
      const days = parseInt(value);
      onFilterChange({
        soldDateRange: value,
        soldDateMin: daysAgoDate(days),
        soldDateMax: undefined,
        page: 1,
      });
    }
  }

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

      {/* Sold date range bar */}
      {isSold && (
        <div className="px-4 py-2 flex flex-wrap items-center gap-2 border-b border-border bg-surface">
          <span className="text-xs text-text-muted font-medium">Sold within:</span>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {soldDateRanges.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSoldDateRange(opt.value)}
                className={`px-3 py-1 text-xs transition-colors ${
                  filters.soldDateRange === opt.value
                    ? 'bg-accent-blue text-white'
                    : 'text-text-muted hover:bg-surface2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {filters.soldDateRange === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={filters.soldDateMin || ''} onChange={(e) => onFilterChange({ soldDateMin: e.target.value || undefined, page: 1 })} className="px-2 py-1 text-xs border border-border rounded-lg" />
              <span className="text-xs text-text-muted">to</span>
              <input type="date" value={filters.soldDateMax || ''} onChange={(e) => onFilterChange({ soldDateMax: e.target.value || undefined, page: 1 })} className="px-2 py-1 text-xs border border-border rounded-lg" />
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2">
        {/* Price dropdown */}
        <div className="relative">
          <button
            onClick={() => { setPriceOpen(!priceOpen); setSizeOpen(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              filters.priceMin || filters.priceMax ? 'border-accent-blue text-accent-blue bg-accent-blue/5' : 'border-border text-text-muted hover:border-accent-blue/30'
            }`}
          >
            {filters.priceMin || filters.priceMax
              ? `$${filters.priceMin ? (filters.priceMin / 1000).toFixed(0) + 'K' : '0'} - $${filters.priceMax ? (filters.priceMax / 1000).toFixed(0) + 'K' : 'Any'}`
              : 'Price'}
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {priceOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border p-4 z-20 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted">Min Price</label>
                  <input type="number" placeholder="No min" value={filters.priceMin || ''} onChange={(e) => onFilterChange({ priceMin: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Max Price</label>
                  <input type="number" placeholder="No max" value={filters.priceMax || ''} onChange={(e) => onFilterChange({ priceMax: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <button onClick={() => setPriceOpen(false)} className="w-full py-2 bg-accent-blue text-white rounded-lg text-sm font-medium">Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Size dropdown */}
        <div className="relative">
          <button
            onClick={() => { setSizeOpen(!sizeOpen); setPriceOpen(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              filters.sqftMin || filters.sqftMax ? 'border-accent-blue text-accent-blue bg-accent-blue/5' : 'border-border text-text-muted hover:border-accent-blue/30'
            }`}
          >
            Size
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {sizeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border p-4 z-20 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted">Min Sqft</label>
                  <input type="number" placeholder="No min" value={filters.sqftMin || ''} onChange={(e) => onFilterChange({ sqftMin: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Max Sqft</label>
                  <input type="number" placeholder="No max" value={filters.sqftMax || ''} onChange={(e) => onFilterChange({ sqftMax: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" />
                </div>
                <button onClick={() => setSizeOpen(false)} className="w-full py-2 bg-accent-blue text-white rounded-lg text-sm font-medium">Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Beds */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {bedOptions.map((opt) => (
            <button key={opt.label} onClick={() => onFilterChange({ bedsMin: opt.value })}
              className={`px-3 py-2 text-sm transition-colors ${filters.bedsMin === opt.value ? 'bg-accent-blue text-white' : 'text-text-muted hover:bg-surface2'}`}
            >{opt.label}</button>
          ))}
        </div>

        {/* Baths */}
        <select value={filters.bathsMin || ''} onChange={(e) => onFilterChange({ bathsMin: e.target.value ? parseInt(e.target.value) : undefined })} className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted">
          <option value="">Baths</option>
          <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
        </select>

        {/* More+ button with badge */}
        <button
          onClick={() => setShowAdvanced(true)}
          className={`relative px-3 py-2 text-sm border rounded-lg transition-colors ${
            advancedCount > 0 ? 'border-accent-blue text-accent-blue bg-accent-blue/5' : 'border-border text-text-muted hover:border-accent-blue/30'
          }`}
        >
          More+
          {advancedCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {advancedCount}
            </span>
          )}
        </button>

        <div className="flex-1" />

        {/* Sort */}
        <select value={filters.sortBy || 'newest'} onChange={(e) => onFilterChange({ sortBy: e.target.value as ListingFilters['sortBy'] })} className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted">
          {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        {/* Get Alerts */}
        <button className="px-4 py-2 text-sm font-medium bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors">
          Get Alerts
        </button>
      </div>

      {/* Building type legend */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-3">
        {buildingTypes.map((bt) => {
          const active = !filters.buildingTypes?.length || filters.buildingTypes.includes(bt);
          return (
            <button key={bt} onClick={() => {
              const curr = filters.buildingTypes || [];
              if (!curr.length) onFilterChange({ buildingTypes: [bt] });
              else if (curr.includes(bt)) {
                const remaining = curr.filter((t) => t !== bt);
                onFilterChange({ buildingTypes: remaining.length ? remaining : undefined });
              } else onFilterChange({ buildingTypes: [...curr, bt] });
            }} className={`flex items-center gap-1.5 text-xs transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BUILDING_TYPE_COLORS[bt] }} />
              {BUILDING_TYPE_LABELS[bt]}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="px-4 pb-2 flex items-center gap-4 text-xs text-text-muted">
        <span className="font-medium text-text-primary">{totalCount.toLocaleString()} {isSold ? 'sold' : isRent ? 'rental' : ''} listings</span>
        {isSold && filters.soldDateMin && (
          <span>from {filters.soldDateMin}</span>
        )}
        {avgPrice != null && avgPrice > 0 && <span>Avg ${Math.round(avgPrice).toLocaleString()}</span>}
        {medianSoldPrice != null && medianSoldPrice > 0 && <span>Median Sold ${Math.round(medianSoldPrice).toLocaleString()}</span>}
        {avgDom != null && avgDom > 0 && <span>Avg {Math.round(avgDom)} DOM</span>}
      </div>

      {/* Advanced filters modal */}
      {showAdvanced && (
        <AdvancedFilters filters={filters} onFilterChange={onFilterChange} onClose={() => setShowAdvanced(false)} />
      )}
    </div>
  );
}
