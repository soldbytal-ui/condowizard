import ReactMarkdown from 'react-markdown';

interface TakeawaysProps {
  items: string[];
}

export function Takeaways({ items }: TakeawaysProps) {
  if (!items.length) return null;
  return (
    <aside
      aria-label="Key takeaways"
      className="my-8 rounded-2xl border border-border bg-surface p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-blue">
        Key takeaways
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-text-primary">
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue"
            />
            <span className="[&_strong]:text-text-primary">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <>{children}</>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-accent-blue hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {item}
              </ReactMarkdown>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

interface WarningProps {
  value: string;
}

export function Warning({ value }: WarningProps) {
  return (
    <aside
      role="note"
      aria-label="Important note"
      className="my-6 flex gap-3 rounded-xl border border-accent-orange/30 bg-accent-orange/5 p-5"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-accent-orange"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="text-[15px] leading-relaxed text-text-primary">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="m-0">{children}</p>,
          }}
        >
          {value}
        </ReactMarkdown>
      </div>
    </aside>
  );
}

interface ChecklistProps {
  items: string[];
}

export function Checklist({ items }: ChecklistProps) {
  if (!items.length) return null;
  return (
    <div className="my-6 rounded-2xl border border-border bg-surface p-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        Buyer checklist
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-text-primary">
            <span
              aria-hidden="true"
              className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 border-accent-blue/40"
            />
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                a: ({ href, children }) => (
                  <a href={href} className="text-accent-blue hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {item}
            </ReactMarkdown>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ExampleProps {
  title?: string;
  assumptions: string[];
}

export function ExampleAssumptions({ title, assumptions }: ExampleProps) {
  if (!assumptions.length) return null;
  return (
    <aside
      aria-label="Illustrative example"
      className="my-6 rounded-2xl border border-accent-blue/20 bg-accent-blue/[0.04] p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-blue">
        Illustrative example
      </p>
      {title && <p className="mt-2 text-sm italic text-text-muted">{title}</p>}
      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-primary">
        {assumptions.map((a, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-blue/60" />
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
