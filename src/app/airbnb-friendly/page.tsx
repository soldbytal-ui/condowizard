import type { Metadata } from 'next';
import Link from 'next/link';
import { AIRBNB_BUILDINGS, TOTAL_REGISTRATIONS, TOTAL_BUILDINGS } from '@/data/airbnb-buildings';
import { generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import AirbnbClient from './AirbnbClient';

export const metadata: Metadata = {
  title: 'Airbnb-Friendly Condos in Toronto 2026 | Buildings Ranked by STR Registrations',
  description: `Find Toronto condos that allow Airbnb. ${TOTAL_BUILDINGS} buildings ranked by short-term rental registrations. See active MLS listings for sale and rent in each building.`,
  alternates: { canonical: 'https://condowizard.ca/airbnb-friendly' },
  openGraph: {
    title: 'Airbnb-Friendly Condos in Toronto 2026',
    description: `${TOTAL_BUILDINGS} buildings ranked by STR registrations with live MLS listings.`,
    url: 'https://condowizard.ca/airbnb-friendly',
  },
};

const FAQS = [
  { question: 'Which Toronto condos allow Airbnb?', answer: `There are ${TOTAL_BUILDINGS} condo buildings in Toronto with active short-term rental registrations. The building with the most registrations is 300 Front St W with 237 registered units. However, registration does not guarantee permission — always verify with your condo corporation.` },
  { question: 'How many condos in Toronto are registered for Airbnb?', answer: `As of 2026, approximately ${TOTAL_REGISTRATIONS.toLocaleString()} condo units across ${TOTAL_BUILDINGS} buildings have short-term rental registrations with the City of Toronto.` },
  { question: 'Can my condo board ban Airbnb?', answer: 'Yes. Ontario courts have upheld condo corporations\' right to restrict or prohibit short-term rentals through by-laws. Even if the city allows STR registration, your condo board may have rules that prohibit it.' },
  { question: 'What is the 180-night cap?', answer: 'Toronto\'s short-term rental by-law limits operators to renting their primary residence for a maximum of 180 nights per calendar year. This applies to entire-unit rentals, not private room rentals where the host is present.' },
];

export default function AirbnbPage() {
  const hotBuildings = AIRBNB_BUILDINGS.filter((b) => b.registrations >= 100).length;
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Airbnb-Friendly Condos', url: 'https://condowizard.ca/airbnb-friendly' },
  ]);
  const faqSchema = generateFAQSchema(FAQS);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="pt-16 bg-bg min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-b from-surface to-bg py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link href="/" className="hover:text-accent-blue">Home</Link><span>/</span>
              <span className="text-text-primary">Airbnb-Friendly Condos</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Airbnb-Friendly Condos in Toronto</h1>
            <p className="text-text-muted mt-2 text-lg max-w-2xl">{TOTAL_BUILDINGS} buildings ranked by short-term rental registrations. Find condos where Airbnb is allowed.</p>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg">
              <div className="bg-white rounded-xl border border-border p-4 text-center">
                <p className="font-serif text-2xl font-bold text-accent-blue">{TOTAL_REGISTRATIONS.toLocaleString()}</p>
                <p className="text-xs text-text-muted mt-1">Registered Units</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4 text-center">
                <p className="font-serif text-2xl font-bold text-text-primary">{TOTAL_BUILDINGS}</p>
                <p className="text-xs text-text-muted mt-1">Buildings</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4 text-center">
                <p className="font-serif text-2xl font-bold text-red-500">{hotBuildings}</p>
                <p className="text-xs text-text-muted mt-1">With 100+ Units</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive building list + map */}
        <AirbnbClient buildings={AIRBNB_BUILDINGS} />

        {/* Info content */}
        <section className="py-12 px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Before You Start: Toronto Airbnb Rules</h2>
            <div className="space-y-4 text-sm text-text-muted leading-relaxed">
              <p><strong>Registration Required:</strong> All short-term rental operators in Toronto must register with the City and obtain an STR number. Registration costs $50/year.</p>
              <p><strong>Primary Residence Only:</strong> You can only list your primary residence on Airbnb. Investment properties cannot be used for short-term rentals.</p>
              <p><strong>180-Night Cap:</strong> Entire-unit rentals are limited to 180 nights per year. Private room rentals (while host is present) have no cap.</p>
              <p><strong>Condo Board Rules:</strong> Even with city registration, your condo corporation may prohibit short-term rentals. Always check your condo by-laws before listing.</p>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-text-primary">{faq.question}</h3>
                  <p className="text-sm text-text-muted mt-2">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-6 bg-white border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-3">Interested in Investing?</h2>
            <p className="text-text-muted mb-6">Contact Tal Shelef for expert guidance on buying an Airbnb-friendly condo in Toronto.</p>
            <div className="flex gap-3 justify-center">
              <a href="tel:6478904082" className="bg-accent-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-blue/90">Call 647-890-4082</a>
              <Link href="/contact-us" className="border border-border text-text-primary px-6 py-3 rounded-lg font-medium hover:border-accent-blue/30">Contact Form</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
