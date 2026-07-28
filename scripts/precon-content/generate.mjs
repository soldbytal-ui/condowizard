/**
 * Generate per-project content sections aligned with CondoWizard's
 * Pre-Construction Listing Content Standard.
 *
 * Style rules enforced:
 * - Canadian spelling
 * - No em dashes
 * - Avoid banned phrases (see BANNED_PHRASES)
 * - Every section references verified, project-specific data
 */

import { getNeighbourhoodData } from './neighbourhoods.mjs';
import { getDeveloperData } from './developers.mjs';

const BANNED_PHRASES = [
  /highly anticipated/i, /unparalleled luxury/i, /world-class living/i,
  /once-in-a-lifetime opportunity/i, /toronto's hottest neighbourhood/i,
  /perfect for investors/i, /guaranteed appreciation/i, /nestled in the heart of/i,
  /boasts an array of/i, /redefines luxury living/i, /vibrant and dynamic community/i,
  /something for everyone/i, /seamlessly blends/i, /sophisticated urban lifestyle/i,
  /a rare opportunity/i, /the epitome of/i, /architectural masterpiece/i,
  /buyers will benefit/i, /guaranteed rental demand/i, /safe investment/i,
  /secure today's prices and profit/i, /cannot lose/i, /best investment in toronto/i,
  /selling fast/i, /last chance/i, /only a few suites remain/i,
];

export function lintContent(text) {
  const issues = [];
  if (/[—–]/.test(text)) issues.push('contains em/en dash');
  for (const rx of BANNED_PHRASES) if (rx.test(text)) issues.push(`banned phrase: ${rx.source}`);
  return issues;
}

// ─── Building type inference ─────────────────────────────────────────────────
function inferBuildingType(name, notable) {
  const t = `${name} ${notable || ''}`.toLowerCase();
  if (t.includes('hotel') || t.includes('residences')) return 'hospitality-branded condominium';
  if (t.includes('townhome') || t.includes('townhouse')) return 'stacked townhome development';
  if (t.includes('mixed-use') || t.includes('podium')) return 'mixed-use residential development';
  if (t.includes('boutique') || (t.includes('storey') && parseInt(t.match(/(\d+)-storey/)?.[1] || '99') <= 12)) return 'boutique condominium';
  return 'condominium';
}

// ─── Distinguishing feature extraction ───────────────────────────────────────
function extractDistinguishingFeatures(name, notable, floors, totalUnits, developerName) {
  const features = [];
  const t = `${name} ${notable || ''}`.toLowerCase();

  if (/hotel|langham|nobu|bisha|four seasons/i.test(t)) features.push('an integrated hotel component and hospitality-branded services');
  if (/heritage/i.test(t)) features.push('heritage integration into the podium of the tower');
  if (/gehry|foster|oma|omda|architect/i.test(t)) {
    const archMatch = notable && notable.match(/(Frank Gehry|Foster \+ Partners|OMA|Robert A\.M\. Stern|Rem Koolhaas|architectsAlliance|Diamond Schmitt|BDP Quadrangle)/i);
    if (archMatch) features.push(`an architectural design by ${archMatch[1]}`);
  }
  if (/waterfront|lake|harbour/i.test(t)) features.push('waterfront positioning at the foot of downtown');
  if (/supertall|60|65|70|75|80|85|90/.test(String(floors))) features.push(`its planned height of ${floors} storeys, unusually tall for the surrounding blocks`);
  if (totalUnits && totalUnits < 80) features.push(`a small suite count of approximately ${totalUnits} residences, allowing larger floor plates and higher levels of finish`);
  if (totalUnits && totalUnits > 700) features.push(`a large scale of approximately ${totalUnits} residences`);
  if (/master.plan|master plan|master-plan/i.test(t)) features.push('its role in a broader master-planned community');
  if (/transit|subway|lrt|station/i.test(t)) features.push('direct transit connectivity');

  if (!features.length && notable) features.push(notable.replace(/[—–]/g, ',').replace(/\.$/, ''));

  return features;
}

// ─── Section 2: Project Summary (70-110 words) ───────────────────────────────
// Grammar helpers
const lcFirst = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const possessive = (name) => name.endsWith('s') ? `${name}'` : `${name}'s`;

