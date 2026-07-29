import type { TimelineStage } from '@/lib/blog-content';

interface Props {
  stages: TimelineStage[];
}

export default function TimelineBlock({ stages }: Props) {
  if (!stages.length) return null;
  return (
    <section aria-label="Pre-construction closing timeline" className="my-10">
      <ol className="grid gap-4 md:grid-cols-5">
        {stages.map((stage, i) => (
          <li
            key={i}
            className="relative rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-[11px] font-semibold text-accent-blue"
              >
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-text-primary leading-tight">{stage.label}</p>
            </div>
            {stage.meta && (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-muted">
                {stage.meta}
              </p>
            )}
            {stage.obligations?.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-text-primary">
                {stage.obligations.map((o, oi) => (
                  <li key={oi} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-blue/70"
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
