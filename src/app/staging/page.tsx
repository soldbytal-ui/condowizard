import type { Metadata } from 'next';
import Link from 'next/link';
import { generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';
import StagingClient from './StagingClient';
import StagingInquiryForm from './StagingInquiryForm';

export const metadata: Metadata = {
  title: 'Professional Condo & Home Staging in Toronto | CondoWizard',
  description:
    'Stage your condo or home to sell faster and for more. Professional staging included when you list with CondoWizard. 3x more views, 17 days fewer on market, 5-10% higher sale price.',
  alternates: { canonical: 'https://condowizard.ca/staging' },
  openGraph: {
    title: 'Stage your condo. Sell for more. | CondoWizard',
    description:
      'Free professional staging when you list with CondoWizard. Condos, homes, and vacant properties.',
    url: 'https://condowizard.ca/staging',
  },
};

const FAQS = [
  {
    question: 'How much does staging cost when I list with CondoWizard?',
    answer:
      'Professional staging is included at no additional cost when you list your property with CondoWizard. We cover the consultation, design plan, furnishings, and styling — it is part of our full-service listing package.',
  },
  {
    question: 'How long does the staging process take?',
    answer:
      'Most condos are staged within 3-5 business days from the consultation. Larger homes and vacant properties typically take 5-7 days. We coordinate around your timeline to have the property photo-ready before it hits the MLS.',
  },
  {
    question: 'Do I need to move out for staging?',
    answer:
      'No. For occupied homes, we work alongside your existing furniture and add accent pieces, art, and styling. For vacant properties, we bring in a full furniture package to help buyers visualize the space.',
  },
  {
    question: 'Does staging really help my property sell?',
    answer:
      'Yes. Staged properties receive 3x more showings on average, sell 17 days faster, and typically achieve 5-10% higher sale prices compared to unstaged listings. It is one of the highest-ROI steps you can take before going to market.',
  },
];

const SERVICES = [
  {
    id: 'condo',
    title: 'Condo Staging',
    stat: '3x',
    statLabel: 'more showings',
    description:
      'Purpose-built for Toronto condos. We maximize every square foot with furniture that makes small spaces feel open, bright, and aspirational.',
    features: [
      'Space-saving furniture selection',
      'Accent styling for kitchens & bathrooms',
      'Lighting & art placement',
      'MLS-ready photography prep',
    ],
  },
  {
    id: 'home',
    title: 'Home Staging',
    stat: '5-10%',
    statLabel: 'higher sale price',
    description:
      'Full-service staging for detached, semis, and townhomes. We blend your existing pieces with curated additions to appeal to the widest buyer pool.',
    features: [
      'Room-by-room design plan',
      'Declutter & depersonalize guidance',
      'Curb appeal enhancements',
      'Neutral color palette styling',
    ],
  },
  {
    id: 'vacant',
    title: 'Vacant Property Staging',
    stat: '17',
    statLabel: 'days faster',
    description:
      'Empty properties sell slower and for less. Our full furniture packages transform vacant spaces into move-in ready homes buyers can imagine themselves in.',
    features: [
      'Complete furniture package',
      'Art, accessories & soft goods',
      'Install & removal included',
      'Up to 60 days coverage',
    ],
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Consultation',
    desc: 'We visit your property, understand your timeline, and identify the highest-impact staging opportunities.',
  },
  {
    num: '02',
    title: 'Design Plan',
    desc: 'Our stylists build a room-by-room plan tailored to your target buyer and neighborhood.',
  },
  {
    num: '03',
    title: 'Transformation',
    desc: 'Furniture, art, and accessories arrive and are installed in a single day — minimal disruption to you.',
  },
  {
    num: '04',
    title: 'Market Ready',
    desc: 'Professional photos, MLS listing goes live, and showings begin. We manage pickup when you sell.',
  },
];

export default function StagingPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Staging', url: 'https://condowizard.ca/staging' },
  ]);
  const faqSchema = generateFAQSchema(FAQS);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="pt-14 bg-bg min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-accent-blue via-[#2E7BFF] to-[#0A4FCC] text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
          <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white">Staging</span>
            </nav>
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-4 border border-white/20">
                Included with your listing
              </span>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                Stage your condo.<br />
                <span className="text-white/90">Sell for more.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/85 mt-6 max-w-2xl leading-relaxed">
                Professional staging included when you list with CondoWizard. Our design team helps condos,
                homes, and vacant properties sell faster and for a premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <a
                  href="#consultation"
                  className="bg-white text-accent-blue text-base font-semibold px-7 py-4 rounded-lg hover:bg-white/95 transition-all inline-flex items-center justify-center gap-2"
                >
                  Book a free consultation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href="tel:6478904082"
                  className="border border-white/30 bg-white/5 backdrop-blur-sm text-white text-base font-semibold px-7 py-4 rounded-lg hover:bg-white/10 transition-all inline-flex items-center justify-center"
                >
                  Call 647-890-4082
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 bg-accent-blue/10 text-accent-blue text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                Staging tailored to your property
              </h2>
              <p className="text-text-muted mt-3 text-lg">
                Three distinct packages, all included with your CondoWizard listing.
              </p>
            </div>
            <StagingClient services={SERVICES} />
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 px-6 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 bg-accent-blue/10 text-accent-blue text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Process
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">How it works</h2>
              <p className="text-text-muted mt-3 text-lg">
                From first consultation to market-ready in under a week.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="relative bg-surface rounded-2xl border border-border p-6 hover:border-accent-blue/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="font-serif text-4xl font-bold text-accent-blue/20 mb-2">{step.num}</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-3 text-accent-blue/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats banner */}
        <section className="py-16 md:py-20 px-6 bg-footer-bg text-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Staging works. The numbers prove it.</h2>
              <p className="text-white/60 mt-3 text-lg">
                Independent industry data from the Real Estate Staging Association and NAR.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { value: '3x', label: 'more listing views', sub: 'vs. unstaged properties' },
                { value: '17', label: 'days fewer on market', sub: 'average time saved' },
                { value: '5-10%', label: 'higher sale price', sub: 'typical staging ROI' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm"
                >
                  <p className="font-serif text-5xl md:text-6xl font-bold text-white">{s.value}</p>
                  <p className="text-lg font-semibold text-white mt-3">{s.label}</p>
                  <p className="text-sm text-white/60 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ + Form */}
        <section id="consultation" className="py-16 md:py-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* FAQ */}
            <div>
              <span className="inline-block px-3 py-1 bg-accent-blue/10 text-accent-blue text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                Common staging questions
              </h2>
              <p className="text-text-muted mb-8 text-lg">
                Still have questions? Call Tal at 647-890-4082.
              </p>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="lg:pl-6">
              <div className="sticky top-20">
                <StagingInquiryForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white rounded-xl border border-border overflow-hidden">
      <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none hover:bg-surface transition-colors">
        <h3 className="font-semibold text-text-primary text-base">{question}</h3>
        <svg
          className="w-5 h-5 text-accent-blue flex-shrink-0 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed border-t border-border pt-4">
        {answer}
      </div>
    </details>
  );
}
