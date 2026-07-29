import type { Heading } from '@/lib/blog-content';

interface Props {
  headings: Heading[];
}

// Sticky TOC for desktop sidebar.
export function TocDesktop({ headings }: Props) {
  if (!headings.length) return null;
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        On this page
      </p>
      <ol className="space-y-1.5 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="block border-l-2 border-transparent -ml-px pl-3 py-1 text-text-muted hover:text-accent-blue hover:border-accent-blue/60 transition-colors leading-snug"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Collapsible TOC for mobile.
export function TocMobile({ headings }: Props) {
  if (!headings.length) return null;
  return (
    <details className="lg:hidden group my-6 rounded-xl border border-border bg-surface print:hidden">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          On this page
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
      <ol className="border-t border-border px-4 pb-3 pt-2 space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="block py-1 text-text-muted hover:text-accent-blue transition-colors"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