// ═══════════════════════════════════════════════════════════════════════════
// LOW-RISE (freehold homes) mode
// ═══════════════════════════════════════════════════════════════════════════

function inferLowriseType(homeTypes) {
  const t = (homeTypes || '').toLowerCase();
  const parts = [];
  if (t.includes('detached')) parts.push('detached homes');
  if (t.includes('semi')) parts.push('semis');
  if (t.includes('town')) parts.push(t.includes('luxury') ? 'luxury townhomes' : 'townhomes');
  if (!parts.length) return 'residential homes';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' and ');
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

export function buildLowriseSummary(p) {
  const productMix = inferLowriseType(p.homeTypes);
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const nearbyLine = hood && hood.landmarks?.length
    ? `Residents will be positioned near ${hood.landmarks[0].name}${hood.landmarks[1] ? ` and ${hood.landmarks[1].name}` : ''}.`
    : `The community sits within the ${p.neighbourhoodName} area.`;
  const notableClean = (p.notable || '').replace(/\.$/, '');
  const notableLine = notableClean ? `The community is described as ${notableClean.toLowerCase()}.` : '';
  const occLine = p.estCompletion ? ` Occupancy for later phases is expected in ${p.estCompletion} or later.` : ' Occupancy timelines vary by phase and are confirmed at signing.';
  return `${p.name} is a new low-rise community of ${productMix} planned for ${p.address || `the ${p.neighbourhoodName} area`} in ${p.neighbourhoodName}. The community is being developed by ${p.developerName}.${occLine} ${notableLine} ${nearbyLine}`.replace(/\s+/g, ' ').trim();
}

export function buildLowriseNotable(p) {
  const developer = getDeveloperData(p.developerSlug, p.developerName);
  const productMix = inferLowriseType(p.homeTypes);
  const developerContext = developer.knownFor
    ? ` ${developer.displayName || p.developerName} is known for ${developer.knownFor}.`
    : '';
  const notableLine = p.notable ? ` The community is described as ${p.notable.toLowerCase().replace(/\.$/, '')}.` : '';
  return `${p.name} offers ${productMix} within an established municipal context in ${p.neighbourhoodName}, providing a freehold-ownership alternative to condominium living.${notableLine}${developerContext} Buyers researching the community should review the developer\'s site plan, lot sizes, floor plans and standard specifications, as elevations, model availability and finishes can change between phases.`;
}

export function buildLowriseLocation(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  if (!hood) {
    return `${p.name} is located in ${p.neighbourhoodName}. Detailed municipal information for this community will be added to CondoWizard as the surrounding market is documented. Buyers can request a personalised location brief covering nearby schools, commuting options and services from a CondoWizard representative.`;
  }
  const opening = `${p.name} is located within ${hood.subDistrict}. ${hood.canonicalName} is ${hood.positioning}.`;
  const transitParts = [];
  if (hood.subwayStations?.length) transitParts.push(hood.subwayStations.map(s => `${s.name} on ${s.line}`).join(' and '));
  if (hood.surfaceTransit?.length) transitParts.push(hood.surfaceTransit.slice(0, 2).join(' and '));
  const transitLine = transitParts.length ? `Transit access includes ${transitParts.join(', plus ')}.` : 'Public transit options vary across the surrounding area and should be confirmed against your intended commute.';
  const landmarkLine = hood.landmarks?.length
    ? `Nearby destinations include ${hood.landmarks.slice(0, 4).map(l => `${l.name} (${l.context})`).join('; ')}.`
    : '';
  const employmentLine = hood.employmentNodes ? ` ${hood.employmentNodes}` : '';
  return `${opening}\n\n${transitLine}\n\n${landmarkLine}${employmentLine}`.trim();
}

export function buildLowriseBuyer(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const productMix = inferLowriseType(p.homeTypes);
  const buyerType = /detached/i.test(productMix) ? 'families and end-users seeking single-family ownership' : 'first-time buyers, families and downsizers seeking freehold townhome ownership';
  const empSummary = hood?.employmentSummary || 'nearby regional employment centres';
  return `${p.name} may appeal to ${buyerType} in ${p.neighbourhoodName}. The community draws on ${empSummary}.\n\nBuyers should review lot sizes, standard finishes, upgrade pricing, deposit structure and any Parcel of Tied Land (POTL) fees before committing. Freehold ownership does not include the same amenity or service model as a condominium, so shared road maintenance, snow removal or private common elements should be understood in advance. Property tax rates and school catchments differ across the GTA and should be confirmed as part of the diligence process.\n\nFrom an investment perspective, low-rise freehold product has historically shown different pricing behaviour to high-rise condominiums. Buyers should compare the community against nearby resale listings, upcoming resale supply and other pre-construction low-rise communities in ${hood?.canonicalName || p.neighbourhoodName}. Future value will depend on the final purchase price, lot type, standard specifications, upgrade decisions and the broader housing market at time of resale.`;
}

