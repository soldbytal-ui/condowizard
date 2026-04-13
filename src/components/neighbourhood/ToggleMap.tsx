'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { UnifiedListing } from '@/types/listing';

const ResaleMiniMap = dynamic(() => import('./ResaleMiniMap'), { ssr: false, loading: () => <div className="h-72 md:h-96 rounded-xl bg-surface2 animate-pulse" /> });
const PreconMiniMap = dynamic(() => import('./PreconMiniMap'), { ssr: false, loading: () => <div className="h-72 md:h-96 rounded-xl bg-gray-800 animate-pulse" /> });

interface PreconProject {
  name: string; slug: string; lat: number; lng: number;
  floors: number | null; priceMin: number | null; developer: string | null; image: string | null;
}

interface Props {
  listings: UnifiedListing[];
  preconProjects: PreconProject[];
  boundary: number[][][] | null;
  neighbourhoodName: string;
}

export default function ToggleMap({ listings, preconProjects, boundary, neighbourhoodName }: Props) {
  const [mode, setMode] = useState<'resale' | 'precon'>(listings.length > 0 ? 'resale' : 'precon');

  const hasResale = listings.length > 0;
  const hasPrecon = preconProjects.length > 0;

  if (!hasResale && !hasPrecon) return null;

  return (
    <div className="relative">
      {/* Toggle buttons */}
      {hasResale && hasPrecon && (
        <div className="absolute top-3 left-3 z-10 flex bg-white rounded-lg shadow-md overflow-hidden border border-border">
          <button onClick={() => setMode('resale')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'resale' ? 'bg-accent-blue text-white' : 'text-text-muted hover:bg-surface2'}`}>
            Resale
          </button>
          <button onClick={() => setMode('precon')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'precon' ? 'bg-accent-blue text-white' : 'text-text-muted hover:bg-surface2'}`}>
            Pre-Construction
          </button>
        </div>
      )}

      {mode === 'resale' && hasResale && (
        <ResaleMiniMap listings={listings} boundary={boundary} neighbourhoodName={neighbourhoodName} />
      )}
      {mode === 'precon' && hasPrecon && (
        <PreconMiniMap projects={preconProjects} boundary={boundary} neighbourhoodName={neighbourhoodName} />
      )}
    </div>
  );
}
