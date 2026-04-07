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

// ─── Section header — inline style so it ALWAYS renders regardless of Tailwind purge ──
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ borderLeft: '3px solid #0066FF', paddingLeft: '14px', marginBottom: '16px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111827', lineHeight: 1.3 }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Section wrapper — light gray bg so sections stand out against white page ──
function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <>
      <section
        id={id}
        style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        {children}
      </section>
      <div style={{ height: '4px' }} />
    </>
  );
}

// ─── Inline divider between paragraphs inside a section ──────────────────────
function TextBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.75 }}>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? '12px' : 0 }}>
          {p}
        </p>
      ))}
    </div>
  );
}

// ─── Bullet list ──────────────────────────────────────────────────────────────
function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', color: '#374151', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          <span style={{ color: '#0066FF', marginTop: '2px', flexShrink: 0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Image helpers ────────────────────────────────────────────────────────────
function parseGalleryImages(
  images: unknown,
  mainImageUrl: string | null,
  projectName: string
): { url: string; alt: string }[] {
  const fallback = mainImageUrl ? [{ url: mainImageUrl, alt: `${projectName} rendering` }] : [];
  if (!images) return fallback;
  if (Array.isArray(images)) {
    if (typeof images[0] === 'string') {
      return (images as string[]).map((url, i) => ({ url, alt: `${projectName} — Image ${i + 1}` }));
    }
    if (typeof images[0] === 'object') {
      return (images as { url?: string; src?: string; alt?: string }[])
        .filter((img) => img?.url || img?.src)
        .map((img, i) => ({ url: (img.url || img.src)!, alt: img.alt || `${projectName} — Image ${i + 1}` }));
    }
  }
  if (typeof images === 'object' && images !== null && 'gallery' in images) {
    const g = (images as { gallery?: string[] }).gallery;
    if (Array.isArray(g)) return g.map((url, i) => ({ url, alt: `${projectName} — Image ${i + 1}` }));
  }
  return fallback;
}

function parseFloorPlanImages(images: unknown): { url: string; alt: string }[] {
  if (!images || typeof images !== 'object' || !('floorPlans' in (images as object))) return [];
  const fp = (images as { floorPlans?: string[] }).floorPlans;
  return Array.isArray(fp) ? fp.map((url, i) => ({ url, alt: `Floor Plan ${i + 1}` })) : [];
}

