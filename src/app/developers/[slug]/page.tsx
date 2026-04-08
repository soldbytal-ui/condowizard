export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPriceRange } from '@/lib/utils';
import { generateBreadcrumbSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: dev } = await supabase
    .from('developers')
    .select('name, description, logoUrl')
    .eq('slug', slug)
    .single();

  if (!dev) return { title: 'Developer Not Found' };

  const title = `${dev.name} | Toronto Developer Profile`;
  const description = dev.description
    ? dev.description.slice(0, 160)
    : `Explore ${dev.name}'s pre-construction condo portfolio in the Greater Toronto Area. View projects, pricing, and developer track record.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://condowizard.ca/developers/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://condowizard.ca/developers/${slug}`,
      type: 'website',
      ...(dev.logoUrl && { images: [{ url: dev.logoUrl, alt: dev.name }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function DeveloperProfilePage({ params }: Props) {
  const { slug } = await params;

  const { data: developer } = await supabase
    .from('developers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!developer) notFound();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('developerId', developer.id)
    .order('name');

  const { data: otherDevs } = await supabase
    .from('developers')
    .select('id, name, slug, description, projects:projects(id)')
    .neq('id', developer.id)
    .limit(50);

  // Filter other devs to those with projects, pick 4
  const relatedDevs = (otherDevs || [])
    .filter((d: any) => d.projects && d.projects.length > 0)
    .sort((a: any, b: any) => (b.projects?.length || 0) - (a.projects?.length || 0))
    .slice(0, 4);

  // Stats
  const allProjects = projects || [];
  const neighborhoods = [...new Set(allProjects.map((p: any) => p.neighborhood?.name).filter(Boolean))];
  const priceMinAll = Math.min(...allProjects.map((p: any) => p.priceMin).filter(Boolean));
  const priceMaxAll = Math.max(...allProjects.map((p: any) => p.priceMax).filter(Boolean));
  const yearsActive = developer.foundedYear
    ? new Date().getFullYear() - developer.foundedYear
    : null;

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Developers', url: 'https://condowizard.ca/developers' },
    { name: developer.name, url: `https://condowizard.ca/developers/${developer.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <Link href="/developers" className="hover:text-accent-blue transition-colors">Developers</Link>
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{developer.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-blue/10 flex items-center justify-center flex-shrink-0">
            {developer.logoUrl ? (
              <img src={developer.logoUrl} alt={developer.name} className="w-14 h-14 object-contain" />
            ) : (
              <span className="text-accent-blue font-bold text-2xl">
                {developer.name.split(/[\s,&]+/).filter((w: string) => w.length > 0).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">{developer.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted flex-wrap">
              {developer.headquarters && <span>{developer.headquarters}</span>}
              {developer.foundedYear && <span>Est. {developer.foundedYear}</span>}
              {developer.websiteUrl && (
                <a
                  href={developer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  Website &rarr;
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">Projects</div>
            <div className="text-text-primary font-semibold text-xl mt-1">{allProjects.length}</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">Neighbourhoods</div>
            <div className="text-text-primary font-semibold text-xl mt-1">{neighborhoods.length}</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">Price Range</div>
            <div className="text-text-primary font-semibold mt-1">
              {isFinite(priceMinAll) ? formatPriceRange(priceMinAll, priceMaxAll) : 'Contact Us'}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">Years Active</div>
            <div className="text-text-primary font-semibold text-xl mt-1">
              {yearsActive ? `${yearsActive}+` : '—'}
            </div>
          </div>
        </div>

        {/* Bio */}
        {developer.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">About {developer.name}</h2>
            <p className="text-text-muted leading-relaxed max-w-3xl">{developer.description}</p>
          </div>
        )}

        {/* Projects Grid */}
        {allProjects.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Projects by {developer.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {/* Other Developers */}
        {relatedDevs.length > 0 && (
          <div className="border-t border-border pt-10">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Other Developers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedDevs.map((d: any) => (
                <Link
                  key={d.id}
                  href={`/developers/${d.slug}`}
                  className="card p-4 group hover:border-accent-blue/30 transition-all"
                >
                  <h3 className="text-text-primary font-medium group-hover:text-accent-blue transition-colors line-clamp-1">
                    {d.name}
                  </h3>
                  <div className="text-xs text-text-muted mt-1">
                    {d.projects?.length || 0} project{(d.projects?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  {d.description && (
                    <p className="text-xs text-text-muted mt-2 line-clamp-2">{d.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
