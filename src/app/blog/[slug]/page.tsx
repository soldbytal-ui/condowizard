export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import {
  parseArticle,
  extractHeadings,
  extractFaqSchemaItems,
  stripRedundantSections,
  readingTime,
} from '@/lib/blog-content';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from '@/lib/seo';
import ArticleBody from '@/components/blog/ArticleBody';
import { TocDesktop, TocMobile } from '@/components/blog/TableOfContents';
import AuthorCard from '@/components/blog/AuthorCard';
import ClientActions from '@/components/blog/ClientActions';
import HeroCostGraphic from '@/components/blog/HeroCostGraphic';
import SummaryPanel, { type SummaryLine } from '@/components/blog/SummaryPanel';

type Props = { params: Promise<{ slug: string }> };

const AUTHOR_IMAGE_SRC: string | null = null;

const SUMMARY_PANELS: Record<
  string,
  { lines: SummaryLine[]; footnote: string; showHeroGraphic?: boolean }
> = {
  'pre-construction-condo-closing-costs-toronto': {
    lines: [
      { label: 'Purchase price', value: '$850,000' },
      { label: 'Deposit already paid (20%)', value: '$170,000' },
      { label: 'Est. combined LTT (net FTHB rebates)', value: '$18,475' },
      { label: 'Development charges (buyer cap)', value: 'up to $15,000' },
      { label: 'Legal + title + disbursements', value: 'market range' },
      { label: 'HST out-of-pocket for FTHB owner-occupier', value: '$0 to variable' },
      {
        label: 'Illustrative cash requirement at final closing above deposits paid',
        value: '≈ $35,000 to $40,000',
        emphasis: true,
      },
    ],
    footnote:
      'Illustrative example only. Assumes Canadian-resident first-time buyer occupying as principal residence, APS signed after April 1 2026, purchaser cap on development charges, and mortgage funding the remaining balance. Actual amounts vary by APS, project, and rebate eligibility. Not a quote and not tax or legal advice.',
    showHeroGraphic: true,
  },
};

function isoOr(d: string | Date | null | undefined): string | undefined {
  if (!d) return undefined;
  const dt = typeof d === 'string' ? new Date(d.includes('Z') ? d : d + 'Z') : d;
  return isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

function displayDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d.includes('Z') ? d : d + 'Z') : d;
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

