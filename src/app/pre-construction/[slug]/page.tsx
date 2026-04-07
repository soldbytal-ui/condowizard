export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPriceRange, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import { generateRealEstateListingSchema, generateBreadcrumbSchema } from '@/lib/seo';
import StatusBadge from '@/components/projects/StatusBadge';
import InquiryForm from '@/components/projects/InquiryForm';
import ProjectCard from '@/components/projects/ProjectCard';
import ImageGallery from '@/components/projects/ImageGallery';

type Props = { params: Promise<{ slug: string }> };

// ─── Section header replicating PreConstructionMiami style ───────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-gray-900 pl-3 border-l-[3px] border-[#0066FF] mb-4 leading-tight">
      {children}
    </h2>
  );
}

function SectionBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-xl border border-gray-100 p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

// ─── Image normalizer ─────────────────────────────────────────────────────────
function parseGalleryImages(
  images: unknown,
  mainImageUrl: string | null,
  projectName: string
): { url: string; alt: string; type?: 'rendering' | 'photo' | 'aerial' }[] {
  const fallback = mainImageUrl
    ? [{ url: mainImageUrl, alt: `${projectName} exterior rendering` }]
    : [];

  if (!images) return fallback;

  // Array of strings
  if (Array.isArray(images) && typeof images[0] === 'string') {
    return (images as string[]).map((url, i) => ({ url, alt: `${projectName} - Image ${i + 1}` }));
  }

  // Array of image objects
  if (Array.isArray(images) && typeof images[0] === 'object') {
    return (images as { url?: string; src?: string; alt?: string; type?: 'rendering' | 'photo' | 'aerial' }[])
      .filter((img) => img.url || img.src)
      .map((img, i) => ({
        url: (img.url || img.src)!,
        alt: img.alt || `${projectName} - Image ${i + 1}`,
        type: img.type,
      }));
  }

  // Object with gallery sub-array
  if (typeof images === 'object' && images !== null && 'gallery' in images) {
    const obj = images as { gallery?: string[] };
    if (Array.isArray(obj.gallery)) {
      return obj.gallery.map((url, i) => ({ url, alt: `${projectName} - Image ${i + 1}` }));
    }
  }

  return fallback;
}

function parseFloorPlanImages(images: unknown): { url: string; alt: string }[] {
  if (!images || typeof images !== 'object') return [];
  if ('floorPlans' in (images as object)) {
    const fp = (images as { floorPlans?: string[] }).floorPlans;
    if (Array.isArray(fp)) return fp.map((url, i) => ({ url, alt: `Floor Plan ${i + 1}` }));
  }
  return [];
}

// ─── Dynamic section content generators ──────────────────────────────────────
const NEIGHBOURHOOD_TRANSIT: Record<string, string> = {
  'downtown-core': 'Union Station (Lines 1 & 2, GO Transit, UP Express), King and Queen streetcars',
  'king-west': 'St. Andrew station (Line 1), 504 King streetcar, Richmond/Adelaide cycling lanes',
  'liberty-village': '504 King streetcar, Exhibition GO station, Gardiner Expressway access',
  'queen-west': '501 Queen streetcar, Osgoode station (Line 1), Ontario Line (upcoming)',
  'yorkville': 'Bay and Bloor-Yonge stations (Lines 1 & 2), multiple bus routes along Bloor',
  'the-annex': 'Spadina and St. George stations (Lines 1 & 2), Bloor Street cycling track',
  'midtown': 'Davisville station (Line 1), Mt Pleasant and Eglinton bus connections',
  'yonge-eglinton': 'Eglinton station (Line 1) with the new Eglinton Crosstown LRT, multiple bus routes',
  'leaside': 'Eglinton Crosstown LRT at Laird, Bayview, and Leaside stations',
  'leslieville': '501 Queen streetcar, 506 Carlton streetcar, future Ontario Line relief',
  'riverside': '501 Queen streetcar, 506 Carlton streetcar, King streetcar',
  'danforth': 'Pape, Donlands, Greenwood, and Woodbine stations (Line 2), Bloor-Danforth subway',
  'north-york': 'Multiple Line 1 Yonge stations, GO Transit, Finch West LRT (upcoming)',
  'scarborough': 'Kennedy and Scarborough GO stations, Eglinton Crosstown LRT eastern terminus',
  'etobicoke': 'Kipling GO/TTC interchange, Mississauga Transit connections, Bloor-Danforth Line 2',
  'high-park': 'High Park and Keele stations (Line 2), Parkside Drive bus routes',
  'junction': '512 St. Clair West streetcar, Dundas West station (Line 2)',
  'roncesvalles': '501 Queen streetcar, Dundas West station (Line 2), Howard Park bus',
  'waterfront': 'Union Station GO/TTC hub, 509/510 waterfront streetcars, Billy Bishop Airport Ferry',
  'cityplace': 'Bathurst and Spadina stations (Line 1), 509/510 waterfront streetcars',
  'fort-york': 'Bathurst station (Line 1), 509/510 waterfront streetcars',
  'canary-district': 'Distillery District stop (future Ontario Line), 504/506 streetcars',
  'port-lands': '503/504 streetcar access, future Broadview LRT extension',
  'markham': 'Stouffville GO Train (Unionville & Markham stations), Highway 407/404 access',
  'mississauga': 'MiWay transit, Mississauga GO stations (Port Credit, Cooksville), Highway 403/410',
  'vaughan': 'Vaughan Metropolitan Centre station (Line 1 terminus), Highway 400/407',
  'richmond-hill': 'Barrie GO Train, Viva rapid transit, Highway 404 access',
  'oakville': 'Oakville GO Train (Lakeshore West), Highway 403/QEW access',
};

