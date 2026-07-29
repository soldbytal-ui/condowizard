'use client';

// Small support cards that sit below the primary agent/contact card in the
// sticky right column. Each card links to an existing anchor or route — no
// new endpoints or forms.

interface Props {
  mlsNumber: string;
  address: string;
}

export default function SidebarSupport({ mlsNumber, address }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <SupportCard
        title="Book a private showing"
        subtitle="Schedule a walk-through at a time that works for you."
        cta="Book showing"
        href={`mailto:Contact@condowizard.ca?subject=${encodeURIComponent(`Showing request — MLS ${mlsNumber}`)}&body=${encodeURIComponent(`Hi Tal,\n\nI'd like to book a showing for ${address} (MLS ${mlsNumber}).\n\nMy preferred times:\n\nThanks,\n`)}`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      <SupportCard
        title="Ask a question"
        subtitle="Get a quick answer about this property by text or email."
        cta="Text Tal"
        href="sms:6478904082"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a8 8 0 11-3-6.244L21 4l-1 4.5A7.97 7.97 0 0121 12z" />
          </svg>
        }
      />
      <SupportCard
        title="Request a market evaluation"
        subtitle="Considering selling or trading up? Start with a comparative pricing review."
        cta="Request evaluation"
        href={`mailto:Contact@condowizard.ca?subject=${encodeURIComponent('Property evaluation request')}`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" />
          </svg>
        }
      />
    </div>
  );
}

function SupportCard({
  title,
  subtitle,
  cta,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group block bg-white border border-border rounded-xl p-4 hover:border-text-primary/25 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-text-primary/8 flex items-center justify-center text-text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{subtitle}</p>
          <p className="text-xs font-medium text-accent-blue mt-2 group-hover:underline">{cta} →</p>
        </div>
      </div>
    </a>
  );
}
