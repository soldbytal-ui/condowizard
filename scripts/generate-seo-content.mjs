/**
 * Generate SEO content for every listing page.
 * Creates rich descriptions, meta titles, meta descriptions, and FAQ content.
 * No external API needed — uses template-based generation from project data.
 *
 * Usage: node scripts/generate-seo-content.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^=\s#]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function formatPrice(val) {
  if (!val) return 'TBD';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${(val / 1000).toFixed(0)}K`;
}

const STATUS_LABELS = {
  PRE_LAUNCH: 'Pre-Launch', PRE_CONSTRUCTION: 'Pre-Construction',
  UNDER_CONSTRUCTION: 'Under Construction', NEAR_COMPLETION: 'Near Completion', COMPLETED: 'Completed',
};

const CATEGORY_LABELS = {
  ULTRA_LUXURY: 'ultra-luxury', LUXURY_BRANDED: 'luxury branded', LUXURY: 'luxury',
  PREMIUM: 'premium', AFFORDABLE_LUXURY: 'affordable luxury',
};

function generateDescription(p) {
  const area = p.neighborhood?.name || 'Miami';
  const dev = p.developer?.name || 'a premier developer';
  const status = STATUS_LABELS[p.status] || 'pre-construction';
  const cat = CATEGORY_LABELS[p.category] || 'luxury';
  const floors = p.floors || 'multiple';
  const units = p.totalUnits ? `${p.totalUnits} residences` : 'a curated collection of residences';
  const priceFrom = p.priceMin ? `starting from ${formatPrice(p.priceMin)}` : 'with pricing available upon request';
  const completion = p.estCompletion || '2027';
  const amenities = p.amenities ? (Array.isArray(p.amenities) ? p.amenities : []) : [];

  let desc = `${p.name} is a ${cat} ${status.toLowerCase()} development located in ${area}, one of South Florida's most sought-after neighborhoods. `;

  if (p.floors) {
    desc += `Rising ${floors} stories above the Miami skyline, this architectural landmark will house ${units} ${priceFrom}. `;
  } else {
    desc += `This distinguished development features ${units} ${priceFrom}. `;
  }

  desc += `Developed by ${dev}, ${p.name} is scheduled for completion in ${completion}.\n\n`;

  // Location context
  desc += `## Location & Neighborhood\n\n`;
  desc += `Situated in the heart of ${area}, ${p.name} offers residents unparalleled access to South Florida's finest dining, shopping, and entertainment. `;
  if (area === 'Brickell') {
    desc += `Brickell is Miami's premier financial district, home to Brickell City Centre, Mary Brickell Village, and a thriving restaurant scene. Residents enjoy walkability to shops, cafes, and the Metrorail. `;
  } else if (area === 'Miami Beach') {
    desc += `Miami Beach combines world-class beaches with the Art Deco Historic District, Lincoln Road Mall, and a vibrant cultural scene including Art Basel. `;
  } else if (area === 'Downtown Miami') {
    desc += `Downtown Miami is undergoing a historic transformation anchored by Miami Worldcenter, the Adrienne Arsht Center, and the Brightline high-speed rail station connecting to Fort Lauderdale and West Palm Beach. `;
  } else if (area === 'Edgewater') {
    desc += `Edgewater offers stunning bayfront views along Biscayne Bay, proximity to the Design District and Wynwood, and a rapidly growing dining scene. `;
  } else if (area === 'Coconut Grove') {
    desc += `Coconut Grove is Miami's most charming neighborhood, featuring lush tropical landscaping, CocoWalk, Vizcaya Museum, and a vibrant sailing community. `;
  } else {
    desc += `${area} offers a distinctive blend of luxury living, cultural amenities, and convenient access to major transportation corridors throughout South Florida. `;
  }
  desc += `\n\n`;

  // Amenities
  if (amenities.length > 0) {
    desc += `## World-Class Amenities\n\n`;
    desc += `${p.name} delivers an exceptional lifestyle with amenities designed for discerning residents:\n\n`;
    for (const a of amenities.slice(0, 10)) {
      desc += `- ${a}\n`;
    }
    desc += `\n`;
  }

  // Investment section
  desc += `## Investment Potential\n\n`;
  desc += `${area} pre-construction condos have historically demonstrated strong appreciation in the South Florida market. ${p.name} represents an opportunity to secure `;
  if (p.priceMin && p.priceMin >= 2000000) {
    desc += `ultra-premium real estate at pre-construction pricing, before anticipated price increases as construction progresses. `;
  } else if (p.priceMin && p.priceMin >= 1000000) {
    desc += `luxury waterfront or urban living at pre-construction pricing, with potential for significant appreciation through completion. `;
  } else {
    desc += `modern Miami living at competitive pre-construction pricing. `;
  }
  desc += `With Florida's favorable tax environment (no state income tax) and Miami's continued growth as a global business hub, `;
  desc += `pre-construction investments in ${area} remain highly attractive to both domestic and international buyers.\n\n`;

  // Developer section
  desc += `## About the Developer\n\n`;
  desc += `${dev} brings a proven track record of delivering exceptional residential projects in South Florida. `;
  if (p.developer?.description) {
    desc += p.developer.description.slice(0, 200) + '... ';
  }
  desc += `Their commitment to quality design, premium materials, and on-time delivery has established them as one of the region's most trusted developers.\n\n`;

  // Unit types
  if (p.unitTypes) {
    desc += `## Available Residences\n\n`;
    desc += `${p.name} offers ${p.unitTypes}. `;
    if (p.sizeRangeMin && p.sizeRangeMax) {
      desc += `Residences range from ${p.sizeRangeMin.toLocaleString()} to ${p.sizeRangeMax.toLocaleString()} square feet. `;
    }
    if (p.depositStructure) {
      desc += `The deposit structure is: ${p.depositStructure}. `;
    }
    desc += `\n\n`;
  }

  // CTA
  desc += `## Schedule a Private Showing\n\n`;
  desc += `Interested in ${p.name}? Get in touch for exclusive access to floor plans, pricing, and availability. `;
  desc += `Our partner agents who specialize in ${area} pre-construction provide personalized guidance through every step of the buying process — from reservation to closing.`;

  return desc;
}

function generateFAQs(p) {
  const area = p.neighborhood?.name || 'Miami';
  const completion = p.estCompletion || '2027';

  return [
    {
      question: `What is the starting price for ${p.name}?`,
      answer: p.priceMin
        ? `Residences at ${p.name} start from ${formatPrice(p.priceMin)}. Pricing varies by unit type, floor level, and view. Contact us for the most current pricing and availability.`
        : `Pricing for ${p.name} is available upon request. Get in touch for current pricing, floor plans, and availability.`,
    },
    {
      question: `When will ${p.name} be completed?`,
      answer: `${p.name} is currently ${(STATUS_LABELS[p.status] || 'in development').toLowerCase()} with an estimated completion date of ${completion}. Contact us for the latest construction timeline updates.`,
    },
    {
      question: `Where is ${p.name} located?`,
      answer: `${p.name} is located in ${area}, one of South Florida's premier neighborhoods. ${p.address ? `The address is ${p.address}.` : ''} The location offers excellent access to dining, shopping, beaches, and major transportation corridors.`,
    },
    {
      question: `What amenities does ${p.name} offer?`,
      answer: p.amenities && Array.isArray(p.amenities) && p.amenities.length > 0
        ? `${p.name} features world-class amenities including ${p.amenities.slice(0, 5).join(', ')}, and more. See the full amenities list on the project page.`
        : `${p.name} will feature premium amenities typical of ${area}'s finest developments, including pool, fitness center, concierge services, and more. Contact us for the complete amenity package.`,
    },
    {
      question: `Is ${p.name} a good investment?`,
      answer: `${area} pre-construction condos have shown strong historical appreciation. ${p.name} offers an opportunity to purchase at pre-construction pricing before completion in ${completion}. Florida's tax-friendly environment and Miami's growth as a global business hub support long-term value. Connect with a licensed agent for a personalized analysis.`,
    },
  ];
}

async function main() {
  console.log('Generating SEO content for all projects...\n');

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(name, slug), developer:developers(name, description)')
    .order('name');

  if (error) { console.error(error); process.exit(1); }
  console.log(`Projects: ${projects.length}`);

  let updated = 0;
  for (const p of projects) {
    // Regenerate all descriptions to fix language

    const description = generateDescription(p);
    const faqs = generateFAQs(p);

    const hood = p.neighborhood?.name || 'Miami';
    const metaTitle = `${p.name} | Pre-Construction Condos in ${hood}`;
    const metaDescription = description.replace(/[#\n]+/g, ' ').substring(0, 155).replace(/\s+\S*$/, '') + '...';

    const updates = {
      description,
      longDescription: description,
      metaTitle: metaTitle.substring(0, 70),
      metaDescription,
      faqJson: faqs,
    };

    const { error: upErr } = await supabase.from('projects').update(updates).eq('id', p.id);
    if (upErr) {
      console.log(`  Error updating ${p.name}: ${upErr.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} projects with SEO content`);
}

main().catch(console.error);
