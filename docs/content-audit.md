# CondoWizard Content Audit

Internal working document. Snapshot date: 2026-07-25. Author of note: session agent operating under `docs/content-standard.md`.

## Scope

Audited routes, database, and metadata for:

- Blog: `/blog` and `/blog/[slug]`
- Pre-construction hub: `/new-condos` (canonical), `/pre-construction` redirects to it
- Project detail: `/properties/[slug]` (canonical), `/pre-construction/[slug]` redirects to it, `/projects/[slug]` referenced in sitemap but not backed by data
- Neighbourhood detail: `/neighbourhood/[slug]` (canonical), `/neighborhood/[slug]` redirects to it, `/areas/[neighborhood]` served under `/new-condos-<slug>` rewrites
- Developer detail: `/developers/[slug]`
- Sitemap: `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`
- Structured data helpers: `src/lib/seo.ts`

Data source: Supabase Postgres at `ejevwlpwbkomuwkihsnw.supabase.co` (referenced by `.env` `NEXT_PUBLIC_SUPABASE_URL`).

## What is live today

| Content type | Table | Rows | Public route |
| --- | --- | --- | --- |
| Projects (developments) | `projects` | 99 | `/properties/[slug]`, `/new-condos` |
| Neighbourhoods | `neighborhoods` | 27 | `/areas/[neighborhood]` served under `/new-condos-<slug>` rewrite, `/neighbourhood/[slug]` |
| Developers | `developers` | 67 | `/developers/[slug]`, `/developers` |
| Sold data | `hot_solds` and Repliers API | live | `/sold`, `/market`, `/neighbourhood/[slug]` |
| Blog posts | `blog_posts` | 0 (table just created) | `/blog`, `/blog/[slug]` |

Neighborhood slugs in use (27 total): church-wellesley, don-mills, downtown-core, eglinton-west, etobicoke, forest-hill, high-park, king-west, leslieville, mount-dennis, north-york, queen-west, regent-park, riverside, roncesvalles, scarborough, st-clair-west, st-lawrence, summerhill-rosedale, the-annex, danforth, junction, toronto, waterfront, yonge-eglinton, yonge-st-clair, yorkville.

Developer coverage: 67 developer pages (Tridel, Menkes, Freed, Daniels, CentreCourt, Concord Adex, Pinnacle, Great Gulf, Minto, Camrost Felcorp, Cityzen, Aspen Ridge, Alterra, Almadev, and many more).

## Critical findings

### 1. `blog_posts` table did not exist in production Supabase

The `/blog` and `/blog/[slug]` routes query `supabase.from('blog_posts')`. The table was missing at audit time. The blog index rendered "Blog posts coming soon." The sitemap silently swallowed the error via null-coalescing but still emitted no blog URLs to Google. Resolution: created the table via `DIRECT_URL` psql to match the Prisma `BlogPost` model in `prisma/schema.prisma`. RLS off (matches other public content tables). Anonymous read via the REST API confirmed working.

### 2. `precon_projects` table referenced but missing