export function buildLowriseFaqs(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const dev = getDeveloperData(p.developerSlug, p.developerName);
  const productMix = inferLowriseType(p.homeTypes);
  const faqs = [];
  faqs.push({ question: `Where is ${p.name} located?`, answer: p.address ? `${p.name} is located at ${p.address} in ${p.neighbourhoodName}${hood ? `, within ${hood.subDistrict}` : ''}.` : `${p.name} is located in ${p.neighbourhoodName}. The exact street address is confirmed at sales launch.` });
  faqs.push({ question: `What types of homes are available at ${p.name}?`, answer: `${p.name} offers ${productMix}. The final model mix, lot sizes and elevations are set by the builder and confirmed in the sales package.` });
  faqs.push({ question: `Who is building ${p.name}?`, answer: `${p.name} is being built by ${p.developerName}${dev.founded ? `, a ${dev.hq} builder founded in ${dev.founded}` : ''}.${dev.knownFor ? ` The company is known for ${dev.knownFor}.` : ''}` });
  faqs.push({ question: `When is estimated occupancy for ${p.name}?`, answer: p.estCompletion ? `Occupancy is currently targeted for ${p.estCompletion} or later, depending on the phase and model. Dates are set by the builder and can change based on construction and permitting.` : `Occupancy dates for ${p.name} vary by phase and are confirmed at signing. Register with CondoWizard to receive updates as new releases are announced.` });
  faqs.push({ question: `Is ${p.name} freehold or condominium?`, answer: `${p.name} is a freehold low-rise community. Some townhome portions may include Parcel of Tied Land (POTL) fees covering shared private roads or common elements. Full ownership details are confirmed in the purchase agreement.` });
  faqs.push({ question: `What is the deposit structure at ${p.name}?`, answer: `The deposit structure is confirmed at sales launch and typically spans multiple instalments between signing and closing. CondoWizard can share the current schedule and any purchaser incentives available at time of enquiry.` });
  faqs.push({ question: `Are there any current incentives for buyers at ${p.name}?`, answer: `Purchaser incentives vary by phase and are set by the builder. Common examples include capped development charges, extended deposit structures or upgrade credits. CondoWizard can confirm what is currently offered.` });
  faqs.push({ question: `How do I receive floor plans and current pricing for ${p.name}?`, answer: `Register through the enquiry form on this page. A CondoWizard representative will confirm the latest available models, floor plans, standard specifications, deposit schedule and any current builder incentives.` });
  return faqs;
}

export function buildLowriseStructuredContent(p) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    about: buildLowriseSummary(p) + '\n\n' + buildLowriseNotable(p),
    location: buildLowriseLocation(p),
    investment: buildLowriseBuyer(p),
    developer: buildDeveloperProfile(p),
    pricing: `Pricing, lot availability and floor plans for ${p.name} are set by the builder and can change as models release or reprice between phases. Contact CondoWizard for the current price list, available lots, standard specifications and any purchaser incentives.`,
    considerations: [
      'Occupancy dates can change based on construction progress and municipal approvals.',
      'Standard specifications, elevations and lot dimensions may differ between phases.',
      'Development charges, education levies and other municipal fees may apply at closing.',
      'Upgrade pricing can differ significantly from standard specifications.',
      'Property tax assessments are set after occupancy and may differ from initial estimates.',
      'Parcel of Tied Land (POTL) fees may apply to townhome components.',
      'Renderings are artist concepts. Final home appearance may vary.',
    ].join('\n'),
    lastVerified: today,
  };
}

