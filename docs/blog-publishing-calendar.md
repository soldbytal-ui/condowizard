# CondoWizard Blog Publishing Calendar

Snapshot: 2026-07-25. Governed by `docs/content-standard.md` and `docs/blog-content-plan.md`.

## Cluster 1 execution log

All ten articles ship in this autopilot session. Order matches the assignment. Each article is written, published to Supabase `blog_posts` with `publishedAt` set, and verified to appear on `/blog` and `/blog/<slug>` before moving on.

| Position | Assigned date | Article | Slug | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-07-25 | Pre-Construction Condo Closing Costs in Toronto | `pre-construction-condo-closing-costs-toronto` | ship | Foundation for the entire cluster. Cross-links to interim occupancy, deposits, HST, dev charges. |
| 2 | 2026-07-25 | How Buying a Pre-Construction Condo Works in Ontario | `how-to-buy-pre-construction-condo-ontario` | ship | Process spine. Cross-links to every other cluster piece. |
| 3 | 2026-07-25 | Pre-Construction Condo Deposit Structures | `pre-construction-condo-deposit-structure-ontario` | ship | Deposit protection cited to Tarion. |
| 4 | 2026-07-25 | Interim Occupancy Fees in Ontario | `interim-occupancy-fees-ontario` | ship | Cites Condominium Act 1998 s. 80. |
| 5 | 2026-07-25 | HST on Pre-Construction Condos in Ontario | `hst-pre-construction-condo-ontario` | ship | Cites CRA and Government of Ontario rebate schedules. |
| 6 | 2026-07-25 | Assignment Sales in Ontario | `condo-assignment-sale-ontario` | ship | HST on assignments cited to CRA Excise Tax Act update in effect from 2022. |
| 7 | 2026-07-25 | Pre-Construction Versus Resale Condos in Toronto | `pre-construction-vs-resale-condos-toronto` | ship | Includes original decision table. |
| 8 | 2026-07-25 | Ontario Condo Cooling-Off Period | `ontario-condo-cooling-off-period` | ship | Cites Condominium Act 1998 s. 73. |
| 9 | 2026-07-25 | Development Charges and Builder Adjustments | `development-charges-builder-adjustments-toronto` | ship | Cites City of Toronto DC by-law and provincial Development Charges Act. |
| 10 | 2026-07-25 | Pre-Construction Delays, Cancellations and Tarion Rights | `pre-construction-condo-delays-cancellations-tarion` | ship | Cites Tarion Statement of Critical Dates, delayed-occupancy compensation. |

## Post-publish sweep after each article

1. Article inserted with `publishedAt` set to the assigned date.
2. `metaTitle` and `metaDescription` populated (145 to 160 characters for description).
3. `targetKeyword` populated (matches the primary keyword in the plan).
4. `featuredImage` set to a stable path once original graphics are produced. Until then, published without a hero image so the blog card falls back to the branded gradient tile.
5. Internal links to `/new-condos`, one neighbourhood hub, and one contact page verified in the markdown.
6. Post visible on `/blog` and `/blog/<slug>` on the local build.

## Cadence for subsequent clusters

Cluster 1 completes in one session. After Cluster 1 ships and Tal reviews the `[TAL'S PRACTICAL NOTE: ...]` placeholders, the recommended cadence for Cluster 2 (neighbourhood buyer guides) is:

- 1 article per week, weekday morning, drawing from `docs/blog-content-plan.md`.
- Refresh Cluster 1 articles at 6 and 12 months post-publish. Update `_Last reviewed_` and `updatedAt` timestamps.

## Change log

- 2026-07-25 — Cluster 1 published in autopilot. See `docs/content-audit.md` for pipeline decisions.
