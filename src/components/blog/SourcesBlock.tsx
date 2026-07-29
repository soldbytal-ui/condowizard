import type { SourceEntry } from '@/lib/blog-content';

interface Props {
  items: SourceEntry[];
  accessDate: string;
}

export default function SourcesBlock({ items, accessDate }: Props) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="sources-heading" className="my-10">
      <details className="rounded-2xl border border-border bg-surface open:bg-surface2/30 transition" open>
        <summary
          id="sources-heading"
          className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-text-primary marker:hidden [&::-webkit-details-marker]:hidden"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Official sources ({items.length})
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform group-open:rotate-180"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <ul className="divide-y divide-border border-t border-border">
          {items.map((s, i) => (
            <li key={i} className="px-5 py-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                {s.org}
              </p>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-flex items-start gap-1.5 text-[15px] font-medium text-text-primary hover:text-accent-blue transition-colors"
              >
                <span>{s.title}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="mt-1 shrink-0"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <p className="mt-1 text-xs text-text-muted">
                {s.updated ? `Published or updated: ${s.updated}. ` : ''}
                Accessed: {accessDate}.
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