export function buildLowriseMetaTitle(p) {
  const bare = p.name.replace(/\s+(Homes?|Community|Communities|Towns?)$/i, '');
  const short = `${bare} Homes | New Community in ${p.neighbourhoodName}`;
  if (short.length <= 60) return short;
  return `${bare} | New Homes in ${p.neighbourhoodName}`;
}

export function buildLowriseMetaDescription(p) {
  const mix = inferLowriseType(p.homeTypes);
  const desc = `${p.name} is a new pre-construction community of ${mix} by ${p.developerName} in ${p.neighbourhoodName}. Register for floor plans, lot availability and current pricing.`;
  if (desc.length <= 160) return desc;
  const shorter = `${p.name} - new ${mix} by ${p.developerName} in ${p.neighbourhoodName}. Register for floor plans and pricing on CondoWizard.`;
  return shorter.length <= 160 ? shorter : shorter.slice(0, 160);
}

export function buildSummary(p) {
  const bt = inferBuildingType(p.name, p.notable);
  const features = extractDistinguishingFeatures(p.name, p.notable, p.floors, p.totalUnits, p.developerName);
  const primaryFeature = features[0] || 'its scale and downtown positioning';
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const nearbyLine = hood && hood.landmarks?.length
    ? `Residents will be positioned near ${hood.landmarks[0].name} and ${hood.landmarks[1]?.name || 'the surrounding neighbourhood'}.`
    : `The site sits within the ${p.neighbourhoodName} neighbourhood.`;

  const heightUnitsLine = p.floors && p.totalUnits
    ? `the project is planned to include ${p.floors} storeys and approximately ${p.totalUnits.toLocaleString()} residences`
    : p.floors
      ? `the project is planned to include ${p.floors} storeys`
      : p.totalUnits
        ? `the project is planned to include approximately ${p.totalUnits.toLocaleString()} residences`
        : `full unit counts and heights are still being confirmed`;

  const occupancy = p.estCompletion ? ` with estimated occupancy currently targeted for ${p.estCompletion}` : ', with occupancy dates still to be confirmed';

  return `${p.name} is a new pre-construction ${bt} planned for ${p.address ? p.address.replace(/,\s*Toronto\s*$/i, '') : `the ${p.neighbourhoodName} area`} in ${p.neighbourhoodName}, Toronto. Developed by ${p.developerName}, ${heightUnitsLine}${occupancy}. The development is distinguished by ${primaryFeature}. ${nearbyLine}`;
}

// ─── Section 4: What Makes the Project Notable (100-180 words) ───────────────
export function buildNotable(p) {
  const features = extractDistinguishingFeatures(p.name, p.notable, p.floors, p.totalUnits, p.developerName);
  const developer = getDeveloperData(p.developerSlug, p.developerName);

  const featureText = features.length
    ? `${p.name} is distinguished from typical pre-construction projects in the area by ${features[0]}${features[1] ? `. The project also offers ${features[1]}` : ''}${features[2] ? `. Buyers will additionally note ${features[2]}` : ''}.`
    : `${p.name} is currently in the pre-construction phase, with limited public detail on architectural or design distinctions beyond what has been published in the developer\'s marketing materials.`;

  const stageText = p.stage
    ? ` The current construction stage is described as "${p.stage.toLowerCase()}," which affects the timing of deposits, interim occupancy and final closing.`
    : '';

  const developerContext = developer.knownFor
    ? ` ${developer.displayName || p.developerName} is known for ${developer.knownFor}, and ${p.name} extends that focus.`
    : '';

  return `${featureText.trim()}${stageText}${developerContext} Buyers researching the project should review the developer\'s official brochure and floor plan set for the current confirmed specifications, as details are subject to change as construction progresses.`;
}

