import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VOW Terms of Use',
  description: 'Virtual Office Website Terms of Use for CondoWizard.ca MLS listing data access.',
};

export default function VowTermsPage() {
  return (
    <div className="pt-20 pb-16 container-main max-w-3xl">
      <h1 className="text-3xl font-bold text-text-primary mb-6">VOW Terms of Use</h1>
      <p className="text-text-muted mb-8">Virtual Office Website (VOW) Terms — Required for access to MLS listing data</p>

      <div className="prose prose-sm text-text-muted space-y-4">
        <p>By registering on CondoWizard.ca, you acknowledge and agree to the following:</p>

        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Lawful Broker-Consumer Relationship.</strong> You are entering into a lawful broker-consumer relationship with Tal Shelef, Sales Representative, Rare Real Estate Inc., Brokerage.</li>

          <li><strong>Personal Use Only.</strong> All MLS&reg; data obtained from this website is intended only for your personal, non-commercial use.</li>

          <li><strong>Bona Fide Interest.</strong> You have a bona fide interest in the purchase, sale, or lease of real estate of the type being offered through this website.</li>

          <li><strong>No Redistribution.</strong> You will not copy, redistribute, retransmit, or otherwise use any of the data or listing information provided, except in connection with your consideration of the purchase, sale, or lease of an individual property.</li>

          <li><strong>TRREB Ownership.</strong> You acknowledge the Toronto Regional Real Estate Board (TRREB)&apos;s ownership of, and the validity of TRREB&apos;s proprietary rights and copyright in the MLS&reg; database, MLS&reg; data, TRREB&apos;s MLS&reg; System, and Listing Information.</li>

          <li><strong>Verification Access.</strong> You authorize TRREB, and other TRREB Members or their duly authorized representatives, to access this website for the purposes of verifying compliance with MLS&reg; Rules and Policies.</li>

          <li><strong>Information Accuracy.</strong> The information displayed on this website is deemed reliable but is not guaranteed accurate by TRREB.</li>

          <li><strong>Data Retention.</strong> Your registration information and activity records will be retained for a minimum of 180 days as required by TRREB regulations.</li>
        </ol>

        <div className="border-t border-border pt-6 mt-8">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Brokerage Information</h2>
          <p><strong>Brokerage:</strong> Rare Real Estate Inc.</p>
          <p><strong>Agent:</strong> Tal Shelef, Sales Representative</p>
          <p><strong>Address:</strong> 1701 Avenue Rd, Toronto, ON M5M 3Y3</p>
          <p><strong>Phone:</strong> 647-890-4082</p>
          <p><strong>Email:</strong> Contact@condowizard.ca</p>
        </div>
      </div>
    </div>
  );
}
