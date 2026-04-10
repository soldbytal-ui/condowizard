import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AIRBNB_BUILDINGS, getBuildingBySlug, parseAddress } from '@/data/airbnb-buildings';
import BuildingProfile from './BuildingProfile';
import { generateBreadcrumbSchema } from '@/lib/seo';

interface Props { params: { slug: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getBuildingBySlug(params.slug);
  if (!b) return { title: 'Building Not Found' };
  const title = `${b.buildingName || b.address} | Airbnb-Friendly Condo | ${b.registrations} STR Registrations`;
  const desc = `Find units for sale and rent at ${b.address}. This building has ${b.registrations} Airbnb registrations. View active MLS listings, prices, and investment analysis.`;
  return { title, description: desc, alternates: { canonical: `https://condowizard.ca/airbnb-friendly/${b.slug}` } };
}

export function generateStaticParams() {
  return AIRBNB_BUILDINGS.map((b) => ({ slug: b.slug }));
}

export default function BuildingPage({ params }: Props) {
  const building = getBuildingBySlug(params.slug);
  if (!building) notFound();

  const parsed = parseAddress(building.address);
  const similar = AIRBNB_BUILDINGS
    .filter((b) => b.slug !== building.slug && b.neighbourhood === building.neighbourhood)
    .slice(0, 4);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Airbnb-Friendly Condos', url: 'https://condowizard.ca/airbnb-friendly' },
    { name: building.buildingName || building.address, url: `https://condowizard.ca/airbnb-friendly/${building.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="pt-16 bg-bg min-h-screen">
        <div className="container-main py-8">
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Link href="/" className="hover:text-accent-blue">Home</Link><span>/</span>
            <Link href="/airbnb-friendly" className="hover:text-accent-blue">Airbnb-Friendly</Link><span>/</span>
            <span className="text-text-primary">{building.buildingName || building.address}</span>
          </nav>

          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{building.buildingName || building.address}</h1>
              {building.buildingName && <p className="text-lg text-text-muted mt-1">{building.address}</p>}
              <p className="text-sm text-text-muted mt-1">{building.neighbourhood} · {building.ward}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
              <p className="font-serif text-3xl font-bold text-red-600">{building.registrations}</p>
              <p className="text-xs text-red-500 font-medium">Airbnb Registrations</p>
            </div>
          </div>

          {/* Live MLS data — client component */}
          <BuildingProfile building={building} parsedAddress={parsed} />

          {/* Similar buildings */}
          {similar.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-text-primary mb-4">Similar Airbnb-Friendly Buildings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {similar.map((s) => (
                  <Link key={s.slug} href={`/airbnb-friendly/${s.slug}`} className="bg-white rounded-xl border border-border p-4 hover:border-accent-blue/30 transition-colors">
                    <h3 className="font-semibold text-sm text-text-primary">{s.buildingName || s.address}</h3>
                    {s.buildingName && <p className="text-xs text-text-muted">{s.address}</p>}
                    <p className="text-xs text-text-muted mt-1">{s.neighbourhood}</p>
                    <p className="font-serif font-bold text-red-600 mt-2">{s.registrations} <span className="text-xs font-normal text-text-muted">registrations</span></p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Airbnb disclaimer */}
          <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <p className="font-medium mb-1">Important Disclaimer</p>
            <p>Registration count indicates tolerance for short-term rentals, not a guarantee of permission. Always verify with your condo corporation before listing on Airbnb. Toronto requires STR registration and limits entire-unit rentals to 180 nights/year.</p>
          </div>

          {/* RECO */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          </div>
        </div>
      </div>
    </>
  );
}
