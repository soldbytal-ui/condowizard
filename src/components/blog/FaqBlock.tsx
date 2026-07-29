import ReactMarkdown from 'react-markdown';

interface Props {
  items: { q: string; a: string }[];
}

export default function FaqBlock({ items }: Props) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="my-10">
      <h2 id="faq-heading" className="mt-12 mb-4 pb-2 border-b border-border text-2xl font-bold text-text-primary">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((it, i) => (
          <details key={i} className="group px-5 py-4 open:bg-surface2/40 transition">
            <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15.5px] font-semibold text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="leading-snug">{it.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-text-muted transition-transform group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="mt-3 text-[15px] leading-relaxed text-text-muted [&_a]:text-accent-blue [&_a:hover]:underline">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                }}
              >
                {it.a}
              </ReactMarkdown>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
