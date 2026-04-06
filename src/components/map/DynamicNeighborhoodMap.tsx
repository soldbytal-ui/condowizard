'use client';

import dynamic from 'next/dynamic';

const NeighborhoodMiniMap = dynamic(() => import('./NeighborhoodMiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-2xl border border-border bg-surface2 animate-pulse flex items-center justify-center">
      <span className="text-text-muted/30 text-sm">Loading map...</span>
    </div>
  ),
});

export default NeighborhoodMiniMap;
