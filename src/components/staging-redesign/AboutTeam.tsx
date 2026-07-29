import { TEAM_COPY } from '@/lib/staging-redesign/content';

export default function AboutTeam() {
  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
      <div className="max-w-[1240px] mx-auto grid md:grid-cols-[240px_1fr] gap-8 md:gap-12 items-start">
        <div className="mx-auto md:mx-0">
          <div className="w-[200px] h-[240px] md:w-[240px] md:h-[280px] rounded-2xl bg-gradient-to-br from-[#1F2A44] to-[#111827] flex items-end justify-center overflow-hidden">
            <span className="font-serif text-white text-6xl mb-6" aria-hidden>TS</span>
          </div>
          <p className="text-[11px] text-text-muted mt-3 text-center md:text-left leading-relaxed">
            Professional portrait replaces this placeholder once the current listing photograph is confirmed for use here.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Behind the service</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            {TEAM_COPY.agent.name}, {TEAM_COPY.agent.title}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {TEAM_COPY.agent.brokerage} · {TEAM_COPY.agent.address}
          </p>
          <p className="text-text-primary/80 mt-5 leading-relaxed max-w-2xl">
            {TEAM_COPY.agent.bio}
          </p>
          <p className="text-text-primary/80 mt-4 leading-relaxed max-w-2xl">
            {TEAM_COPY.designTeam}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#consultation" className="inline-flex items-center gap-1 text-sm font-semibold text-text-primary hover:underline">
              Book a consultation →
            </a>
            <a href={`tel:${TEAM_COPY.agent.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/80 hover:text-text-primary">
              {TEAM_COPY.agent.phone}
            </a>
            <a href={`mailto:${TEAM_COPY.agent.email}`} className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/80 hover:text-text-primary">
              {TEAM_COPY.agent.email}
            </a>
          </div>

          <p className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-2xl">
            CondoWizard.ca is operated by {TEAM_COPY.agent.name}, {TEAM_COPY.agent.title} at {TEAM_COPY.agent.brokerage}. Not intended to solicit clients currently under contract with another brokerage.
          </p>
        </div>
      </div>
    </section>
  );
}
