interface StatTileProps {
  label: string;
  value: string;
  delta?: { text: string; positive: boolean; neutral: boolean } | null;
  deltaCaption?: string;
  accent?: 'default' | 'blue';
  loading?: boolean;
}

export default function StatTile({
  label,
  value,
  delta,
  deltaCaption,
  accent = 'default',
  loading = false,
}: StatTileProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
        <div className="h-3 w-20 bg-surface2 rounded" />
        <div className="mt-3 h-8 w-28 bg-surface2 rounded" />
        <div className="mt-3 h-3 w-16 bg-surface2 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={`mt-2 font-serif text-3xl font-bold leading-none ${
          accent === 'blue' ? 'text-accent-blue' : 'text-text-primary'
        }`}
      >
        {value}
      </p>
      {delta ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
              delta.neutral
                ? 'bg-surface2 text-text-muted'
                : delta.positive
                ? 'bg-accent-green/10 text-accent-green'
                : 'bg-surface2 text-text-muted'
            }`}
          >
            {delta.text}
          </span>
          {deltaCaption ? <span className="text-text-muted">{deltaCaption}</span> : null}
        </div>
      ) : deltaCaption ? (
        <p className="mt-3 text-xs text-text-muted">{deltaCaption}</p>
      ) : (
        <div className="mt-3 h-4" />
      )}
    </div>
  );
}
