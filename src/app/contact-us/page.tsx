export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import InquiryForm from '@/components/projects/InquiryForm';
import { generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with CondoWizard.ca. We help buyers and investors navigate Toronto pre-construction condos.',
  alternates: {
    canonical: 'https://condowizard.ca/contact-us',
  },
  openGraph: {
    title: 'Contact CondoWizard.ca',
    description: 'Get in touch with our team. We help buyers and investors navigate Toronto pre-construction condos.',
    url: 'https://condowizard.ca/contact-us',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact CondoWizard.ca',
    description: 'Get in touch. We help buyers and investors navigate Toronto pre-construction condos.',
  },
};

export default function ContactPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Contact Us', url: 'https://condowizard.ca/contact-us' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    <div className="container-main pt-24 pb-10">
      <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
        <span className="text-text-muted/30">/</span>
        <span className="text-text-primary font-medium">Contact Us</span>
      </nav>
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Contact CondoWizard.ca</h1>
        <p className="text-text-muted mt-2">We&apos;d love to hear from you. Reach out and we&apos;ll get back within 24 hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Inquiry Form */}
        <div className="glass-panel p-0 overflow-hidden">
          <InquiryForm source="contact" />
        </div>

        {/* Location Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Our Office</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Location</p>
                <p className="text-text-primary">Toronto, Ontario</p>
              </div>
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Email</p>
                <a href="mailto:Contact@condowizard.ca" className="text-accent-blue hover:underline">
                  Contact@condowizard.ca
                </a>
              </div>
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Phone</p>
                <a href="tel:6478904082" className="text-accent-blue hover:underline">
                  647-890-4082
                </a>
              </div>
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Hours</p>
                <p className="text-text-primary">Monday - Friday: 9am - 6pm EST</p>
                <p className="text-text-muted text-sm">Weekend appointments available</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">What We Can Help With</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-accent-blue mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Finding the right pre-construction project for your budget and goals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-blue mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Understanding deposit structures and payment timelines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-blue mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Comparing neighborhoods and developments across the Greater Toronto Area</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-blue mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Investment analysis and ROI projections for pre-construction units</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-blue mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Scheduling private showroom visits and virtual tours</span>
              </li>
            </ul>
          </div>

          <div className="card p-4 text-center">
            <p className="text-sm text-text-muted">Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage</p>
          </div>
        </div>
      </div>

      {/* Office Location Map */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Location</h2>
        <div className="rounded-2xl overflow-hidden border border-border">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+3B82F6(-79.4127,43.7275)/-79.4127,43.7275,15,0/1200x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            alt="Office location - 1701 Avenue Rd, Toronto, ON M5M 3Y3"
            className="w-full h-[300px] object-cover"
          />
        </div>
        <p className="text-sm text-text-muted mt-3">1701 Avenue Rd, Toronto, ON M5M 3Y3</p>
      </div>
    </div>
    </>
  );
}