// ─── Structured content generators ───────────────────────────────────────────
const TRANSIT_BY_SLUG: Record<string, string> = {
  'downtown-core': 'Union Station (Lines 1 & 2, GO Transit, UP Express to Pearson Airport), King and Queen streetcars, full PATH underground network',
  'king-west': 'St. Andrew subway station (Line 1), 504 King streetcar running directly along King Street, Richmond/Adelaide protected cycling lanes',
  'liberty-village': '504 King streetcar at King and Dufferin, Exhibition GO station, direct Gardiner Expressway access westbound',
  'queen-west': '501 Queen streetcar, Osgoode subway station (Line 1), future Ontario Line stop at Queen and Spadina',
  'yorkville': 'Bay station and Bloor-Yonge station (Lines 1 & 2 interchange), bus routes along Bloor Street',
  'the-annex': 'Spadina and St. George stations (Lines 1 & 2 interchange), Bloor Street protected cycling track',
  'midtown': 'Davisville station (Line 1), Mt Pleasant Road and Eglinton bus connections',
  'yonge-eglinton': 'Eglinton station (Line 1) with the new Eglinton Crosstown LRT providing east-west crosstown service, multiple bus routes',
  'leaside': 'Eglinton Crosstown LRT at Laird, Bayview, and Leaside stations — reducing commute times city-wide',
  'leslieville': '501 Queen streetcar, 506 Carlton streetcar, future Ontario Line at Leslieville stop',
  'riverside': '501 Queen streetcar, 506 Carlton streetcar, 504 King streetcar nearby',
  'danforth': 'Pape, Donlands, Greenwood, and Woodbine stations all on Line 2 (Bloor-Danforth subway)',
  'north-york': 'Multiple Line 1 Yonge stations (Sheppard-Yonge, North York Centre, Finch), GO Transit, future Finch West LRT',
  'scarborough': 'Kennedy and Scarborough GO stations, Eglinton Crosstown LRT eastern terminus at Kennedy',
  'etobicoke': 'Kipling GO/TTC interchange station, Bloor-Danforth subway (Line 2), Mississauga MiWay connections',
  'high-park': 'High Park and Keele stations (Line 2), 506 Carlton streetcar on Dundas West',
  'junction': 'Dundas West station (Line 2), future Finch West LRT at Jane and Finch',
  'roncesvalles': '501 Queen streetcar, Dundas West station (Line 2), Howard Park bus routes',
  'waterfront': 'Union Station GO/TTC hub, 509/510 waterfront streetcars, Billy Bishop Island Airport Ferry',
  'cityplace': 'Bathurst and Spadina stations (Line 1), 509/510 waterfront streetcars along Queens Quay',
  'fort-york': 'Bathurst station (Line 1), 509/510 waterfront streetcars',
  'canary-district': 'Future Ontario Line Distillery District stop, 504 and 506 streetcars, West Don Lands trail network',
  'port-lands': '503/504 streetcar access, future Broadview LRT extension into the Port Lands',
  'markham': 'Stouffville GO Train at Unionville and Markham stations, Highway 407 and 404 direct access',
  'mississauga': 'MiWay transit network, GO Train at Port Credit and Cooksville stations, Highway 403 and 410',
  'vaughan': 'Vaughan Metropolitan Centre subway station (Line 1 northern terminus), Highway 400 and 407',
  'richmond-hill': 'Barrie GO Train, Viva rapid transit BRT, Highway 404 access',
  'oakville': 'Oakville GO Train on the Lakeshore West corridor, Highway 403 and QEW access',
};

const LANDMARKS_BY_SLUG: Record<string, string[]> = {
  'downtown-core': ['CN Tower & Rogers Centre', 'Scotiabank Arena', 'St. Lawrence Market', 'Financial District (Bay Street)', 'Ripley\'s Aquarium of Canada'],
  'king-west': ['TIFF Bell Lightbox', 'Royal Alexandra Theatre', 'Drake Hotel', 'Stackt Market', 'Toronto waterfront parks'],
  'liberty-village': ['BMO Field (TFC & Argonauts)', 'Budweiser Stage', 'Canadian National Exhibition grounds', 'Lake Ontario waterfront'],
  'queen-west': ['Trinity Bellwoods Park', 'MOCA Toronto', 'Gladstone House', 'Ossington Avenue strip', 'Drake Hotel'],
  'yorkville': ['Royal Ontario Museum', 'University of Toronto (St. George campus)', 'Mink Mile luxury retail (Bloor St)', 'Hazelton Lanes'],
  'the-annex': ['University of Toronto (St. George campus)', 'Casa Loma', 'Spadina Museum', 'Bloor Street boutiques and restaurants'],
  'midtown': ['Davisville Village', 'Summerhill LCBO (historic train station)', 'Mount Pleasant Cemetery', 'Yonge Street retail corridor'],
  'yonge-eglinton': ['Yonge-Eglinton Centre', 'Eglinton Square', 'Chaplin Estates', 'Midtown\'s best restaurant row (Eglinton Ave)'],
  'leaside': ['Sunnybrook Hospital', 'Leaside Business Park', 'Don Valley bike trails', 'Bayview Village Shopping Centre'],
  'leslieville': ['Leslieville Farmers\' Market', 'Broadview Hotel rooftop', 'Gerrard India Bazaar', 'The Beaches (minutes away)'],
  'riverside': ['Distillery Historic District', 'Corktown Common park', 'Don River Park', 'Canary Wharf waterfront'],
  'danforth': ['Greektown (Pape to Woodbine)', 'Riverdale Farm', 'Withrow Park', 'Broadview Hotel', 'Toronto Islands ferry (Woodbine Beach)'],
  'north-york': ['Mel Lastman Square', 'Toronto Centre for the Arts', 'Fairview Mall', 'York University (Keele Campus)'],
  'scarborough': ['Scarborough Bluffs (Bluffer\'s Park)', 'Toronto Zoo', 'Centennial College', 'University of Toronto Scarborough campus'],
  'etobicoke': ['Humber River trails', 'Centennial Park (400+ acres)', 'Sherway Gardens', 'Long Branch waterfront'],
  'high-park': ['High Park (400+ acres with zoo & cherry blossoms)', 'Grenadier Pond', 'Bloor West Village', 'Roncesvalles Village'],
  'junction': ['Junction Arts District', 'Humber River Recreational Trail', 'The Railpath cycling path'],
  'waterfront': ['Harbourfront Centre', 'Toronto Islands ferry terminal', 'Sugar Beach', 'Billy Bishop Toronto City Airport'],
  'markham': ['Pacific Mall', 'Unionville Historic Village', 'Markham Civic Centre', 'Toogood Pond'],
};

