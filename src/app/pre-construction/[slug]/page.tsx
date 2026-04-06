export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPriceRange, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import { generateRealEstateListingSchema, generateBreadcrumbSchema } from '@/lib/seo';
import StatusBadge from '@/components/projects/StatusBadge';
import InquiryForm from '@/components/projects/InquiryForm';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*)')
    .eq('slug', slug)
    .single();
  if (!project) return { title: 'Project Not Found' };
  const area = project.neighborhood?.name || 'Toronto';
  return {
    title: `${project.name} | Pre-Construction in ${area}`,
    description: project.description?.slice(0, 160) || `${project.name} - New pre-construction development in ${area}. ${project.priceMin ? `From ${formatPrice(project.priceMin)}.` : ''} ${project.totalUnits ? `${project.totalUnits} residences.` : ''}`,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('slug', slug)
    .single();

  if (!project) notFound();

  const { data: relatedProjects } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('neighborhoodId', project.neighborhoodId)
    .neq('id', project.id)
    .limit(3);

  const listingSchema = generateRealEstateListingSchema(project);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Pre-Construction', url: 'https://condowizard.ca/pre-construction' },
    ...(project.neighborhood ? [{ name: project.neighborhood.name, url: `https://condowizard.ca/new-condos-${project.neighborhood.slug}` }] : []),
    { name: project.name, url: `https://condowizard.ca/pre-construction/${project.slug}` },
  ]);

  const amenities = (project.amenities as string[] | null) || [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="container-main py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link href="/pre-construction" className="hover:text-gold">Pre-Construction</Link>
          {project.neighborhood && (
            <>
              <span>/</span>
              <Link href={`/new-condos-${project.neighborhood.slug}`} className="hover:text-gold">
                {project.neighborhood.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-navy font-medium">{project.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={project.status} />
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {CATEGORY_LABELS[project.category]}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-navy">{project.name}</h1>
              {project.address && <p className="text-gray-500 mt-2">{project.address}</p>}
              {project.developer && (
                <p className="text-gray-500 mt-1">by <span className="text-navy font-medium">{project.developer.name}</span></p>
              )}
            </div>

            {/* Image placeholder */}
            <div className="bg-gradient-to-br from-navy-100 to-navy-200 rounded-xl h-64 md:h-96 flex items-center justify-center">
              {project.mainImageUrl ? (
                <img src={project.mainImageUrl} alt={project.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-navy-300 font-display text-6xl">{project.name[0]}</span>
              )}
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Price', value: formatPriceRange(project.priceMin, project.priceMax) },
                { label: 'Total Units', value: project.totalUnits ? `${project.totalUnits} Residences` : 'TBD' },
                { label: 'Floors', value: project.floors ? `${project.floors} Stories` : 'TBD' },
                { label: 'Est. Completion', value: project.estCompletion || 'TBD' },
              ].map((spec) => (
                <div key={spec.label} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{spec.label}</div>
                  <div className="text-navy font-semibold mt-1">{spec.value}</div>
                </div>
              ))}
            </div>

            {project.unitTypes && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unit Types</div>
                <div className="text-navy font-medium">{project.unitTypes}</div>
              </div>
            )}

            {project.depositStructure && (
              <div className="bg-gold-50 rounded-lg border border-gold-200 p-4">
                <div className="text-xs text-gold-700 uppercase tracking-wider mb-1">Deposit Structure</div>
                <div className="text-navy font-medium">{project.depositStructure}</div>
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">About {project.name}</h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                  {project.description}
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Architect */}
            {project.architect && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Architect</div>
                <div className="text-navy font-medium">{project.architect}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20">
              <InquiryForm projectId={project.id} projectName={project.name} />

              {/* Form disclaimer */}
              <p className="text-[10px] text-text-muted/50 mt-3 px-1 leading-relaxed">
                CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
              </p>

              {/* Neighborhood link */}
              {project.neighborhood && (
                <Link
                  href={`/new-condos-${project.neighborhood.slug}`}
                  className="mt-6 block card p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Neighborhood</div>
                  <div className="text-navy font-display text-lg font-semibold">{project.neighborhood.name}</div>
                  <div className="text-gold text-sm mt-1">View all projects &rarr;</div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {(relatedProjects || []).length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-navy mb-6">
              More in {project.neighborhood?.name || 'This Area'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedProjects || []).map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
