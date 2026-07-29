export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema, generateWebSiteSchema } from '@/lib/seo';
import { readingTime } from '@/lib/blog-content';
import BlogIndexClient, { type IndexPost } from '@/components/blog/BlogIndexClient';

export const metadata: Metadata = {
  title: 'Toronto Pre-Construction Buyer Guides | CondoWizard Blog',
  description:
    'Original Toronto pre-construction buyer guides on closing costs, HST rebates, deposits, interim occupancy, assignments, Tarion rights, and neighbourhood market context.',
  alternates: { canonical: 'https://condowizard.ca/blog' },
  openGraph: {
    title: 'Toronto Pre-Construction Buyer Guides | CondoWizard',
    description:
      'Original Toronto pre-construction buyer guides — closing costs, HST rebates, deposits, interim occupancy, assignments, Tarion rights.',
    url: 'https://condowizard.ca/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toronto Pre-Construction Buyer Guides | CondoWizard',
    description:
      'Original Toronto pre-construction buyer guides — closing costs, HST rebates, deposits, interim occupancy, assignments, Tarion rights.',
  },
};

function extractExcerpt(post: any): string {
  if (post.excerpt && post.excerpt !== '---' && post.excerpt.length > 10) return post.excerpt;
  if (!post.content) return '';
  const lines = post.content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('|') || t.startsWith('>') || t.startsWith('---')) continue;
    if (t.length < 60) continue;
    return t.replace(/\*\*/g, '').slice(0, 220);
  }
  return '';
}

function toIndexPost(post: any): IndexPost {
  const rt = readingTime(post.content || '');
  return {
    slug: post.slug,
    title: post.title,
    excerpt: extractExcerpt(post),
    category: post.category || 'BUYER GUIDE',
    author: post.author || 'Tal Shelef',
    publishedAt: post.publishedAt || null,
    readingLabel: rt.label,
    featuredImage: post.featuredImage || null,
  };
}

export default async function BlogIndexPage() {
  const { data: rows } = await supabase
    .from('blog_posts')
    .select('*')
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false });

  const all = (rows || []).map(toIndexPost);
  const featured = all[0] || null;
  const rest = all.slice(1);
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean)));

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Blog', url: 'https://condowizard.ca/blog' },
  ]);
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div className="border-b border-border bg-gradient-to-b from-surface2/60 via-surface2/20 to-transparent">
        <div className="container-main max-w-6xl pt-24 pb-10 md:pt-28 md:pb-12">
          <div className="max-w-3xl">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
              CondoWizard Insights
            </span>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-text-primary">
              Toronto pre-construction buyer guides
            </h1>
            <p className="mt-4 text-lg text-text-muted leading-relaxed max-w-2xl">
              Original guides on closing costs, HST rebates, deposits, interim occupancy,
              assignments, Tarion rights, and Toronto neighbourhood context. Written by Tal
              Shelef and reviewed against primary sources.
            </p>
          </div>
        </div>
      </div>

      <div className="container-main max-w-6xl pb-16">
        {all.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center text-text-muted">
            No guides published yet.
          </div>
        ) : (
          <BlogIndexClient featured={featured} posts={rest} categories={categories} />
        )}

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-border bg-surface p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Working on a specific project?
            </p>
            <h2 className="mt-1 text-xl md:text-2xl font-semibold text-text-primary">
              We can walk your APS through with you before you sign
            </h2>
            <p className="mt-2 text-sm text-text-muted max-w-2xl">
              Send a price list, floor plan, or purchase agreement and CondoWizard will help
              you identify the questions to raise with your lawyer during the cooling-off
              period.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/contact-us"
              className="inline-flex items-center rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              Contact Tal
            </Link>
            <Link
              href="/new-condos"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
            >
              Browse projects
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
