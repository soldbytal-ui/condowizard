'use client';

import type { MapProject } from './TorontoMap';

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch',
  PRE_CONSTRUCTION: 'Pre-Construction',
  UNDER_CONSTRUCTION: 'Under Construction',
  NEAR_COMPLETION: 'Near Completion',
  COMPLETED: 'Completed',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  PRE_LAUNCH: 'bg-accent-green',
  PRE_CONSTRUCTION: 'bg-accent-green',
  UNDER_CONSTRUCTION: 'bg-accent-blue',
  NEAR_COMPLETION: 'bg-accent-orange',
  COMPLETED: 'bg-accent-gray',
};

function formatPrice(val: number | null) {
  if (!val) return 'TBD';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${(val / 1000).toFixed(0)}K`;
}

type Props = {
  info: { x: number; y: number; object: MapProject };
};

export default function MapTooltip({ info }: Props) {
  const { x, y, object: p } = info;

  return (
    <div
      className="glass-panel-dark rounded-xl px-4 py-3 pointer-events-none absolute z-10 min-w-[200px]"
      style={{ left: x + 12, top: y - 12, transform: 'translateY(-100%)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[p.status] || 'bg-accent-gray'}`} />
        <span className="text-xs text-text-muted">{STATUS_LABELS[p.status] || p.status}</span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary leading-tight">{p.name}</h3>
      {p.neighborhood && (
        <p className="text-xs text-text-muted mt-0.5">{p.neighborhood.name}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs">
        {p.floors && (
          <span className="text-text-muted">
            <span className="text-text-primary font-mono font-medium">{p.floors}</span> floors
          </span>
        )}
        {p.priceMin && (
          <span className="text-accent-blue font-mono font-medium">
            From {formatPrice(p.priceMin)}
          </span>
        )}
      </div>
    </div>
  );
}
