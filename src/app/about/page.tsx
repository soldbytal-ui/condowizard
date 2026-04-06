export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { generateBreadcrumbSchema, generateOrganizationSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'CondoWizard.ca is Toronto\'s premier marketplace for new construction condos. We help buyers access pre-launch pricing across 200+ developments.',
  alternates: {
    canonical: 'https://condowizard.ca/about',
  },
  openGraph: {
    title: 'About CondoWizard.ca',
    description: 'Toronto\'s premier marketplace for new construction condos. We help buyers access pre-launch pricing across 200+ developments.',
    url: 'https://condowizard.ca/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About CondoWizard.ca',
    description: 'Toronto\'s premier marketplace for new construction condos. Connecting buyers with 200+ developments.',
  },
};

export default function AboutPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'About', url: 'https://condowizard.ca/about' },
  ]);
  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
    <div className="container-main pt-24 pb-10 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">About CondoWizard.ca</h1>

      <div className="space-y-8">
        <div className="glass-panel p-8">
          <p className="text-text-muted text-lg leading-relaxed">
            CondoWizard.ca is the Greater Toronto Area&apos;s most comprehensive pre-construction condo marketplace.
            We connect buyers and investors with 200+ new developments across Toronto, Mississauga, Vaughan, and across the GTA
            -- from ultra-luxury branded residences in King West to emerging developments in the Port Lands and beyond.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">What We Do</h2>
          <p className="text-text-muted leading-relaxed">
            We aggregate every active pre-construction project in the Greater Toronto Area into one searchable platform.
            Each listing includes detailed specifications, pricing, deposit structures, floor plans, amenities,
            developer information, and estimated completion dates -- everything you need to make an informed decision.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Why Pre-Construction?</h2>
          <p className="text-text-muted leading-relaxed mb-4">
            Buying pre-construction offers unique advantages that resale properties simply cannot match:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h3 className="text-accent-blue font-semibold mb-1">Below-market pricing</h3>
              <p className="text-text-muted text-sm">Lock in today&apos;s prices and build equity as the project develops</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-blue font-semibold mb-1">Customization</h3>
              <p className="text-text-muted text-sm">Choose your preferred unit, floor, view, and finishes</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-blue font-semibold mb-1">Brand new</h3>
              <p className="text-text-muted text-sm">Latest amenities, technology, and design -- never lived in</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-blue font-semibold mb-1">Flexible payments</h3>
              <p className="text-text-muted text-sm">Spread your deposit over 18-30 months during construction</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Why Toronto?</h2>
          <p className="text-text-muted leading-relaxed">
            Toronto has cemented its position as Canada&apos;s largest real estate market. With a diverse economy,
            world-class transit (TTC, GO Transit), top universities, and over 100,000 new residents annually,
            demand for quality housing continues to outpace supply. Pre-construction allows buyers to participate in this
            growth at the earliest possible stage.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Our Commitment</h2>
          <p className="text-text-muted leading-relaxed">
            We are committed to providing transparent, accurate, and up-to-date information on every project we feature.
            Our data is sourced directly from developers, public records, and verified market reports.
            We believe that informed buyers make better decisions -- and that&apos;s what drives everything we do.
          </p>
        </div>
      </div>

      <div className="mt-12 glass-panel p-8 text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-3">Have Questions?</h3>
        <p className="text-text-muted mb-6">We&apos;re here to help you navigate the pre-construction process.</p>
        <Link href="/contact-us" className="btn-primary">Get in Touch</Link>
      </div>

      <div className="mt-8 text-center text-sm text-text-muted">
        <p>CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.</p>
      </div>
    </div>
    </>
  );
}