interface ProjectSections {
  about: string;
  locationIntro: string;
  locationTransit: string;
  locationLandmarks: string[];
  locationFooter: string;
  investmentIntro: string;
  investmentWhy: string;
  investmentBullets: string[];
  investmentCta: string;
}

function generateSections(
  project: { name: string; address?: string | null; description?: string | null },
  neighborhood: { name: string; slug: string } | null
): ProjectSections {
  const area = neighborhood?.name || 'Toronto';
  const slug = neighborhood?.slug || '';
  const transit = TRANSIT_BY_SLUG[slug] || 'TTC subway, surface streetcars, and GO Transit regional rail connections serving the broader Toronto area';
  const landmarks = LANDMARKS_BY_SLUG[slug] || ['parks and green spaces', 'local shops and restaurants', 'community services and schools'];

  const about =
    project.description && project.description.length > 80
      ? project.description
      : `${project.name} is a proposed pre-construction condominium development${project.address ? ` at ${project.address}` : ''} in ${area}, Toronto. Developed as part of the city's ongoing residential intensification along transit-connected corridors, this project is currently in its pre-launch phase. Pricing, suite configurations, and floor plans will be announced ahead of the public launch — register now to secure VIP access, first-round pricing, and priority suite selection before the general public.`;

  return {
    about,

    locationIntro: `${project.address ? `Located at ${project.address}, this` : 'This'} development sits in the heart of ${area}, one of Toronto's most in-demand residential communities. The neighbourhood offers a walkable, transit-connected urban lifestyle with a strong mix of local retail, dining, parks, and employment opportunities within easy reach.`,

    locationTransit: transit,

    locationLandmarks: landmarks,

    locationFooter: `${area} consistently ranks among the GTA's top-performing neighbourhoods for pre-construction appreciation. Toronto's ongoing transit investments — including the Eglinton Crosstown LRT, the Ontario Line, and the Finch West LRT — are actively enhancing connectivity and property values across the city's key growth corridors.`,

    investmentIntro: `Toronto remains one of North America's most resilient real estate investment markets. Canada's federal immigration program targets over 400,000 new permanent residents annually, with the Greater Toronto Area absorbing a disproportionate share — sustaining rental demand and purchase activity across all price points.`,

    investmentWhy: `Pre-construction condos in ${area} attract consistent investor demand due to the neighbourhood's transit accessibility, proximity to major employment nodes, and constrained new supply. Data from TRREB and Urbanation confirms that GTA pre-construction purchasers have historically realized significant equity appreciation between signing and final occupancy.`,

    investmentBullets: [
      "Toronto's rental vacancy rate remains well below 2% — sustaining upward pressure on rents and strong yields for investors",
      'Provincial development charges, land constraints, and lengthy approval timelines limit new supply even as demand grows',
      "Ontario's More Homes Built Faster Act is accelerating intensification along transit corridors — exactly where this project is located",
      'Institutional capital from REITs and international investors continues to validate Toronto as a Tier 1 global real estate market',
    ],

    investmentCta: 'Register early to lock in pre-launch pricing and first-round suite selection before the public launch.',
  };
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
  const desc =
    project.metaDescription ||
    project.description?.slice(0, 160) ||
    `${project.name} — new pre-construction condominium in ${area}. ${project.priceMin ? `From ${formatPrice(project.priceMin)}.` : 'Pricing TBA.'} Register for priority access.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
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
      ? [{
          name: (project.neighborhood as { name: string }).name,
          url: `https://condowizard.ca/new-condos-${(project.neighborhood as { slug: string }).slug}`,
        }]
      : []),
    { name: project.name, url: `https://condowizard.ca/pre-construction/${project.slug}` },
  ]);

  const neighborhood = project.neighborhood as { name: string; slug: string; description?: string } | null;
  const developer = project.developer as { name: string; slug: string; description?: string; foundedYear?: number; headquarters?: string } | null;
  const amenities: string[] = Array.isArray(project.amenities) ? (project.amenities as string[]) : [];
  const galleryImages = parseGalleryImages(project.images, project.mainImageUrl, project.name);
  const floorPlanImages = parseFloorPlanImages(project.images);
  const hasPricing = project.priceMin != null;
  const sections = generateSections(project, neighborhood);

  let faqs: { question: string; answer: string }[] = [];
  if (Array.isArray(project.faqJson)) {
    faqs = project.faqJson as { question: string; answer: string }[];
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="container-main pt-28 pb-20">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span>/</span>
          <Link href="/pre-construction" className="hover:text-accent-blue transition-colors">Pre-Construction</Link>
          {neighborhood && (
            <>
              <span>/</span>
              <Link href={`/new-condos-${neighborhood.slug}`} className="hover:text-accent-blue transition-colors">
                {neighborhood.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{project.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Project title block */}
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <StatusBadge status={project.status} />
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] || project.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-2">
                {project.name}
              </h1>
              {project.address && (
                <p className="text-gray-500 text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" style={{ color: '#0066FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {project.address}
                </p>
              )}
              {developer && (
                <p className="text-gray-500 text-sm mt-1">
                  by{' '}
                  <Link href={`/developers/${developer.slug}`} className="font-medium hover:underline" style={{ color: '#0066FF' }}>
                    {developer.name}
                  </Link>
                </p>
              )}
            </div>

            {/* Hero image */}
            <div className="rounded-xl overflow-hidden" style={{ height: '400px', background: '#F3F4F6' }}>
              {project.mainImageUrl ? (
                <img
                  src={project.mainImageUrl}
                  alt={`${project.name} exterior`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E5E7EB, #D1D5DB)' }}>
                  <span style={{ color: '#9CA3AF', fontWeight: 700, fontSize: '4rem' }}>{project.name[0]}</span>
                </div>
              )}
            </div>

            {/* ── Section 1: Overview ─────────────────────────────────────── */}
            <Section id="overview">
              <SectionHeader title="Overview" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
                   className="sm:grid-cols-4">
                {[
                  { label: 'Starting Price', value: hasPricing ? formatPriceRange(project.priceMin, project.priceMax) : 'Pricing TBA', blue: hasPricing },
                  { label: 'Total Units', value: project.totalUnits ? `${project.totalUnits.toLocaleString()} Suites` : 'TBD', blue: false },
                  { label: 'Storeys', value: project.floors ? `${project.floors} Floors` : 'TBD', blue: false },
                  { label: 'Est. Occupancy', value: project.estCompletion || 'TBD', blue: false },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: stat.blue ? '#EBF2FF' : '#FFFFFF',
                      border: `1px solid ${stat.blue ? '#0066FF40' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: stat.blue ? '#0066FF' : '#111827' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {(project.unitTypes || project.architect || project.depositStructure) && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {project.unitTypes && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Unit Types</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{project.unitTypes}</div>
                    </div>
                  )}
                  {project.architect && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Architect</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{project.architect}</div>
                    </div>
                  )}
                  {project.depositStructure && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '3px' }}>Deposit</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{project.depositStructure}</div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* ── Section 2: About this Development ───────────────────────── */}
            <Section id="about">
              <SectionHeader title="About this Development" />
              <TextBody paragraphs={[sections.about]} />

              {amenities.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 600, marginBottom: '12px' }}>
                    Amenities
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {amenities.map((a: string) => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#374151' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0066FF', flexShrink: 0 }} />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* ── Section 3: Location & Neighbourhood ─────────────────────── */}
            <Section id="location">
              <SectionHeader title="Location &amp; Neighbourhood" />

              <TextBody paragraphs={[sections.locationIntro]} />

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 600, marginBottom: '8px' }}>
                  Transit Access
                </div>
                <p style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.7, margin: 0 }}>
                  {sections.locationTransit}.
                </p>
              </div>

              {sections.locationLandmarks.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 600, marginBottom: '12px' }}>
                    Nearby
                  </div>
                  <BulletList items={sections.locationLandmarks} />
                </div>
              )}

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <TextBody paragraphs={[sections.locationFooter]} />
              </div>

              {neighborhood && (
                <div style={{ marginTop: '16px' }}>
                  <Link
                    href={`/new-condos-${neighborhood.slug}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0066FF', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                    className="hover:underline"
                  >
                    View all pre-construction projects in {neighborhood.name}
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </Section>

            {/* ── Section 4: Investment Potential ─────────────────────────── */}
            <Section id="investment">
              <SectionHeader title="Investment Potential" />
              <TextBody paragraphs={[sections.investmentIntro]} />

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <TextBody paragraphs={[sections.investmentWhy]} />
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 600, marginBottom: '12px' }}>
                  Key Market Drivers
                </div>
                <BulletList items={sections.investmentBullets} />
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <p style={{ color: '#0066FF', fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                  {sections.investmentCta}
                </p>
              </div>
            </Section>

            {/* ── Section 5: About the Developer ──────────────────────────── */}
            {developer && (
              <Section id="developer">
                <SectionHeader title="About the Developer" />
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '10px',
                    background: '#EBF2FF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    color: '#0066FF', fontWeight: 700, fontSize: '1.25rem',
                  }}>
                    {developer.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/developers/${developer.slug}`}
                      style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', textDecoration: 'none' }}
                      className="hover:text-accent-blue transition-colors"
                    >
                      {developer.name}
                    </Link>
                    {(developer.headquarters || developer.foundedYear) && (
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '2px 0 8px' }}>
                        {[developer.headquarters, developer.foundedYear ? `Est. ${developer.foundedYear}` : null].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, margin: '0 0 12px' }}>
                      {developer.description ||
                        `${developer.name} is an active developer in the Greater Toronto Area pre-construction market, delivering quality residential communities across the city.`}
                    </p>
                    <Link
                      href={`/developers/${developer.slug}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0066FF', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                      className="hover:underline"
                    >
                      View all projects by {developer.name}
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </Section>
            )}

            {/* ── Section 6: Floor Plans ───────────────────────────────────── */}
            <Section id="floorplans">
              <SectionHeader title="Floor Plans" />
              {floorPlanImages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {floorPlanImages.map((fp, i) => (
                    <div key={i} style={{ aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', background: '#E5E7EB' }}>
                      <img src={fp.url} alt={fp.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '40px 24px',
                  textAlign: 'center', background: '#FFFFFF',
                }}>
                  <svg width="44" height="44" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <p style={{ fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Floor Plans Not Yet Available</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                    Register below to receive floor plans as soon as they are released.
                  </p>
                </div>
              )}
            </Section>

            {/* ── Section 7: Gallery ───────────────────────────────────────── */}
            <Section id="gallery">
              <SectionHeader title="Gallery" />
              {galleryImages.length > 0 ? (
                <ImageGallery images={galleryImages} projectName={project.name} />
              ) : (
                <div style={{
                  border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '40px 24px',
                  textAlign: 'center', background: '#FFFFFF',
                }}>
                  <svg width="44" height="44" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p style={{ fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Renderings Coming Soon</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Official renderings will be published at launch.</p>
                </div>
              )}
            </Section>

            {/* ── Section 8: Schedule a Private Showing ───────────────────── */}
            <Section id="showing">
              <SectionHeader title="Schedule a Private Showing" />
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', marginBottom: '20px', lineHeight: 1.6 }}>
                Connect with a CondoWizard advisor for a VIP preview, floor plan walkthrough, and personalized investment analysis. All inquiries are confidential.
              </p>
              <InquiryForm
                projectId={project.id}
                neighborhoodId={project.neighborhoodId || undefined}
                source="showing_request"
                projectName={project.name}
              />
            </Section>

            {/* FAQ if available */}
            {faqs.length > 0 && (
              <Section id="faq">
                <SectionHeader title="Frequently Asked Questions" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {faqs.map((faq, i) => (
                    <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #E5E7EB' : 'none', paddingBottom: i < faqs.length - 1 ? '16px' : 0 }}>
                      <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', marginBottom: '6px' }}>{faq.question}</p>
                      <p style={{ color: '#374151', fontSize: '0.9375rem', lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div>
            <div className="lg:sticky lg:top-24" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* VIP registration card */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ background: '#0066FF', padding: '16px 20px' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Get VIP Access</p>
                  <p style={{ color: '#BFDBFE', fontSize: '0.8125rem', margin: '3px 0 0' }}>Priority pricing · First floor selection</p>
                </div>
                <div style={{ background: '#FFFFFF', padding: '20px' }}>
                  <InquiryForm
                    projectId={project.id}
                    neighborhoodId={project.neighborhoodId || undefined}
                    source="vip_registration"
                    projectName={project.name}
                  />
                </div>
              </div>

              {/* Legal disclaimer */}
              <p style={{ fontSize: '10px', color: '#9CA3AF', lineHeight: 1.6, padding: '0 4px' }}>
                CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
                Prices, availability, and project details are subject to change. Not intended to solicit buyers under contract.
              </p>

              {/* Neighbourhood widget */}
              {neighborhood && (
                <Link
                  href={`/new-condos-${neighborhood.slug}`}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px',
                    padding: '18px 20px', transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                    className="hover:border-accent-blue/40 hover:shadow-md transition-all"
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>Neighbourhood</div>
                    <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111827', marginBottom: '6px' }}>{neighborhood.name}</div>
                    {neighborhood.description && (
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.55, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {neighborhood.description.slice(0, 120)}…
                      </p>
                    )}
                    <span style={{ color: '#0066FF', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View all projects
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )}

              {/* Quick stats */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 500, marginBottom: '12px' }}>At a Glance</div>
                <dl style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Status', value: STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] || project.status },
                    { label: 'Category', value: CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] || project.category },
                    { label: 'Developer', value: developer?.name },
                    { label: 'Neighbourhood', value: neighborhood?.name },
                    { label: 'Occupancy', value: project.estCompletion },
                  ].filter((i) => i.value).map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <dt style={{ fontSize: '0.8125rem', color: '#9CA3AF', flexShrink: 0 }}>{label}</dt>
                      <dd style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', textAlign: 'right', margin: 0 }}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Related projects */}
        {(relatedProjects || []).length > 0 && (
          <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111827' }}>
                More in {neighborhood?.name || 'This Area'}
              </h2>
              {neighborhood && (
                <Link href={`/new-condos-${neighborhood.slug}`} className="text-sm font-medium hover:underline" style={{ color: '#0066FF' }}>
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
