'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface IndexPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string | null;
  readingLabel: string;
  featuredImage: string | null;
}

interface Props {
  featured: IndexPost | null;
  posts: IndexPost[];
  categories: string[];
}

const PAGE_SIZE = 9;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.includes('Z') ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlogIndexClient({ featured, posts, categories }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [posts, query, category]);

  const showFeatured = category === 'all' && !query.trim() && featured;
  const listSlice = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  return (
    <>
      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setVisible(PAGE_SIZE);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
              category === 'all'
                ? 'border-accent-blue bg-accent-blue text-white'
                : 'border-border bg-surface text-text-muted hover:border-accent-blue/40 hover:text-accent-blue'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setVisible(PAGE_SIZE);
              }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                category === c
                  ? 'border-accent-blue bg-accent-blue text-white'
                  : 'border-border bg-surface text-text-muted hover:border-accent-blue/40 hover:text-accent-blue'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="relative w-full md:w-72">
          <span className="sr-only">Search guides</span>
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search guides"
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          />
        </label>
      </div>

      {/* Featured */}
      {showFeatured && (
        <Link
          href={`/blog/${featured!.slug}`}
          className="group mt-8 block overflow-hidden rounded-3xl border border-border bg-surface"
        >
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative min-h-[240px] md:min-h-[320px] bg-gradient-to-br from-accent-blue/15 via-accent-blue/5 to-transparent">
              {featured!.featuredImage ? (
                <img
                  src={featured!.featuredImage}
                  alt=""
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-10">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-accent-blue/25" aria-hidden="true">
                    <path d="M3 21h18M3 7v14m4-14v14m4-14v14m4-14v14m4-14v14M1 10l11-7 11 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
                  Featured · {featured!.category}
                </span>
              </div>
              <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold leading-tight text-text-primary group-hover:text-accent-blue transition-colors">
                {featured!.title}
              </h2>
              {featured!.excerpt && (
                <p className="mt-3 text-[15px] md:text-base text-text-muted line-clamp-3 leading-relaxed">
                  {featured!.excerpt}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span className="font-medium text-text-primary">
                  {(featured!.author || '').split(',')[0]}
                </span>
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-text-muted/40" />
                <span>{formatDate(featured!.publishedAt)}</span>
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-text-muted/40" />
                <span>{featured!.readingLabel}</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="mt-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {category === 'all' && !query ? 'Latest guides' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
          </h2>
        </div>

        {listSlice.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-text-muted">
            No guides match that search. Try clearing the filter or search another term.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listSlice.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-6 hover:border-accent-blue/30 transition-colors"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
                  {p.category}
                </span>
                <h3 className="mt-2 text-[17px] font-semibold leading-snug text-text-primary group-hover:text-accent-blue transition-colors">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-3 flex-1">
                    {p.excerpt}
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {(p.author || '').split(',')[0]}
                    </span>
                    <span aria-hidden="true" className="w-1 h-1 rounded-full bg-text-muted/40" />
                    <span>{formatDate(p.publishedAt)}</span>
                  </div>
                  <span>{p.readingLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
            >
              Show more guides
            </button>
          </div>
        )}
      </div>
    </>
  );
}
