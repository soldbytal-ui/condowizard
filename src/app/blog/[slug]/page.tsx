export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Markdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

function cleanKeyword(kw: string | null) {
  if (!kw) return null;
  return kw.replace(/^\*+\s*/, '').trim();
}

function getReadingTime(content: string | null) {
  if (!content) return '5 min read';
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 250))} min read`;
}

/** Strip embedded frontmatter lines from markdown content */
function cleanContent(content: string) {
  return content
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return (
        !t.startsWith('**Meta Title:') &&
        !t.startsWith('**Meta Description:') &&
        !t.startsWith('**Target Keyword:') &&
        !t.startsWith('**Slug:')
      );
    })
    .join('\n');
}

function getExcerpt(post: any) {
  if (!post.excerpt || post.excerpt === '---' || post.excerpt.length < 10) {
    if (!post.content) return '';
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
        return trimmed.replace(/\*\*/g, '').slice(0, 200);
      }
    }
  }
  return post.excerpt;
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
  const description = post.metaDescription || getExcerpt(post) || post.title;
  return {
    title,
    description,
    alternates: {
      canonical: `https://condowizard.ca/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://condowizard.ca/blog/${slug}`,
      type: 'article',
      ...(post.publishedAt && { publishedTime: new Date(post.publishedAt).toISOString() }),
      ...(post.featuredImage && { images: [{ url: post.featuredImage, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(post.featuredImage && { images: [post.featuredImage] }),
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

  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .neq('id', post.id)
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false })
    .limit(3);

  const articleSchema = generateArticleSchema(post);
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Blog', url: 'https://condowizard.ca/blog' },
    { name: post.title, url: `https://condowizard.ca/blog/${post.slug}` },
  ]);

  const keyword = cleanKeyword(post.targetKeyword);
  const readTime = getReadingTime(post.content);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-accent-blue/5 to-transparent border-b border-border">
        <div className="container-main max-w-4xl pt-24 pb-12">
          <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
            <span className="text-text-muted/30">/</span>
            <Link href="/blog" className="hover:text-accent-blue transition-colors">Blog</Link>
            <span className="text-text-muted/30">/</span>
            <span className="text-text-muted truncate max-w-[200px]">{post.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {keyword && (
              <span className="text-xs text-accent-blue font-medium uppercase tracking-wider bg-accent-blue/10 px-3 py-1 rounded-full">
                {keyword}
              </span>
            )}
            <span className="text-xs text-text-muted/50 bg-surface2 px-3 py-1 rounded-full">
              {readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-text-primary leading-[1.15] tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mt-6">
            {/* Author avatar */}
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-blue font-semibold text-sm">
                {post.author?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || 'CW'}
              </span>
            </div>
            <div>
              <p className="text-sm text-text-primary font-medium">{post.author}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted/60">
                {post.publishedAt && (
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <article className="container-main max-w-4xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
          {/* Content */}
          <div className="min-w-0">
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:text-text-primary prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-text-muted prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-text-muted prose-li:leading-relaxed
              prose-strong:text-text-primary prose-strong:font-semibold
              prose-a:text-accent-blue prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-blockquote:border-l-4 prose-blockquote:border-accent-blue/40 prose-blockquote:bg-accent-blue/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-text-muted
              prose-code:text-accent-blue prose-code:bg-surface2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-hr:border-border prose-hr:my-8
              prose-table:border prose-table:border-border prose-th:bg-surface2 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-text-primary prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
              prose-img:rounded-xl prose-img:border prose-img:border-border
              prose-ul:space-y-1 prose-ol:space-y-1
            ">
              <Markdown
                components={{
                  a: ({ href, children }) => {
                    if (href?.startsWith('/')) {
                      return <Link href={href}>{children}</Link>;
                    }
                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                  },
                  // Add visual treatment to blockquotes with > **Quick Answer:** pattern
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent-blue/40 bg-accent-blue/5 rounded-r-xl py-4 px-5 my-6 not-italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto rounded-xl border border-border my-6">
                      <table className="w-full">{children}</table>
                    </div>
                  ),
                }}
              >
                {cleanContent(post.content)}
              </Markdown>
            </div>
          </div>

          {/* Sidebar — sticky table of contents / quick links */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/new-condos" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    Browse All Condos
                  </Link>
                  <Link href="/new-condos-king-west" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    King West Condos
                  </Link>
                  <Link href="/new-condos-yorkville" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    Yorkville Condos
                  </Link>
                  <Link href="/new-condos-downtown-core" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    Downtown Core
                  </Link>
                  <Link href="/contact-us" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    Contact an Agent
                  </Link>
                </div>
              </div>

              {/* Share / Bookmark CTA */}
              <div className="card p-5 bg-accent-blue/5 border-accent-blue/20">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Need Expert Guidance?</h4>
                <p className="text-xs text-text-muted mb-3">Our team specializes in Toronto pre-construction. Get personalized recommendations.</p>
                <Link href="/contact-us" className="btn-primary text-xs !py-2 !px-4 w-full">
                  Talk to an Expert
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-accent-blue/10 to-transparent border border-accent-blue/20 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-text-primary">Ready to Explore Pre-Construction?</h3>
            <p className="text-text-muted mt-2">Browse 200+ new developments across the Greater Toronto Area.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/new-condos" className="btn-primary">Browse Projects</Link>
            <Link href="/contact-us" className="btn-secondary">Contact Us</Link>
          </div>
        </div>

        {/* Related Articles */}
        {(relatedPosts || []).length > 0 && (
          <div className="mt-16 pt-12 border-t border-border">
            <h2 className="text-2xl font-bold text-text-primary mb-8">Continue Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedPosts || []).map((rp: any) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="card group p-6 hover:border-accent-blue/30 transition-all flex flex-col">
                  {cleanKeyword(rp.targetKeyword) && (
                    <span className="text-xs text-accent-blue font-medium uppercase tracking-wider mb-2 self-start">
                      {cleanKeyword(rp.targetKeyword)}
                    </span>
                  )}
                  <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors leading-tight flex-1">
                    {rp.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-4 text-xs text-text-muted/60">
                    {rp.publishedAt && (
                      <span>{new Date(rp.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                    <span>{getReadingTime(rp.content)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to blog */}
        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm text-accent-blue hover:underline">
            &larr; Back to all articles
          </Link>
        </div>
      </article>
    </>
  );
}