const NEIGHBOURHOOD_LANDMARKS: Record<string, string> = {
  'downtown-core': 'CN Tower, Rogers Centre, Scotiabank Arena, Ripley\'s Aquarium, Financial District, St. Lawrence Market',
  'king-west': 'TIFF Bell Lightbox, Royal Alexandra Theatre, Drake Hotel, Stackt Market, Toronto waterfront',
  'liberty-village': 'BMO Field, Budweiser Stage, CNE grounds, Ontario Place, Lake Ontario waterfront',
  'queen-west': 'Trinity Bellwoods Park, MOCA Toronto, Gladstone House, Drake Hotel, Ossington strip',
  'yorkville': 'Royal Ontario Museum, University of Toronto, Mink Mile luxury retail, Hazelton Lanes',
  'the-annex': 'University of Toronto St. George campus, Spadina Museum, Casa Loma, Bloor St boutiques',
  'midtown': 'Davisville Village, Summerhill LCBO, Loblaws at Maple Leaf Gardens, Mount Pleasant Cemetery',
  'yonge-eglinton': 'Eglinton Square, Yonge-Eglinton Centre, Leaside links, Chaplin Estates',
  'leaside': 'Sunnybrook Hospital, Leaside Business Park, Don Valley trails, Bayview Village',
  'leslieville': 'Leslieville Farmers\' Market, Broadview Hotel, Gerrard India Bazaar, The Beaches nearby',
  'riverside': 'Distillery Historic District, Don River Park, St. James Cemetery, Corktown Common',
  'danforth': 'Greektown, Riverdale Farm, Withrow Park, Broadview Hotel, Toronto Islands ferry',
  'north-york': 'Mel Lastman Square, Toronto Centre for the Arts, Ikea, Fairview Mall, York University',
  'scarborough': 'Scarborough Bluffs, Toronto Zoo, Centennial College, University of Toronto Scarborough',
  'etobicoke': 'Humber River trails, Centennial Park, Sherway Gardens, Long Branch GO station',
  'high-park': 'High Park (400+ acres), Grenadier Pond, Bloor West Village, Roncesvalles Village',
  'junction': 'The Junction Arts District, George Bell Arena, Humber River Recreational Trail',
  'waterfront': 'Harbourfront Centre, Toronto Islands, Sugar Beach, Corus Quay, Billy Bishop Airport',
  'markham': 'Markham Civic Centre, Pacific Mall, Unionville historic village, Toogood Pond',
};

function generateLocationContent(
  neighborhood: { name: string; slug: string } | null,
  address: string | null
): string {
  const area = neighborhood?.name || 'Toronto';
  const slug = neighborhood?.slug || '';
  const transit = NEIGHBOURHOOD_TRANSIT[slug] || 'TTC subway and surface routes, with GO Transit regional rail connections nearby';
  const landmarks = NEIGHBOURHOOD_LANDMARKS[slug] || 'parks, shops, restaurants, and community amenities';

  return [
    `${address ? `Situated at ${address}, this` : 'This'} development is positioned in ${area}, one of Toronto's most sought-after communities for pre-construction investment.`,
    '',
    `**Transit Access:** ${transit}.`,
    '',
    `**Nearby:** ${landmarks}.`,
    '',
    `The ${area} neighbourhood offers residents a balanced urban lifestyle with walkable streets, strong transit scores, and consistent demand from both end-users and investors. Toronto's transit expansion programs — including the Ontario Line, Eglinton Crosstown LRT, and Finch West LRT — continue to enhance connectivity across the city, directly supporting long-term property value appreciation in this corridor.`,
  ].join('\n');
}