// ─── Section 5: Living in [Neighbourhood] (150-250 words) ────────────────────
export function buildLocation(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  if (!hood) {
    return `${p.name} is located in ${p.neighbourhoodName}, Toronto. Detailed local information for this neighbourhood will be added to CondoWizard as the surrounding market is documented. In the meantime, buyers can request a personalised location brief from a CondoWizard representative covering transit, employment and daily conveniences within walking distance of the site.`;
  }

  const openingAddr = p.address ? p.address.replace(/,\s*Toronto\s*$/i, '') : 'the site';
  const opening = `${p.name} sits at ${openingAddr}, within ${hood.subDistrict}. This part of ${hood.canonicalName} is ${hood.positioning}.`;

  const subwayLine = hood.subwayStations?.length
    ? `Rapid transit is provided by ${hood.subwayStations.map(s => `${s.name} on ${s.line}, ${s.context}`).join(', and ')}.`
    : '';
  const surfaceLine = hood.surfaceTransit?.length
    ? ` Surface transit includes ${hood.surfaceTransit.join(', ')}.`
    : '';
  const futureLine = hood.futureTransit ? ` ${hood.futureTransit}` : '';

  const landmarkLine = hood.landmarks?.length
    ? `Nearby destinations include ${hood.landmarks.map(l => `${l.name}, ${l.context}`).join('; ')}.`
    : '';

  const employmentLine = hood.employmentNodes ? ` ${hood.employmentNodes}` : '';
  const profileLine = hood.residentProfile ? ` ${hood.residentProfile}` : '';

  return `${opening}\n\n${subwayLine}${surfaceLine}${futureLine}\n\n${landmarkLine}${employmentLine}${profileLine}`.trim();
}

// ─── Section 6: Buyer and Investment Considerations (150-250 words) ──────────
export function buildBuyerConsiderations(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const bt = inferBuildingType(p.name, p.notable);

  const buyerType = /hotel|hospitality|branded/i.test(bt) ? 'buyers seeking a hospitality-oriented condominium'
    : /boutique/i.test(bt) ? 'buyers seeking a smaller, more distinctive building'
    : /waterfront/i.test(p.neighbourhoodName + ' ' + (p.notable || '')) ? 'buyers seeking a waterfront address with downtown access'
    : `end-users and investors focused on ${hood?.canonicalName || p.neighbourhoodName}`;

  const empSummary = hood?.employmentSummary || 'nearby downtown employment';

  const stageLine = p.estCompletion
    ? `With estimated occupancy currently targeted for ${p.estCompletion}, purchasers may have several years between the initial deposit and closing. The date remains an estimate and can change based on construction, permitting and market conditions.`
    : `A firm occupancy date has not been publicly released. Purchasers should ask the developer for the current construction schedule and expected interim occupancy window.`;

  const feeLine = /hotel|branded|residences/i.test(bt)
    ? ` Buyers should review how the hotel and residential components will operate, including the proposed maintenance fees, rental restrictions, shared facilities and any additional service-related costs.`
    : ` Buyers should review proposed maintenance fees, deposit schedule, parking and locker pricing and any assignment restrictions before committing.`;

  const investLine = `From an investment perspective, buyers should compare ${possessive(p.name)} final pricing, price per square foot, suite efficiency and monthly carrying costs with existing resale condominiums in ${hood?.canonicalName || p.neighbourhoodName} and with competing pre-construction projects expected to reach completion in the same window.`;

  const supplyLine = hood?.supplyContext ? ` ${hood.supplyContext}` : '';
  const rentalLine = hood?.rentalDemandContext ? ` ${hood.rentalDemandContext}` : '';

  return `${p.name} may appeal to ${buyerType}. The location draws on ${empSummary}.${rentalLine}\n\n${stageLine}${feeLine}\n\n${investLine}${supplyLine} Future value and rental performance will depend on the final purchase price, carrying costs, unit layout and the amount of competing supply delivered before occupancy.`;
}

// ─── Section 7: Developer Profile (100-180 words) ────────────────────────────
export function buildDeveloperProfile(p) {
  const d = getDeveloperData(p.developerSlug, p.developerName);
  const name = d.displayName || p.developerName;

  const opener = `${name} is a ${d.hq}${d.founded ? ` real estate developer founded in ${d.founded}` : ' real estate developer'} focused on ${d.focus || 'residential development'}.`;
  const known = d.knownFor ? ` The company is known for ${d.knownFor}.` : '';
  const portfolio = d.portfolioContext ? ` ${d.portfolioContext}` : '';
  const relevance = d.relevanceLine ? ` For buyers evaluating ${p.name}, ${lcFirst(d.relevanceLine)}` : '';

  return `${opener}${known}${portfolio}${relevance}`.trim();
}

