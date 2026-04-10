'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AirbnbBuilding } from '@/data/airbnb-buildings';

interface Props { buildings: AirbnbBuilding[]; }

function regColor(n: number) {
  if (n >= 100) return 'bg-red-500';
  if (n >= 50) return 'bg-orange-500';
  if (n >= 10) return 'bg-yellow-500';
  return 'bg-blue-300';
}

function regTextColor(n: number) {
  if (n >= 100) return 'text-red-600';
  if (n >= 50) return 'text-orange-600';
  if (n >= 10) return 'text-yellow-600';
  return 'text-blue-500';
}

export default function AirbnbClient({ buildings }: Props) {
  const [search, setSearch] = useState('');
  const [ward, setWard] = useState('');
  const [minReg, setMinReg] = useState(0);
  const [sort, setSort] = useState('registrations');

  const wards = useMemo(() => [...new Set(buildings.map((b) => b.ward))].sort(), [buildings]);

  const filtered = useMemo(() => {
    let list = [...buildings];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.address.toLowerCase().includes(q) || b.buildingName?.toLowerCase().includes(q) || b.neighbourhood.toLowerCase().includes(q));
    }
    if (ward) list = list.filter((b) => b.ward === ward);
    if (minReg > 0) list = list.filter((b) => b.registrations >= minReg);
    if (sort === 'registrations') list.sort((a, b) => b.registrations - a.registrations);
    else if (sort === 'alpha') list.sort((a, b) => a.address.localeCompare(b.address));
    return list;
  }, [buildings, search, ward, minReg, sort]);

  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input type="text" placeholder="Search by address or building name..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-lg w-64" />
          <select value={ward} onChange={(e) => setWard(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted">
            <option value="">All Wards</option>
            {wards.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={minReg} onChange={(e) => setMinReg(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted">
            <option value={0}>Any registrations</option>
            <option value={5}>5+ registrations</option>
            <option value={10}>10+ registrations</option>
            <option value={25}>25+ registrations</option>
            <option value={50}>50+ registrations</option>
            <option value={100}>100+ registrations</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-lg text-text-muted">
            <option value="registrations">Most Registrations</option>
            <option value="alpha">Alphabetical</option>
          </select>
          <span className="text-sm text-text-muted">{filtered.length} buildings</span>
        </div>

        {/* Building cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b, i) => (
            <Link key={b.slug} href={`/airbnb-friendly/${b.slug}`} className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-accent-blue/30 transition-all">
              {/* Static map image as building photo fallback */}
              <div className="relative h-36 bg-surface2 overflow-hidden">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+FBBF24(${b.lng},${b.lat})/${b.lng},${b.lat},15,0/400x200@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt={b.address}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded">#{i + 1}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-bold text-white ${regColor(b.registrations)} px-2 py-1 rounded`}>{b.registrations} STR</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                  {b.buildingName || b.address}
                </h3>
                {b.buildingName && <p className="text-xs text-text-muted">{b.address}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-text-muted">{b.neighbourhood}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{b.ward}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`font-serif text-lg font-bold ${regTextColor(b.registrations)}`}>{b.registrations}</span>
                  <span className="text-xs text-text-muted">Airbnb registrations</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