function categoryLabel(post: any): string {
  if (post.category && typeof post.category === 'string') return post.category;
  return 'BUYER GUIDE';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!post) return { title: 'Post Not Found' };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || post.title;
  const url = `https://condowizard.ca/blog/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      ...(post.publishedAt && { publishedTime: isoOr(post.publishedAt) }),
      ...(post.updatedAt && { modifiedTime: isoOr(post.updatedAt) }),
      authors: [post.author || 'Tal Shelef'],
      section: categoryLabel(post),
      ...(post.featuredImage ? { images: [{ url: post.featuredImage, alt: title }] } : { images: ['/og-image.png'] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.featuredImage || '/og-image.png'],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!post) notFound();

  const [{ data: relatedPosts }, { data: featuredProjects }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug,title,excerpt,category,publishedAt')
      .neq('id', post.id)
      .not('publishedAt', 'is', null)
      .order('publishedAt', { ascending: false })
      .limit(3),
    supabase
      .from('projects')
      .select('name,slug,neighborhood:neighborhoods(name)')
      .eq('featured', true)
      .neq('status', 'ARCHIVED')
      .order('createdAt', { ascending: false })
      .limit(3),
  ]);

  const category = categoryLabel(post);
  const body = stripRedundantSections(post.content || '');
  const blocks = parseArticle(body);
  const headings = extractHeadings(body);
  const { label: readLabel } = readingTime(post.content || '');
  const canonical = `https://condowizard.ca/blog/${slug}`;
  const accessDate = displayDate(post.updatedAt || post.publishedAt || new Date());
  const publishedLabel = displayDate(post.publishedAt);
  const updatedLabel = displayDate(post.updatedAt);

  const summary = SUMMARY_PANELS[slug];
  const faqItems = extractFaqSchemaItems(blocks);

  const articleSchema = generateArticleSchema({
    ...post,
    updatedAt: post.updatedAt,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Blog', url: 'https://condowizard.ca/blog' },
    { name: post.title, url: canonical },
  ]);
  const faqSchema = faqItems.length > 0 ? generateFAQSchema(faqItems) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Editorial Hero */}
      <header className="border-b border-border bg-gradient-to-b from-surface2/60 via-surface2/20 to-transparent">
        <div className="container-main max-w-6xl pt-24 pb-10 md:pt-28 md:pb-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-text-muted"
          >
            <Link href="/" className="hover:text-accent-blue transition-colors">
              Home
            </Link>
            <span aria-hidden="true" className="text-text-muted/40">
              ›
            </span>
            <Link href="/blog" className="hover:text-accent-blue transition-colors">
              Blog
            </Link>
            <span aria-hidden="true" className="text-text-muted/40">
              ›
            </span>
            <span className="truncate max-w-[180px] text-text-primary/70">{post.title}</span>
          </nav>

          <div className="grid gap-8 md:gap-10 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-accent-blue/25 bg-accent-blue/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
                {category}
              </span>
              <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-text-primary max-w-3xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-5 text-lg md:text-xl leading-relaxed text-text-muted max-w-2xl">
                  {post.excerpt.split(/\.\s+/)[0]}.
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-6">
                <AuthorCard name={post.author} imageSrc={AUTHOR_IMAGE_SRC} variant="inline" />
                <div className="hidden md:block w-px h-8 bg-border" />
                <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-muted">
                  {publishedLabel && (
                    <div>
                      <dt className="uppercase tracking-widest text-[10px] font-semibold text-text-muted/70">
                        Published
                      </dt>
                      <dd className="text-text-primary font-medium">{publishedLabel}</dd>
                    </div>
                  )}
                  {updatedLabel && updatedLabel !== publishedLabel && (
                    <div>
                      <dt className="uppercase tracking-widest text-[10px] font-semibold text-text-muted/70">
                        Last reviewed
                      </dt>
                      <dd className="text-text-primary font-medium">{updatedLabel}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="uppercase tracking-widest text-[10px] font-semibold text-text-muted/70">
                      Reading
                    </dt>
                    <dd className="text-text-primary font-medium">{readLabel}</dd>
                  </div>
                </dl>
                <div className="ml-auto">
                  <ClientActions title={post.title} url={canonical} />
                </div>
              </div>
            </div>

            {summary?.showHeroGraphic && (
              <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
                <HeroCostGraphic />
              </div>
            )}
          </div>

          {summary && (
            <SummaryPanel lines={summary.lines} footnote={summary.footnote} />
          )}
        </div>
      </header>

      {/* Article Body + Sidebar */}
      <div className="container-main max-w-6xl py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,760px)_minmax(280px,320px)] lg:gap-14">
          <article className="min-w-0">
            <TocMobile headings={headings} />
            <ArticleBody blocks={blocks} accessDate={accessDate} />
            <AuthorCard name={post.author} imageSrc={AUTHOR_IMAGE_SRC} />
          </article>

          <aside
            aria-label="Article sidebar"
            className="hidden lg:block print:hidden"
          >
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <TocDesktop headings={headings} />
              </div>

              {updatedLabel && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                    Last reviewed
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{updatedLabel}</p>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">
                    Rules, tax rates, and by-laws change. Buyers should verify with a
                    qualified professional before signing.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-accent-blue/25 bg-accent-blue/[0.06] p-5">
                <p className="text-sm font-semibold text-text-primary">
                  Plan your closing costs
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  Walk your APS and price list through with the CondoWizard team
                  before you commit.
                </p>
                <Link
                  href="/contact-us"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-accent-blue px-3 py-2 text-xs font-semibold text-white hover:brightness-110 transition"
                >
                  Speak With Tal
                </Link>
              </div>

              {relatedPosts && relatedPosts.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                    Related guides
                  </p>
                  <ul className="mt-3 space-y-3">
                    {relatedPosts.map((rp: any) => (
                      <li key={rp.slug}>
                        <Link
                          href={`/blog/${rp.slug}`}
                          className="block text-sm font-medium text-text-primary hover:text-accent-blue transition-colors leading-snug"
                        >
                          {rp.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {featuredProjects && featuredProjects.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                    Featured Toronto pre-construction
                  </p>
                  <ul className="mt-3 space-y-3">
                    {featuredProjects.map((p: any) => (
                      <li key={p.slug}>
                        <Link
                          href={`/properties/${p.slug}`}
                          className="block text-sm font-medium text-text-primary hover:text-accent-blue transition-colors leading-snug"
                        >
                          {p.name}
                          {p.neighborhood?.name && (
                            <span className="block text-xs font-normal text-text-muted">
                              {p.neighborhood.name}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/new-condos"
                    className="mt-4 inline-flex text-xs font-semibold text-accent-blue hover:underline"
                  >
                    Browse all projects →
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Quiet closing CTA */}
        <div className="mt-14 print:hidden">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Next step
              </p>
              <h3 className="mt-1 text-lg md:text-xl font-semibold text-text-primary">
                Compare projects side-by-side or ask Tal a question
              </h3>
              <p className="mt-2 text-sm text-text-muted max-w-2xl">
                Browse current Toronto pre-construction inventory, or send a specific project
                and price list for a walk-through before you commit.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/new-condos"
                className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
              >
                Browse projects
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
              >
                Contact Tal
              </Link>
            </div>
          </div>
        </div>

        {/* Related articles grid */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section aria-label="Continue reading" className="mt-14">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Continue reading</h2>
              <Link href="/blog" className="text-sm font-medium text-accent-blue hover:underline">
                All guides →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedPosts.map((rp: any) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-2xl border border-border bg-surface p-6 hover:border-accent-blue/30 transition-colors flex flex-col"
                >
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
                    {rp.category || 'BUYER GUIDE'}
                  </span>
                  <h3 className="mt-2 text-[17px] font-semibold text-text-primary leading-snug group-hover:text-accent-blue transition-colors">
                    {rp.title}
                  </h3>
                  {rp.excerpt && (
                    <p className="mt-2 text-sm text-text-muted line-clamp-3 leading-relaxed">
                      {rp.excerpt}
                    </p>
                  )}
                  {rp.publishedAt && (
                    <p className="mt-4 text-xs text-text-muted">
                      {displayDate(rp.publishedAt)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
