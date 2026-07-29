// Standalone RECO / brokerage disclosure card. Content is unchanged from
// the previous inline block — it's just given its own container so it reads
// as a compliance disclosure rather than a footer scrap.

interface Props {
  mlsNumber: string;
}

export default function RecoCard({ mlsNumber }: Props) {
  return (
    <section
      aria-label="Brokerage and MLS disclosures"
      className="mt-10 bg-white border border-border rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase bg-text-primary text-white px-2 py-1 rounded">
          RECO Disclosure
        </span>
        <span className="text-[11px] text-text-muted">Regulated by the Real Estate Council of Ontario</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-xs text-text-muted leading-relaxed">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Representative</p>
          <p className="text-text-primary font-medium mt-1">Tal Shelef, Sales Representative</p>
          <p>Rare Real Estate Inc., Brokerage</p>
          <p>1701 Avenue Rd, Toronto, ON M5M 3Y3</p>
          <p className="mt-1">
            <a href="tel:6478904082" className="text-text-primary hover:underline">647-890-4082</a>
            {' · '}
            <a href="mailto:Contact@condowizard.ca" className="text-text-primary hover:underline">Contact@condowizard.ca</a>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Data source</p>
          <p className="mt-1">
            Listing information is provided by the Toronto Regional Real Estate Board (TRREB) via the Repliers feed and is deemed reliable but not guaranteed. MLS<sup>®</sup> reference: <span className="font-mono text-text-primary">{mlsNumber}</span>.
          </p>
          <p className="mt-2 text-[11px]">
            Sold and pending prices are displayed to registered members under a TRREB VOW (Virtual Office Website) agreement. Not intended to solicit sellers currently under contract with another brokerage.
          </p>
        </div>
      </div>
    </section>
  );
}
