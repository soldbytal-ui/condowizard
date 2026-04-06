export const dynamic = 'force-dynamic';
// fix: moved devsWithProjects before itemList to prevent ReferenceError
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Toronto Pre-Construction Developers',
  description:
    'Explore top pre-construction condo developers in the Greater Toronto Area. Browse developer profiles, project portfolios, and track records from King West to North York.',
  alternates: {
    canonical: 'https://condowizard.ca/developers',
  },
  openGraph: {
    title: 'Toronto Pre-Construction Developers',
    description: 'Explore top pre-construction condo developers in the Greater Toronto Area. Browse profiles, portfolios, and track records.',
    url: 'https://condowizard.ca/developers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toronto Pre-Construction Developers',
    description: 'Explore top pre-construction condo developers in the Greater Toronto Area.',
  },
};

export default async function DevelopersPage() {
  const { data: developers } = await supabase
    .from('developers')
    .select('*, projects:projects(id, name, slug, priceMin, priceMax, neighborhood:neighborhoods(name))')
    .order('name');

  // Filter to only show developers with at least 1 project
  const devsWithProjects = (developers || []).filter(
    (d: any) => d.projects && d.projects.length > 0
  );

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Developers', url: 'https://condowizard.ca/developers' },
  ]);

  const itemList = generateItemListSchema(
    devsWithProjects.map((d: any, i: number) => ({
      name: d.name,
      url: `https://condowizard.ca/developers/${d.slug}`,
      position: i + 1,
    }))
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Developers</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">
            Pre-Construction Developers
          </h1>
          <p className="text-text-muted mt-3 max-w-2xl">
            Meet the developers shaping Toronto&apos;s skyline. Browse {devsWithProjects.length} developers
            and their portfolios of pre-construction condos across Toronto, Mississauga, and the GTA.
          </p>
        </div>

        {/* Developer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devsWithProjects.map((dev: any) => {
            const projectCount = dev.projects?.length || 0;
            const initials = dev.name
              .split(/[\s,&]+/)
              .filter((w: string) => w.length > 0)
              .slice(0, 2)
              .map((w: string) => w[0].toUpperCase())
              .join('');

            const neighborhoods = [
              ...new Set(
                (dev.projects || [])
                  .map((p: any) => p.neighborhood?.name)
                  .filter(Boolean)
              ),
            ];

            return (
              <Link
                key={dev.id}
                href={`/developers/${dev.slug}`}
                className="card p-6 group hover:border-accent-blue/30 transition-all"
              >
                {/* Logo / Initials */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    {dev.logoUrl ? (
                      <img src={dev.logoUrl} alt={dev.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-accent-blue font-semibold text-lg">{initials}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-text-primary font-semibold group-hover:text-accent-blue transition-colors line-clamp-1">
                      {dev.name}
                    </h2>
                    <div className="text-xs text-text-muted mt-0.5">
                      {projectCount} project{projectCount !== 1 ? 's' : ''}
                      {dev.headquarters && ` · ${dev.headquarters}`}
                    </div>
                  </div>
                </div>

                {/* Bio excerpt */}
                {dev.description && (
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-4">
                    {dev.description}
                  </p>
                )}

                {/* Neighborhood tags */}
                {neighborhoods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {neighborhoods.slice(0, 4).map((n: string) => (
                      <span
                        key={n}
                        className="text-xs bg-surface2 border border-border text-text-muted px-2 py-0.5 rounded-full"
                      >
                        {n}
                      </span>
                    ))}
                    {neighborhoods.length > 4 && (
                      <span className="text-xs text-text-muted">+{neighborhoods.length - 4} more</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
