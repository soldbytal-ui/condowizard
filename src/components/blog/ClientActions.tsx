'use client';

import { useState } from 'react';

interface Props {
  title: string;
  url: string;
}

export default function ClientActions({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const print = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={share}
        aria-label="Share this article"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? 'Link copied' : 'Share'}
      </button>
      <button
        type="button"
        onClick={print}
        aria-label="Print or save as PDF"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </button>
    </div>
  );
}