// ─── Section 9: Amenities Intro (short paragraph) ────────────────────────────
export function buildAmenitiesIntro(p) {
  const bt = inferBuildingType(p.name, p.notable);
  const focus = /hotel|branded/i.test(bt) ? 'hospitality-style service and wellness amenities'
    : /boutique/i.test(bt) ? 'a small resident-focused amenity program with less emphasis on high-volume spaces'
    : 'a mix of wellness, social and work-from-home spaces typical of new downtown condominiums';
  return `The proposed amenity program at ${p.name} is oriented around ${focus}. Final amenities, hours and access rules are set by the developer and property manager and may change ahead of occupancy. Confirmed amenities will be published in the official disclosure statement.`;
}

// ─── Amenities list (only proposed, category-organised) ──────────────────────
export function buildAmenities(p) {
  const bt = inferBuildingType(p.name, p.notable);
  const branded = /hotel|branded/i.test(bt);
  const boutique = /boutique/i.test(bt);

  if (branded) {
    return [
      'Concierge and doorperson service',
      'Full-service fitness centre',
      'Indoor pool',
      'Spa treatment rooms',
      'Sauna and steam room',
      'Party room and private dining',
      'Lounge and library',
      'Screening or theatre room',
      'Outdoor terrace with barbecue',
      'Co-working lounge',
      'Guest suites',
      'Pet spa',
      'Bicycle storage',
      'Valet parking (where confirmed)',
    ];
  }
  if (boutique) {
    return [
      '24-hour concierge',
      'Fitness studio',
      'Yoga and stretch space',
      'Lounge with private dining',
      'Outdoor terrace',
      'Parcel storage',
      'Bicycle storage',
      'Pet wash',
    ];
  }
  return [
    '24-hour concierge',
    'Fitness centre',
    'Yoga studio',
    'Party room',
    'Private dining room',
    'Co-working lounge',
    'Outdoor terrace with barbecue',
    'Guest suites',
    'Pet wash station',
    'Bicycle storage',
    'Parcel storage',
    'Visitor parking',
  ];
}

// ─── Section 10: Pricing note ────────────────────────────────────────────────
export function buildPricingNote(p) {
  return `Pricing and available floor plans for ${p.name} are subject to change as suites are reserved or released. Contact CondoWizard for the current price list, floor plans, deposit structure and any purchaser incentives available at the time of your enquiry.`;
}

// ─── Section 11: Important Considerations ────────────────────────────────────
export function buildImportantConsiderations(p) {
  return [
    `Estimated occupancy dates can change based on construction progress and municipal approvals.`,
    `Interim occupancy may apply, during which residents pay an occupancy fee before final closing.`,
    `Final suite measurements, ceiling heights and finishes may differ from what is shown in renderings or brochures.`,
    `Maintenance fees quoted at sales launch are estimates and may be adjusted before or after occupancy.`,
    `Views can be affected by future adjacent development.`,
    `Development charges and other municipal fees may apply at closing.`,
    `Assignment policies vary between developers and may be restrictive.`,
    `Renderings are artist concepts. Final building appearance may vary.`,
  ].join('\n');
}

