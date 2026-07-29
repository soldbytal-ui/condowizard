// Prominent summary panel that surfaces the illustrative $850,000 worked
// example above the fold on the closing-costs page. Only renders when the
// caller passes the summary payload — every other buyer guide gets nothing.

export interface SummaryLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface Props {
  title?: string;
  lines: SummaryLine[];
  footnote?: string;
}

export default function SummaryPanel({ title = 'Illustrative example', lines, footnote }: Props) {
  if (!lines.length) return null;
  return (
    <section
      aria-label={title}
      className="mt-6 rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-blue">
            {title}
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold text-text-primary">
            $850,000 downtown Toronto suite · Canadian resident first-time buyer
          </p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`flex items-baseline justify-between border-b border-border pb-3 ${
              line.emphasis ? 'sm:col-span-2 mt-2 border-b-0 border-t border-accent-blue/30 bg-accent-blue/5 rounded-lg px-3 pt-3 pb-3' : ''
            }`}
          >
            <dt className={`text-sm ${line.emphasis ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
              {line.label}
            </dt>
            <dd className={`text-sm tabular-nums ${line.emphasis ? 'text-lg font-bold text-accent-blue' : 'font-medium text-text-primary'}`}>
              {line.value}
            </dd>
          </div>
        ))}
      </dl>
      {footnote && (
        <p className="mt-5 text-xs leading-relaxed text-text-muted">{footnote}</p>
      )}
    </section>
  );
}
