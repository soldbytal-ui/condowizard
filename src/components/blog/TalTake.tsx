import ReactMarkdown from 'react-markdown';

interface Props {
  value: string;
  authorName?: string;
  authorTitle?: string;
}

export default function TalTake({
  value,
  authorName = 'Tal Shelef',
  authorTitle = 'Sales Representative, Rare Real Estate Inc., Brokerage',
}: Props) {
  return (
    <aside
      role="note"
      aria-label="Tal's Take"
      className="my-8 rounded-2xl border border-border bg-surface p-6 md:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/10 text-sm font-semibold text-accent-blue">
          TS
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary leading-tight">Tal's Take</p>
          <p className="text-xs text-text-muted leading-tight">{authorName} · {authorTitle}</p>
        </div>
      </div>
      <div className="mt-4 border-l-2 border-accent-blue/50 pl-4 text-[15px] italic leading-relaxed text-text-primary">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="m-0">{children}</p>,
          }}
        >
          {value}
        </ReactMarkdown>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-widest text-text-muted">
        Professional general commentary. Not legal or tax advice.
      </p>
    </aside>
  );
}
