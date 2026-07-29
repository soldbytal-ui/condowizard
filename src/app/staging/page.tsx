import type { Metadata } from 'next';
import StagingHero from '@/components/staging-redesign/StagingHero';
import ServiceOverview from '@/components/staging-redesign/ServiceOverview';
import Portfolio from '@/components/staging-redesign/Portfolio';
import OccupiedVsVacant from '@/components/staging-redesign/OccupiedVsVacant';
import PrepServices from '@/components/staging-redesign/PrepServices';
import Process from '@/components/staging-redesign/Process';
import CaseStudies from '@/components/staging-redesign/CaseStudies';
import AboutTeam from '@/components/staging-redesign/AboutTeam';
import ConsultationForm from '@/components/staging-redesign/ConsultationForm';
import StagingFAQ from '@/components/staging-redesign/StagingFAQ';
import { SEO_INTRO } from '@/lib/staging-redesign/content';
import {
  stagingBreadcrumbSchema,
  stagingServiceSchema,
  stagingPersonSchema,
  stagingOrganizationSchema,
  stagingFaqSchema,
} from '@/lib/staging-redesign/schema';

export const metadata: Metadata = {
  title: 'Toronto Home Staging & Listing Preparation | CondoWizard',
  description:
    'Professional condo and home staging for Toronto sellers, including occupied and vacant properties, design planning, installation and listing preparation.',
  alternates: { canonical: 'https://condowizard.ca/staging' },
  openGraph: {
    title: 'Toronto Home Staging & Listing Preparation | CondoWizard',
    description:
      'Professional condo and home staging for Toronto sellers, including occupied and vacant properties, design planning, installation and listing preparation.',
    url: 'https://condowizard.ca/staging',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toronto Home Staging & Listing Preparation | CondoWizard',
    description:
      'Professional condo and home staging for Toronto sellers, including occupied and vacant properties, design planning, installation and listing preparation.',
  },
};

export default function StagingPage() {
  const breadcrumb = stagingBreadcrumbSchema();
  const service = stagingServiceSchema();
  const person = stagingPersonSchema();
  const organization = stagingOrganizationSchema();
  const faq = stagingFaqSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <StagingHero />
      <ServiceOverview />
      <Portfolio />
      <OccupiedVsVacant />
      <PrepServices />
      <Process />
      <CaseStudies />
      <AboutTeam />

      <section id="consultation" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 md:gap-14 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Book a consultation</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              Start with a walkthrough
            </h2>
            <p className="text-text-muted mt-4 leading-relaxed max-w-lg">
              The consultation is where the property, timeline and preparation scope are reviewed together. It&rsquo;s the fastest way to understand what your listing actually needs.
            </p>
            <p className="text-text-primary/80 mt-6 text-sm leading-relaxed max-w-lg">
              Prefer to talk first? Call Tal at{' '}
              <a href="tel:6478904082" className="text-text-primary font-semibold hover:underline">647-890-4082</a>
              {' '}or email{' '}
              <a href="mailto:Contact@condowizard.ca" className="text-text-primary font-semibold hover:underline">Contact@condowizard.ca</a>.
            </p>
          </div>
          <ConsultationForm />
        </div>
      </section>

      <StagingFAQ />

      {/* Crawlable service copy — kept short and honest, single paragraph. */}
      <section className="py-10 md:py-14 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[860px] mx-auto text-sm text-text-muted leading-relaxed">
          <p>{SEO_INTRO}</p>
        </div>
      </section>
    </>
  );
}