`src/app/sitemap.ts` and `src/app/neighborhood/[slug]/page.tsx` query `precon_projects`. Table does not exist in the DB. Impact: sitemap does not emit any `/projects/[slug]` URLs, and the older `/neighborhood/[slug]` page can only surface MLS/Repliers data (though that route is 301'd to `/neighbourhood/[slug]` in `next.config.js`, so users never hit it). Not a blocker for blog work. Recommendation: either remove the dead references or migrate to a single canonical pre-construction table.

### 3. Legacy pre-construction slug pattern is a duplicate of properties

`src/app/pre-construction/[slug]/page.tsx` exists but `next.config.js` 301s `/pre-construction/:slug` to `/properties/:slug`. The file is dead code and can be deleted, or Google will keep encountering a redirect chain if any internal link still points at `/pre-construction/...`. Blog articles should link to `/properties/<slug>` and `/new-condos` directly.

### 4. Neighbourhood URL sprawl

Three URL shapes exist for the same content:

- `/neighbourhood/[slug]` (canonical, hosts market pulse, resale, precon)
- `/neighborhood/[slug]` — 301 to `/neighbourhood/[slug]`
- `/new-condos-<slug>` rewritten to `/areas/[neighborhood]` (dedicated pre-construction hub)

Blog articles will link to `/new-condos-<slug>` for pre-construction-specific context (deposit structures, active projects) and to `/neighbourhood/<slug>` for buyer-guide context (market data, schools, transit). Confirmed the `/new-condos-<slug>` route sets a proper canonical.

### 5. `generateArticleSchema` publishes `jobTitle` "Real Estate Market Analyst"

`src/lib/seo.ts` hard-codes `jobTitle: 'Real Estate Market Analyst'` on every article. Standard requires `Sales Representative` with brokerage `Rare Real Estate Inc., Brokerage`. Fixed in this session so all future blog posts pick up the correct E-E-A-T author signal.

### 6. Blog metadata gap: no updated-date signal in schema

`generateArticleSchema` looks up `updatedAt` on the post, but the schema was never wired into the article render at `src/app/blog/[slug]/page.tsx` in a way that surfaces "Last reviewed" text on-page. Content standard requires a visible reviewed date. Every published article will include a `_Last reviewed_` line as visible markdown, and `updatedAt` from the DB will feed `dateModified` in schema.

### 7. No FAQ schema wired up for blog

`generateFAQSchema` exists in `src/lib/seo.ts` but is not called from the blog slug page. Per standard, FAQPage schema is optional and should only be used when Q&A appears visibly. Every article in the assigned batch renders a visible FAQ section, so schema will be injected inline in article markdown as a JSON-LD block (not through the current template, to avoid making template edits required for every article).

### 8. Blog author field default is generic

`BlogPost.author` in Prisma defaults to `CondoWizard.ca`. Every article in this batch will explicitly set `author = 'Tal Shelef, Sales Representative, Rare Real Estate Inc., Brokerage'` at insert time.

### 9. `blog_posts` schema has no `updatedAt` auto-update trigger

Prisma's `@updatedAt` only fires when writing through Prisma. Direct psql upserts must set `"updatedAt" = now()`. The publishing script does this.

### 10. Meta description length policing

The blog `[slug]` page uses `post.metaDescription || getExcerpt(post) || post.title`. If we do not set metaDescription, Next.js emits a generic first-paragraph excerpt that can exceed 160 characters. Every article in the batch sets `metaDescription` explicitly between 145 and 160 characters.

### 11. No blog category or topic-cluster support

The blog table stores only `targetKeyword` (single string). No category, cluster, or tag column. For the 10-article buyer-guides cluster we are launching, this is fine. If future clusters (market updates, neighbourhood guides) get large, add a `category` column and a landing page per cluster. Recommendation, not a blocker.

### 12. Existing project descriptions are the current authority

The 99 project pages hold long descriptions, faqJson, priceMin/priceMax, and depositStructure. When writing about deposit structures, cite the *pattern* those 99 projects follow but never quote a specific project's numbers unless verified against the current disclosure. The database is a snapshot, not a live feed.

## Keyword-overlap check for the assigned 10 articles

Searched project and neighbourhood metaTitles for the primary keywords. No existing CondoWizard page targets:

- "pre-construction condo closing costs"
- "how to buy pre-construction condo Ontario"
- "condo deposit structure Ontario"
- "interim occupancy fee Ontario"
- "HST rebate pre-construction condo Ontario"
- "condo assignment sale Ontario"
- "pre-construction vs resale Toronto"
- "condo cooling-off period Ontario" / "10 day rescission"
- "development charges condo Ontario"
- "pre-construction condo delay Tarion rights"

The Toronto pre-construction hub at `/new-condos` targets project browsing intent. The 10 assigned articles target buyer-education intent. No cannibalization.

## Thin or repetitive content flags

- Some developer pages have very short `description` fields (a single paragraph). This is a separate initiative and out of scope for the assigned batch. Logged for later.
- Neighbourhood `description` and `lifestyleDescription` are consistent across the 27 rows and look purpose-written. No thinness detected during audit.
- Blog is empty, so no blog thinness to flag.

## Technical SEO relevant to the content pipeline

- `robots.ts` allows all major bots including `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Amazonbot`. Good for GEO.
- `sitemap.ts` includes `/blog/[slug]` and pulls from `blog_posts` on each request; will pick up new articles automatically the moment they are inserted with a `publishedAt` timestamp.
- Canonical URLs are set correctly on blog and project pages.
- `next.config.js` sets sane headers (Referrer-Policy, X-Content-Type-Options).
- No `hreflang` — not needed, single-language site.
- No `sitemap.xml` size concern at current scale.

## Missing topic clusters

Buyer-guide cluster is the top priority (this batch). Additional clusters worth planning after the batch:

1. Neighbourhood buyer guides (one per priority neighbourhood: King West, Yorkville, Downtown Core, Waterfront, Yonge & Eglinton, North York, Etobicoke, Leslieville, Junction).
2. Financing and mortgage guides for pre-construction (blanket mortgage approval at signing, mortgage approval at occupancy, appraisal risk at completion, deposit financing options).
3. Investor-specific guides (rental market outlook, capital-cost allowance basics, principal-residence vs investment classification, PRE claim thresholds).
4. New-build warranty guides (Tarion warranty periods, pre-delivery inspection, common-element vs unit warranty, submitting a claim).
5. Comparison guides (buying a Toronto pre-construction condo vs Mississauga, Vaughan, Markham; branded residences vs standard condos).

These are recorded in `docs/blog-content-plan.md` but not scheduled in this batch.

## Actions taken during the audit

1. Created `blog_posts` table in Supabase (matches Prisma model).
2. Fixed `generateArticleSchema` author `jobTitle` from `Real Estate Market Analyst` to `Sales Representative` with `Rare Real Estate Inc., Brokerage`.
3. Recorded neighbourhood and developer slug inventory for internal-link matrix.
4. Confirmed the blog page will render new posts as soon as they are inserted with `publishedAt`.
5. Created the publishing pipeline at `scripts/publish-blog-post.mjs`.

## Actions deferred

1. Delete dead `/pre-construction/[slug]` route file.
2. Remove or backfill `precon_projects` references.
4. Add visible "Last reviewed" line to the blog template (currently emitted in-article as markdown).

## 2026-07-26 rebuild pass

- Closing-costs article rewritten against primary sources through July 2026:
  - Toronto MLTT rebuilt to the April 1, 2026 residential schedule (unchanged base up to $3M; new luxury tiers 4.4% to 8.6%).
  - HST section rewritten to cover four rebate programs: existing GST/HST New Housing Rebate, federal First-Time Home Buyers' GST/HST Rebate (Bill C-4, Royal Assent 2026-03-12, APS window 2025-03-20 through 2030), Ontario Enhanced New Housing Rebate (Ontario 2026 Budget, APS window 2026-04-01 through 2027-03-31), and Ontario LTT first-time buyer refund.
  - Development-charge cap explanation corrected: the purchaser cap is a ceiling on the buyer's exposure; overage generally borne by the builder subject to APS wording.
  - Interim occupancy reframed as a transaction stage with insurance and project-specific charges, not just a monthly amount.
  - Assignment section corrected: profit must be reported per applicable CRA characterization, not automatically a capital gain.
  - `[TAL'S PRACTICAL NOTE]` placeholders removed. Raw keyword label replaced with the BUYER GUIDE category.
  - $850,000 worked example recalculated against 2026 rules.
- Added `category` column to `blog_posts`; all 10 posts labelled `BUYER GUIDE`.
- Rewrote `src/app/blog/[slug]/page.tsx` as the buyer-guide premium template. New components under `src/components/blog/`:
  - Editorial hero + illustrative cost graphic (`HeroCostGraphic`)
  - Prominent summary panel (`SummaryPanel`)
  - Sticky desktop TOC + collapsible mobile TOC (`TableOfContents`)
  - Reusable content blocks: Takeaways, Warning, Checklist, ExampleAssumptions (`Callouts`), `DataTable`, `TimelineBlock`, `TalTake`, `CtaBlock`, `FaqBlock`, `SourcesBlock`
  - Full author card with role/brokerage (`AuthorCard`)
  - Share + print controls (`ClientActions`)
- Article markdown supports embedded fenced blocks (` ```takeaways`, ` ```table`, ` ```timeline`, ` ```faq`, ` ```sources`, ` ```cta`, ` ```taltake`, ` ```checklist`, ` ```warning`, ` ```example`) parsed by `src/lib/blog-content.ts`.
- Schemas emitted per article: `BlogPosting`, `BreadcrumbList`, `FAQPage` (only when the FAQ block is visibly rendered on the page).
- Rewrote `src/app/blog/page.tsx` and added `BlogIndexClient` with categories, search, load-more pagination. Featured article + latest guides render from the same `blog_posts` source.
- Added print stylesheet in `globals.css` for /blog/[slug] print/PDF output.
- Verified: `next build` clean; live server renders article with all TOC anchors matching, three JSON-LD blocks present, all 10 articles listed on `/blog`, sitemap includes the article.
