import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for CondoWizard.ca. Read our terms governing the use of our real estate platform.',
  alternates: {
    canonical: 'https://condowizard.ca/terms',
  },
  openGraph: {
    title: 'Terms of Service | CondoWizard.ca',
    description: 'Terms of Service governing the use of CondoWizard.ca real estate platform.',
    url: 'https://condowizard.ca/terms',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <div className="container-main pt-24 pb-16 max-w-4xl">
      <nav className="text-sm text-text-muted mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
        <span className="text-text-muted/30">/</span>
        <span className="text-text-primary font-medium">Terms of Service</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Terms of Service</h1>
      <p className="text-sm text-text-muted mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. About CondoWizard.ca</h2>
          <p>
            CondoWizard.ca (&quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., a licensed Ontario real estate brokerage. The Platform aggregates and displays information about pre-construction real estate projects in the Greater Toronto Area. We provide this information for educational and informational purposes.
          </p>
          <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-5 mt-4">
            <p className="text-sm font-medium text-accent-blue mb-2">Regulatory Compliance</p>
            <p className="text-sm">
              CondoWizard.ca is operated under the Real Estate Council of Ontario (RECO) regulations. All real estate services are provided through Rare Real Estate Inc., Brokerage.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Acceptance of Terms</h2>
          <p>
            By accessing or using CondoWizard.ca, you agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>. If you do not agree to these terms, you must not use the Platform. You must be at least 18 years of age to use this Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. Informational Purposes Only</h2>
          <p className="mb-3">All information displayed on the Platform, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Property pricing, price ranges, and price-per-square-foot estimates</li>
            <li>Floor counts, unit counts, unit sizes, and floor plans</li>
            <li>Estimated completion dates and construction timelines</li>
            <li>Amenity lists, building features, and specifications</li>
            <li>Developer information, track records, and project histories</li>
            <li>Neighbourhood descriptions, market analyses, and investment commentary</li>
            <li>Images, renderings, and visual representations</li>
          </ul>
          <p className="mt-3">
            is provided <strong className="text-text-primary">for informational purposes only</strong> and is subject to change without notice. Prices shown are approximate and based on publicly available information. Actual prices, availability, specifications, and completion dates may vary materially from what is displayed on the Platform.
          </p>
          <p className="mt-3">
            <strong className="text-text-primary">You should independently verify all information</strong> displayed on the Platform before making any decisions. We strongly recommend consulting with licensed real estate professionals, attorneys, financial advisors, and other qualified professionals before entering into any real estate transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Real Estate Services</h2>
          <p>
            Real estate services provided through CondoWizard.ca are facilitated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage, registered with the Real Estate Council of Ontario (RECO). Any representation or transaction services are subject to the terms and conditions of a separate buyer representation agreement or other applicable agreements as required under Ontario real estate law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Inquiry Forms and Communications</h2>
          <p className="mb-3">
            When you submit an inquiry form on the Platform, your information (name, email address, phone number, and any message you include) will be received by our team to assist you with your real estate inquiry.
          </p>
          <p>
            You should independently verify any information provided and ensure you understand the terms of any agreements before entering into a real estate transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Third-Party Content and Data</h2>
          <p>
            The Platform may display information sourced from third-party websites, public records, developer marketing materials, and other external sources. We do not guarantee the accuracy, completeness, timeliness, or reliability of any third-party data. We are not responsible for any errors, omissions, or misrepresentations in third-party content displayed on the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Intellectual Property</h2>
          <p>
            The Platform&apos;s design, layout, text, graphics, and other content are the property of CondoWizard.ca or its licensors. Images and renderings of real estate projects are the property of their respective developers and are displayed for informational purposes. You may not reproduce, distribute, or create derivative works from the Platform&apos;s content without our prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">8. Limitation of Liability</h2>
          <p className="mb-3">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CONDOWIZARD.CA AND ITS OWNERS, OPERATORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Your use of or reliance on information displayed on the Platform</li>
            <li>Any real estate transaction you enter into based on information found on the Platform</li>
            <li>Any inaccuracies, errors, or omissions in the information displayed</li>
            <li>Any loss of data, revenue, profits, or business opportunities</li>
          </ul>
          <p className="mt-3 text-sm">
            IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED ONE HUNDRED CANADIAN DOLLARS ($100 CAD).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">9. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless CondoWizard.ca and its owners, operators, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to your use of the Platform or your violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">10. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. Any disputes arising out of or related to these Terms or your use of the Platform shall be resolved exclusively in the courts located in Toronto, Ontario. You consent to the personal jurisdiction of such courts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">11. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will indicate the date of the last update at the top of this page. Your continued use of the Platform after any modifications constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">12. Contact</h2>
          <p>
            For questions about these Terms of Service, please <Link href="/contact-us" className="text-accent-blue hover:underline">contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