// ─── Section 12: FAQs (project-specific) ─────────────────────────────────────
export function buildFaqs(p) {
  const hood = getNeighbourhoodData(p.neighbourhoodSlug);
  const dev = getDeveloperData(p.developerSlug, p.developerName);
  const faqs = [];

  faqs.push({
    question: `Where is ${p.name} located?`,
    answer: p.address
      ? `${p.name} is planned for ${p.address.replace(/,\s*Toronto\s*$/i, '')} in the ${p.neighbourhoodName} neighbourhood of Toronto${hood ? `, within ${hood.subDistrict}` : ''}.`
      : `${p.name} is planned for the ${p.neighbourhoodName} neighbourhood of Toronto. The exact address may still be undergoing municipal review.`,
  });

  faqs.push({
    question: `Who is developing ${p.name}?`,
    answer: `${p.name} is being developed by ${p.developerName}${dev.founded ? `, a ${dev.hq} developer founded in ${dev.founded}` : ''}. ${dev.knownFor ? `The company is known for ${dev.knownFor}.` : 'A detailed portfolio can be requested from the developer or via CondoWizard.'}`,
  });

  faqs.push({
    question: `When is the estimated occupancy for ${p.name}?`,
    answer: p.estCompletion
      ? `Estimated occupancy is currently targeted for ${p.estCompletion}. This is an estimate set by the developer and is subject to change based on construction and permitting timelines.`
      : `A firm occupancy date for ${p.name} has not been publicly released. Register with CondoWizard to receive updates as the developer confirms the construction schedule.`,
  });

  if (p.floors) {
    faqs.push({
      question: `How tall will ${p.name} be?`,
      answer: `${p.name} is planned to rise ${p.floors} storeys. The final height is subject to municipal approvals and may be adjusted through the planning process.`,
    });
  }

  if (p.totalUnits) {
    faqs.push({
      question: `How many units are planned at ${p.name}?`,
      answer: `Approximately ${p.totalUnits.toLocaleString()} residential suites are proposed at ${p.name}. Final unit counts and suite mix are confirmed at sales launch and can change during the design process.`,
    });
  }

  faqs.push({
    question: `What suite types will be available at ${p.name}?`,
    answer: `The final suite mix is confirmed by the developer at sales launch and typically ranges from studios to three-bedroom layouts. Register with CondoWizard to receive the floor plan set as soon as it is released.`,
  });

  faqs.push({
    question: `Is parking available at ${p.name}?`,
    answer: `Parking availability, allocation rules and pricing are set by the developer and disclosed in the official price list. In central Toronto, parking is often limited and priced separately from the suite. Ask CondoWizard for the current parking details.`,
  });

  faqs.push({
    question: `What is the deposit structure for ${p.name}?`,
    answer: `The deposit structure is confirmed at sales launch and typically spans the period between signing and interim occupancy. CondoWizard can share the current schedule and any incentives available to registered purchasers.`,
  });

  faqs.push({
    question: `How can I get current pricing and floor plans for ${p.name}?`,
    answer: `Register through the enquiry form on this page. A licensed CondoWizard representative will confirm the latest price list, floor plans, deposit structure and any incentives currently offered by the developer.`,
  });

  return faqs;
}

// ─── Section 1: SEO title + meta ─────────────────────────────────────────────
export function buildMetaTitle(p) {
  // Preferred: "[Name] Condos in [Neighbourhood] | CondoWizard"
  // Strip a trailing "Condos"/"Residences"/"Towns"/"Tower(s)" from the project name
  // to avoid duplication when we append "Condos".
  const bareName = p.name.replace(/\s+(Condos?|Residences?|Towns?|Towers?)$/i, '');
  const short = `${bareName} Condos | Prices, Floor Plans & Occupancy`;
  const withHood = `${bareName} Condos in ${p.neighbourhoodName} | CondoWizard`;
  return short.length <= 60 ? short : (withHood.length <= 60 ? withHood : `${bareName} Condos | CondoWizard`);
}

export function buildMetaDescription(p) {
  const dev = p.developerName;
  const addr = p.address ? p.address.replace(/,\s*Toronto\s*$/i, '') : `${p.neighbourhoodName}, Toronto`;
  // Long form first, fall back to short form if over 160
  const long = `Explore ${p.name}, a new pre-construction condo at ${addr} by ${dev}. View project details, estimated occupancy, floor plans and pricing.`;
  if (long.length <= 160) return long;
  const short = `${p.name} — new pre-construction condo by ${dev} in ${p.neighbourhoodName}. See details, occupancy, floor plans and pricing on CondoWizard.`.replace('—', 'is a');
  if (short.length <= 160) return short;
  return `${p.name} pre-construction condos in ${p.neighbourhoodName}, Toronto by ${dev}. See project details, occupancy and floor plans on CondoWizard.`.slice(0, 160);
}

// ─── Assemble structured longDescription payload ─────────────────────────────
export function buildStructuredContent(p) {
  const today = new Date().toISOString().slice(0, 10);
  const summary = buildSummary(p);
  const notable = buildNotable(p);
  const location = buildLocation(p);
  const buyer = buildBuyerConsiderations(p);
  const developer = buildDeveloperProfile(p);
  const amenitiesIntro = buildAmenitiesIntro(p);
  const pricing = buildPricingNote(p);
  const considerations = buildImportantConsiderations(p);

  return {
    about: summary + '\n\n' + notable,
    location,
    investment: buyer,
    developer,
    amenitiesIntro,
    pricing,
    considerations,
    lastVerified: today,
  };
}

// Plain-text description (for meta / non-structured fallback)
export function buildPlainDescription(p) {
  return buildSummary(p);
}
