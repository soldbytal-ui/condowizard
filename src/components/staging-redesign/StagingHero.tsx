import Link from 'next/link';
import { HERO_H1, HERO_SUPPORT } from '@/lib/staging-redesign/content';

export default function StagingHero() {
  return (
    <section className="relative overflow-hidden bg-[#F6F6F3]">
      <div className="relative max-w-[1240px] mx-auto px-5 md:px-8 pt-24 md:pt-28 pb-14 md:pb-20">
        <nav className="text-xs text-text-muted mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent-blue">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text-primary">Staging</span>
        </nav>

        <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 md:gap-12 items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-primary" aria-hidden />
              Coordinated with your listing
            </div>
            <h1 className="font-serif text-[38px] leading-[1.05] md:text-[56px] md:leading-[1.02] text-text-primary tracking-tight">
              {HERO_H1}
            </h1>
            <p className="text-text-primary/75 mt-5 text-base md:text-lg max-w-[540px] leading-relaxed">
              {HERO_SUPPORT}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <a
                href="#consultation"
                className="inline-flex items-center justify-center bg-text-primary text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110 transition-all"
              >
                Request a Seller Consultation
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center justify-center border border-border text-text-primary text-sm font-semibold px-5 py-3 rounded-lg hover:border-text-primary/30 transition-all"
              >
                View Before and After Projects
              </a>
            </div>
          </div>

          {/* Editorial visual placeholder — no stock photography, no gradient.
              A neutral typographic panel that reads as the studio identity. */}
          <div className="hidden md:block">
            <div className="relative aspect-[4/5] w-full max-w-[420px] ml-auto rounded-2xl overflow-hidden border border-border bg-white">
              <div className="absolute inset-0 grid grid-rows-6">
                <div className="row-span-4 bg-[#E9E4DA]" aria-hidden />
                <div className="row-span-2 bg-[#EFEBE1]" aria-hidden />
              </div>
              <div className="absolute inset-x-0 top-0 p-6 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-primary/70">Toronto · 2026</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-primary/70">Vol. 01</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-serif text-2xl md:text-3xl text-text-primary leading-[1.1]">
                  Preparation<br />is the whole
                  <br />
                  <span className="italic">strategy.</span>
                </p>
                <p className="text-[11px] text-text-primary/60 mt-4 max-w-[220px] leading-relaxed">
                  Portfolio photography is added as verified projects are released for publication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
