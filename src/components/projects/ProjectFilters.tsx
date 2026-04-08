'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Neighborhood = { id: string; name: string; slug: string };

export default function ProjectFilters({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`/new-condos?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selectClass = "px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors appearance-none";

  return (
    <div className="card p-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search projects..."
          defaultValue={searchParams.get('q') || ''}
          onChange={(e) => updateParam('q', e.target.value)}
          className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
        />
        <select defaultValue={searchParams.get('neighborhood') || ''} onChange={(e) => updateParam('neighborhood', e.target.value)} className={selectClass}>
          <option value="">All Neighbourhoods</option>
          {neighborhoods.map((n) => <option key={n.id} value={n.slug}>{n.name}</option>)}
        </select>
        <select defaultValue={searchParams.get('status') || ''} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="PRE_LAUNCH">Pre-Launch</option>
          <option value="PRE_CONSTRUCTION">Pre-Construction</option>
          <option value="UNDER_CONSTRUCTION">Under Construction</option>
          <option value="NEAR_COMPLETION">Near Completion</option>
        </select>
        <select defaultValue={searchParams.get('category') || ''} onChange={(e) => updateParam('category', e.target.value)} className={selectClass}>
          <option value="">All Categories</option>
          <option value="ULTRA_LUXURY">Ultra-Luxury</option>
          <option value="LUXURY_BRANDED">Luxury Branded</option>
          <option value="LUXURY">Luxury</option>
          <option value="PREMIUM">Premium</option>
          <option value="AFFORDABLE_LUXURY">Affordable Luxury</option>
        </select>
        <select defaultValue={searchParams.get('sort') || ''} onChange={(e) => updateParam('sort', e.target.value)} className={selectClass}>
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="units_desc">Most Units</option>
        </select>
      </div>
    </div>
  );
}
