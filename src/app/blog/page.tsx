export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Toronto Pre-Construction Blog | Market Reports & Guides',
  description: 'Expert insights on Toronto pre-construction condos. Buyer guides, market reports, neighborhood comparisons, investment analysis, and more.',
  alternates: {
    canonical: 'https://condowizard.ca/blog',
  },
  openGraph: {
    title: 'Toronto Pre-Construction Blog | Market Reports & Guides',
    description: 'Expert insights on Toronto pre-construction condos. Buyer guides, market reports, neighborhood comparisons, and investment analysis.',
    url: 'https://condowizard.ca/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toronto Pre-Construction Blog | Market Reports & Guides',
    description: 'Expert insights on Toronto pre-construction condos. Buyer guides, market reports, and investment analysis.',
  },
};

function cleanKeyword(kw: string | null) {
  if (!kw) return null;
  return kw.replace(/^\*+\s*/, '').trim();
}

function getReadingTime(content: string | null) {
  if (!content) return '5 min read';
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 250))} min read`;
}

function getExcerpt(post: any) {
  // If excerpt is just "---" or empty, extract from content
  if (!post.excerpt || post.excerpt === '---' || post.excerpt.length < 10) {
    if (!post.content) return '';
    // Strip markdown frontmatter-like lines and get first real paragraph
    const lines = post.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('**Meta') &&
        !trimmed.startsWith('**Target') &&
        !trimmed.startsWith('**Slug') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('|') &&
        trimmed.length > 60
      ) {
        return trimmed.replace(/\*\*/g, '').slice(0, 200) + '...';
      }
    }
    return '';
  }
  return post.excerpt;
}

// Generate a gradient based on post index for visual variety
const GRADIENTS = [
  'from-accent-blue/20 to-accent-blue/5',
  'from-blue-500/20 to-blue-500/5',
  'from-purple-500/20 to-purple-500/5',
  'from-orange-500/20 to-orange-500/5',
  'from-pink-500/20 to-pink-500/5',
  'from-cyan-500/20 to-cyan-500/5',
  'from-emerald-500/20 to-emerald-500/5',
  'from-amber-500/20 to-amber-500/5',
];

const ICONS = [
  // Building
  'M3 21h18M3 7v14m4-14v14m4-14v14m4-14v14m4-14v14M1 10l11-7 11 7',
  // Chart
  'M3 3v18h18M9 17V9m4 8V5m4 12v-4',
  // Map
  'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  // Dollar
  'M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7',
  // Key
  'M15 7h3a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h3m4-4v4m0 0l-2-2m2 2l2-2',
  // Star
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  // Globe
  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  // Home
  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
];

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false });

  const allPosts = posts || [];
  const featured = allPosts[0];
  const rest = allPosts.slice(1);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Blog', url: 'https://condowizard.ca/blog' },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    <div className="container-main pt-24 pb-16">
      {/* Hero Header */}
      <div className="mb-12 max-w-2xl">
        <span className="text-accent-blue text-sm font-medium uppercase tracking-wider">Insights & Guides</span>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2">
          Toronto Pre-Construction Blog
        </h1>
        <p className="text-text-muted mt-4 text-lg leading-relaxed">
          Expert market analysis, buyer guides, neighborhood deep-dives, and investment strategies for Greater Toronto Area pre-construction condos.
        </p>
      </div>

      {/* Featured Post */}
      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="block mb-12 group"
        >
          <div className="card overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="min-h-[280px] overflow-hidden">
              {featured.featuredImage ? (
                <img src={featured.featuredImage} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[0]} flex items-center justify-center p-12`}>
                  <svg className="w-24 h-24 text-accent-blue/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={ICONS[0]} />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-medium text-bg bg-accent-blue px-2.5 py-1 rounded-full">Featured</span>
                {cleanKeyword(featured.targetKeyword) && (
                  <span className="text-xs text-accent-blue/80 font-medium uppercase tracking-wider">
                    {cleanKeyword(featured.targetKeyword)}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary group-hover:text-accent-blue transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-text-muted mt-3 leading-relaxed line-clamp-3">
                {getExcerpt(featured)}
              </p>
              <div className="flex items-center gap-4 mt-6 text-sm text-text-muted/60">
                <span>{featured.author}</span>
                <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                {featured.publishedAt && (
                  <span>{new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                <span>{getReadingTime(featured.content)}</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((post: any, i: number) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="card group hover:border-accent-blue/30 transition-all flex flex-col"
          >
            {/* Image */}
            <div className="h-48 overflow-hidden">
              {post.featuredImage ? (
                <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[(i + 1) % GRADIENTS.length]} flex items-center justify-center`}>
                  <svg className="w-14 h-14 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d={ICONS[(i + 1) % ICONS.length]} />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
              {cleanKeyword(post.targetKeyword) && (
                <span className="inline-block text-xs text-accent-blue font-medium uppercase tracking-wider mb-2 self-start">
                  {cleanKeyword(post.targetKeyword)}
                </span>
              )}
              <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors leading-tight">
                {post.title}
              </h2>
              <p className="text-text-muted text-sm mt-2 line-clamp-3 flex-1">
                {getExcerpt(post)}
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted/60">
                <div className="flex items-center gap-2">
                  {post.publishedAt && (
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                  <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                  <span>{getReadingTime(post.content)}</span>
                </div>
                <span className="text-accent-blue group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {allPosts.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <p>Blog posts coming soon.</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="card p-10 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary">Stay Updated on Toronto Pre-Construction</h2>
          <p className="text-text-muted mt-3 text-sm">Get notified about new project launches, market reports, and exclusive pre-sale access.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/contact-us" className="btn-primary">Get in Touch</Link>
            <Link href="/new-condos" className="btn-secondary">Browse Projects</Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