function generateInvestmentContent(neighborhood: { name: string; slug: string } | null): string {
  const area = neighborhood?.name || 'Toronto';
  return [
    `Toronto continues to rank among North America's top real estate investment markets. Population growth driven by federal immigration targets — currently over 400,000 new permanent residents annually — sustains rental demand across every neighbourhood, with the GTA absorbing a disproportionate share of new arrivals.`,
    '',
    `**Why ${area}?** Pre-construction condos in this corridor consistently attract strong investor interest due to the combination of transit accessibility, employment proximity, and limited new supply relative to demand. Historical data from TRREB and Urbanation shows that pre-construction purchasers in Toronto have benefited from significant equity appreciation between signing and registration.`,
    '',
    `**Key market drivers:**`,
    `• Toronto's rental vacancy rate remains well below 2%, sustaining upward pressure on rents`,
    `• Provincial development charges and land constraints limit new supply`,
    `• The Province of Ontario's "More Homes Built Faster Act" is accelerating intensification along transit corridors`,
    `• Institutional demand from REITs and international capital continues to validate the Toronto condo market`,
    '',
    `Register early to secure the lowest pre-launch pricing and priority floor selection.`,
  ].join('\n');
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*)')
    .eq('slug', slug)
    .single();
  if (!project) return { title: 'Project Not Found' };
  const area = (project.neighborhood as { name: string } | null)?.name || 'Toronto';
  const title = project.metaTitle || `${project.name} | Pre-Construction Condos in ${area}`;
  const description =
    project.metaDescription ||
    project.description?.slice(0, 160) ||
    `${project.name} — new pre-construction condominium in ${area}. ${project.priceMin ? `From ${formatPrice(project.priceMin)}.` : 'Pricing TBA.'} Register for priority access.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: project.mainImageUrl ? [{ url: project.mainImageUrl }] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
    ...(project.neighborhood
      ? [{ name: (project.neighborhood as { name: string }).name, url: `https://condowizard.ca/new-condos-${(project.neighborhood as { slug: string }).slug}` }]
      : []),
    { name: project.name, url: `https://condowizard.ca/pre-construction/${project.slug}` },
  ]);

  const neighborhood = project.neighborhood as { name: string; slug: string; description?: string } | null;
  const developer = project.developer as { id: string; name: string; slug: string; description?: string; foundedYear?: number; headquarters?: string } | null;
  const amenities = (project.amenities as string[] | null) || [];

  const galleryImages = parseGalleryImages(project.images, project.mainImageUrl, project.name);
  const floorPlanImages = parseFloorPlanImages(project.images);
  const hasPricing = project.priceMin != null;

  // Parse faqJson for FAQs (standard array of {question, answer})
  let faqs: { question: string; answer: string }[] = [];
  try {
    const raw = project.faqJson;
    if (Array.isArray(raw)) faqs = raw as { question: string; answer: string }[];
  } catch { /* noop */ }

  // Generate dynamic section content
  const locationContent = generateLocationContent(neighborhood, project.address);
  const investmentContent = generateInvestmentContent(neighborhood);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#0066FF] transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/pre-construction" className="hover:text-[#0066FF] transition-colors">Pre-Construction</Link>
          {neighborhood && (
            <>
              <span className="text-gray-300">/</span>
              <Link href={`/new-condos-${neighborhood.slug}`} className="hover:text-[#0066FF] transition-colors">
                {neighborhood.name}
              </Link>
            </>
          )}
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-medium">{project.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

          {/* ── Main content (2/3) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Project header */}
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <StatusBadge status={project.status} />
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] || project.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{project.name}</h1>
              {project.address && (
                <p className="text-gray-500 mt-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#0066FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {project.address}
                </p>
              )}
              {developer && (
                <p className="text-gray-500 mt-1">
                  by{' '}
                  <Link href={`/developers/${developer.slug}`} className="text-[#0066FF] font-medium hover:underline">
                    {developer.name}
                  </Link>
                </p>
              )}
            </div>

            {/* Hero image */}
            <div className="rounded-xl overflow-hidden h-64 md:h-[420px] bg-gray-100">
              {project.mainImageUrl ? (
                <img
                  src={project.mainImageUrl}
                  alt={`${project.name} exterior`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-slate-400 font-bold text-6xl">{project.name[0]}</span>
                </div>
              )}
            </div>

            {/* ─── 1. Overview ────────────────────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Overview</SectionHeader>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: '💰',
                    label: 'Starting Price',
                    value: hasPricing ? formatPriceRange(project.priceMin, project.priceMax) : 'Pricing TBA',
                    highlight: hasPricing,
                  },
                  {
                    icon: '🏠',
                    label: 'Total Units',
                    value: project.totalUnits ? `${project.totalUnits.toLocaleString()} Units` : 'TBD',
                    highlight: false,
                  },
                  {
                    icon: '🏗️',
                    label: 'Storeys',
                    value: project.floors ? `${project.floors} Floors` : 'TBD',
                    highlight: false,
                  },
                  {
                    icon: '📅',
                    label: 'Occupancy',
                    value: project.estCompletion || 'TBD',
                    highlight: false,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-lg p-4 border ${stat.highlight ? 'bg-[#EBF2FF] border-[#0066FF]/30' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{stat.label}</div>
                    <div className={`text-sm font-bold mt-0.5 ${stat.highlight ? 'text-[#0066FF]' : 'text-gray-800'}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra specs row */}
              {(project.unitTypes || project.architect || project.depositStructure) && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {project.unitTypes && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Unit Types</div>
                      <div className="text-sm font-medium text-gray-800">{project.unitTypes}</div>
                    </div>
                  )}
                  {project.architect && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Architect</div>
                      <div className="text-sm font-medium text-gray-800">{project.architect}</div>
                    </div>
                  )}
                  {project.depositStructure && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Deposit</div>
                      <div className="text-sm font-medium text-gray-800">{project.depositStructure}</div>
                    </div>
                  )}
                </div>
              )}
            </SectionBlock>

            {/* ─── 2. About this Development ──────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>About this Development</SectionHeader>
              <div className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed">
                {project.longDescription ? (
                  <p className="whitespace-pre-line">{project.longDescription}</p>
                ) : project.description ? (
                  <p className="whitespace-pre-line">{project.description}</p>
                ) : (
                  <p>
                    {project.name} is an upcoming pre-construction development{neighborhood ? ` in ${neighborhood.name}` : ' in Toronto'}.
                    Register your interest below to receive priority updates on pricing, floor plans, and VIP access before the public launch.
                  </p>
                )}
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionBlock>

            {/* ─── 3. Location & Neighbourhood ────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Location & Neighbourhood</SectionHeader>
              <div className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed">
                {locationContent.split('\n').map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  if (line.startsWith('**') && line.endsWith('**')) {
                    const text = line.slice(2, -2);
                    return <p key={i}><strong>{text}</strong></p>;
                  }
                  if (line.startsWith('**')) {
                    const colonIdx = line.indexOf(':**');
                    if (colonIdx > -1) {
                      return (
                        <p key={i}>
                          <strong>{line.slice(2, colonIdx)}:</strong>
                          {line.slice(colonIdx + 3)}
                        </p>
                      );
                    }
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
              {neighborhood && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/new-condos-${neighborhood.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-[#0066FF] font-medium hover:underline"
                  >
                    View all pre-construction projects in {neighborhood.name}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </SectionBlock>

            {/* ─── 4. Investment Potential ─────────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Investment Potential</SectionHeader>
              <div className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed">
                {investmentContent.split('\n').map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  if (line.startsWith('**') && line.endsWith('**')) {
                    const text = line.slice(2, -2);
                    return <p key={i}><strong>{text}</strong></p>;
                  }
                  if (line.startsWith('**')) {
                    const colonIdx = line.indexOf('?**');
                    if (colonIdx > -1) {
                      return (
                        <p key={i}>
                          <strong>{line.slice(2, colonIdx)}?</strong>
                          {line.slice(colonIdx + 3)}
                        </p>
                      );
                    }
                  }
                  if (line.startsWith('• ')) {
                    return (
                      <li key={i} className="ml-4 list-none flex items-start gap-2">
                        <span className="text-[#0066FF] mt-1">•</span>
                        <span>{line.slice(2)}</span>
                      </li>
                    );
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </SectionBlock>

            {/* ─── 5. About the Developer ──────────────────────────────────── */}
            {developer && (
              <SectionBlock>
                <SectionHeader>About the Developer</SectionHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#EBF2FF] flex items-center justify-center shrink-0 text-[#0066FF] font-bold text-lg">
                    {developer.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/developers/${developer.slug}`}
                      className="text-base font-bold text-gray-900 hover:text-[#0066FF] transition-colors"
                    >
                      {developer.name}
                    </Link>
                    {(developer.headquarters || developer.foundedYear) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[developer.headquarters, developer.foundedYear ? `Est. ${developer.foundedYear}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {developer.description ||
                        `${developer.name} is an active developer in the Greater Toronto Area pre-construction market, known for delivering quality residential communities.`}
                    </p>
                    <Link
                      href={`/developers/${developer.slug}`}
                      className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#0066FF] font-medium hover:underline"
                    >
                      View all projects by {developer.name}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </SectionBlock>
            )}

            {/* ─── 6. Floor Plans ──────────────────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Floor Plans</SectionHeader>
              {floorPlanImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {floorPlanImages.map((fp, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      <img src={fp.url} alt={fp.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <p className="text-gray-500 font-medium">Floor Plans Not Yet Available</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Register below to receive floor plans as soon as they are released.
                  </p>
                </div>
              )}
            </SectionBlock>

            {/* ─── 7. Gallery ──────────────────────────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Gallery</SectionHeader>
              {galleryImages.length > 0 ? (
                <ImageGallery images={galleryImages} projectName={project.name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Renderings Coming Soon</p>
                  <p className="text-gray-400 text-sm mt-1">Official renderings will be published at launch.</p>
                </div>
              )}
            </SectionBlock>

            {/* ─── 8. Schedule a Private Showing ───────────────────────────── */}
            <SectionBlock>
              <SectionHeader>Schedule a Private Showing</SectionHeader>
              <p className="text-sm text-gray-500 mb-5">
                Connect with a CondoWizard advisor for a VIP preview, detailed floor plan review, and personalized investment analysis.
                All inquiries are strictly confidential.
              </p>
              <InquiryForm
                projectId={project.id}
                neighborhoodId={project.neighborhoodId || undefined}
                source="showing_request"
                projectName={project.name}
              />
            </SectionBlock>

            {/* FAQ (if exists) */}
            {faqs.length > 0 && (
              <SectionBlock>
                <SectionHeader>Frequently Asked Questions</SectionHeader>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-semibold text-gray-800 text-sm">{faq.question}</p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}
          </div>

          {/* ── Sidebar (1/3) ──────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* Inquiry form */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#0066FF] px-5 py-4">
                  <p className="text-white font-bold text-base">Get VIP Access</p>
                  <p className="text-blue-100 text-xs mt-0.5">Priority pricing · First floor selection</p>
                </div>
                <div className="p-5">
                  <InquiryForm
                    projectId={project.id}
                    neighborhoodId={project.neighborhoodId || undefined}
                    source="vip_registration"
                    projectName={project.name}
                  />
                </div>
              </div>

              {/* Legal disclaimer */}
              <p className="text-[10px] text-gray-400 leading-relaxed px-1">
                CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
                Prices, availability and project details are subject to change without notice.
                Not intended to solicit buyers under contract.
              </p>

              {/* Neighbourhood widget */}
              {neighborhood && (
                <Link
                  href={`/new-condos-${neighborhood.slug}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0066FF]/40 hover:shadow-md transition-all group"
                >
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-medium">Neighbourhood</div>
                  <div className="text-gray-900 font-bold text-lg group-hover:text-[#0066FF] transition-colors">
                    {neighborhood.name}
                  </div>
                  {neighborhood.description && (
                    <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {neighborhood.description.slice(0, 120)}…
                    </p>
                  )}
                  <div className="text-[#0066FF] text-sm font-medium mt-3 flex items-center gap-1">
                    View all projects
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Quick project stats card */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 font-medium">Project At a Glance</div>
                <dl className="space-y-2.5">
                  {[
                    { label: 'Status', value: STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] || project.status },
                    { label: 'Type', value: CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] || project.category },
                    { label: 'Developer', value: developer?.name },
                    { label: 'Location', value: neighborhood?.name },
                    { label: 'Occupancy', value: project.estCompletion },
                  ]
                    .filter((item) => item.value)
                    .map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-3 text-sm">
                        <dt className="text-gray-400 shrink-0">{label}</dt>
                        <dd className="text-gray-800 font-medium text-right">{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {(relatedProjects || []).length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                More in {neighborhood?.name || 'This Area'}
              </h2>
              {neighborhood && (
                <Link href={`/new-condos-${neighborhood.slug}`} className="text-sm text-[#0066FF] font-medium hover:underline">
                  View all &rarr;
                </Link>
              )}
            </div>
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
