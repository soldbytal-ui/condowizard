import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^=\s#]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const gallery = [
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments-Portfolio-TheOne-01.png', alt: 'The One - Exterior rendering at 1 Bloor West, Yorkville', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio15-min.png', alt: 'The One - Tower profile against Toronto skyline', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio20-min.png', alt: 'The One - Lattice exoskeleton detail', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/Mizrahi_The_One_Portfolio18.png', alt: 'The One - Interior living space', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio21-min.png', alt: 'The One - Lobby and entrance', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio05-min.png', alt: 'The One - Suite interior', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/08/Mizrahi_The_One_Portfolio06.png', alt: 'The One - Kitchen and dining', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/08/Mizrahi_The_One_Portfolio08.png', alt: 'The One - Bedroom suite', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio07-min.png', alt: 'The One - Bathroom', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/08/Mizrahi_The_One_Portfolio09.png', alt: 'The One - Living room panoramic views', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/08/Mizrahi_The_One_Portfolio10.png', alt: 'The One - Penthouse suite', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio11-min.png', alt: 'The One - Amenity lounge', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio13-min.png', alt: 'The One - Fitness centre', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio19-min.png', alt: 'The One - Rooftop terrace', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/mizrahi-developments-the-one-toronto-amenities-pool.jpg', alt: 'The One - Infinity pool', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/08/Mizrahi_The_One_Portfolio17.png', alt: 'The One - Bar lounge', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio12-min.png', alt: 'The One - Theatre room', type: 'rendering' },
  { url: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments_The_One_Portfolio14-min.png', alt: 'The One - Garden terrace', type: 'rendering' },
];

const amenities = [
  '24-Hour Concierge',
  'Cleaning Services',
  'State-of-the-Art Fitness Centre',
  'Infinity Pool',
  'Rooftop Garden Terrace',
  'Bar Lounge',
  'Private Theatre Rooms',
  'Valet Parking',
  '4 Underground Parking Levels',
  'Private Dining Room',
  'Wine Cellar',
  'Spa & Wellness Centre',
  "Children's Play Area",
  'Pet Grooming Station',
  'Bicycle Storage',
  'Package Room',
  'Co-Working Lounge',
  'Guest Suites',
];

const longDescription = `## The One at 1 Bloor West: Toronto's First Supertall

Rising 85 storeys above the iconic intersection of Yonge and Bloor, The One is Canada's tallest residential building and Toronto's first supertall skyscraper as defined by the Council on Tall Buildings and Urban Habitat. At 1,005 feet, this architectural masterpiece by world-renowned firm Foster+Partners is redefining luxury living in the heart of Yorkville.

## A Vision by Foster+Partners

Designed by Lord Norman Foster's London-based practice — the same firm behind landmarks like The Gherkin, Apple Park, and the Reichstag dome — The One features a distinctive lattice-like exoskeleton that gives the tower its unmistakable silhouette on the Toronto skyline. The structural innovation allows for column-free interiors and floor-to-ceiling windows offering panoramic views of Lake Ontario, the city, and beyond.

## Luxury Living at Yonge & Bloor

The One's 416 residences range from spacious two-bedroom suites starting at 1,352 square feet to the breathtaking 6,137-square-foot Grand Penthouse — one of the most exclusive addresses in Canada. Every home features adaptable floor plans, premium finishes, and connecting garden terraces that blur the line between indoor and outdoor living.

## World-Class Amenities

Residents enjoy a private world of luxury amenities including an infinity pool, rooftop garden terrace, state-of-the-art fitness centre, private theatre rooms, bar lounge, wine cellar, spa and wellness centre, and 24-hour concierge with cleaning services. Valet parking and four underground parking levels ensure convenience.

## The Yorkville Address

At the doorstep of Bloor Street's legendary "Mink Mile," residents are steps from Chanel, Louis Vuitton, Tiffany & Co., and Holt Renfrew. The Royal Ontario Museum, Gardiner Museum, and University of Toronto campus are within walking distance. The first eight floors of The One will house a curated retail experience including a flagship Apple Store.

## Unmatched Transit Connectivity

The One sits directly above Bloor-Yonge station — the busiest interchange in the TTC subway system — providing direct access to both the Yonge-University (Line 1) and Bloor-Danforth (Line 2) lines. Union Station and GO Transit are just minutes away, and Pearson Airport is accessible via the UP Express.

## Investment Potential

With an average price per square foot of $3,259, The One represents the pinnacle of Toronto's luxury condo market. Yorkville's enduring prestige, combined with the building's architectural significance and Foster+Partners pedigree, positions The One as a trophy asset for discerning buyers and investors worldwide.

*Developed by Mizrahi Developments. Estimated completion: 2027.*`;

const faqJson = [
  {
    question: 'How tall is The One at 1 Bloor West?',
    answer: "The One rises 85 storeys (1,005 feet / 306 metres), making it Canada's tallest residential building and Toronto's first supertall skyscraper as classified by the Council on Tall Buildings and Urban Habitat.",
  },
  {
    question: 'Who designed The One condo?',
    answer: "The One was designed by Foster+Partners, the London-based architecture firm led by Lord Norman Foster. Known for iconic buildings like The Gherkin in London and Apple Park in Cupertino, Foster+Partners created The One's distinctive lattice exoskeleton design. CORE Architects Group is the local architect of record.",
  },
  {
    question: 'What is the price per square foot at The One?',
    answer: "The One commands an average price of approximately $3,259 per square foot, reflecting its position as one of Canada's most prestigious luxury addresses. Units range from 1,352 sqft two-bedrooms to the 6,137 sqft Grand Penthouse.",
  },
  {
    question: 'What amenities does The One offer?',
    answer: 'The One features an infinity pool, rooftop garden terrace, state-of-the-art fitness centre, private theatre rooms, bar lounge, wine cellar, spa and wellness centre, 24-hour concierge with cleaning services, valet parking, and four underground parking levels. The first eight floors include curated retail space.',
  },
  {
    question: 'When will The One be completed?',
    answer: 'The One is currently under construction at 1 Bloor Street West with an estimated completion date of 2027. The project is being developed by Mizrahi Developments.',
  },
];

async function run() {
  // Update The One project
  const { error } = await sb.from('projects').update({
    address: '1 Bloor St W, Toronto, ON M4W 1A9',
    architect: 'Foster+Partners / CORE Architects Group',
    status: 'UNDER_CONSTRUCTION',
    estCompletion: '2027',
    totalUnits: 416,
    floors: 85,
    priceMin: 4500000,
    priceMax: 30000000,
    pricePerSqft: 3259,
    sizeRangeMin: 1352,
    sizeRangeMax: 6137,
    depositStructure: 'Domestic: $20,000 signing; 5% each at 30, 90, 180, 360 days; 5% on occupancy. International: 5% signing; 10% at 90, 270, 360 days.',
    category: 'ULTRA_LUXURY',
    websiteUrl: 'https://mizrahidevelopments.ca/the-one/',
    featured: true,
    unitTypes: '2 Bed (1,352-1,502 sqft), 2.5 Bed (1,495-2,466 sqft), 3 Bed (1,495-1,909 sqft), 3.5 Bed (2,468-6,137 sqft), Penthouses',
    mainImageUrl: 'https://mizrahidevelopments.ca/wp-content/uploads/2020/07/MizrahiDevelopments-Portfolio-TheOne-01.png',
    images: { gallery },
    amenities,
    longDescription,
    faqJson,
    metaTitle: 'The One | 85-Storey Supertall in Yorkville, Toronto',
    metaDescription: "The One at 1 Bloor West — Canada's tallest residential tower. 85 storeys by Foster+Partners & Mizrahi. 416 luxury suites from $4.5M in Yorkville.",
    description: "The One is Canada's tallest residential building — an 85-storey supertall designed by Foster+Partners at 1 Bloor West in Yorkville. 416 luxury residences with world-class amenities. Developed by Mizrahi Developments. Estimated completion 2027.",
  }).eq('slug', 'the-one');

  if (error) {
    console.log('Error updating The One:', error.message);
  } else {
    console.log('✓ The One updated with full data + 18 gallery images');
  }

  // Update Mizrahi developer profile
  const { error: e2 } = await sb.from('developers').update({
    description: "Mizrahi Developments is a Toronto-based luxury developer led by Sam Mizrahi, known for visionary projects that push the boundaries of design and craftsmanship. Their flagship project, The One at 1 Bloor West, is Canada's tallest residential building at 85 storeys, designed by Foster+Partners. Mizrahi is renowned for meticulous attention to detail, premium materials, and creating landmark residences in Toronto's most prestigious locations.",
    headquarters: 'Toronto, ON',
    websiteUrl: 'https://mizrahidevelopments.ca',
    foundedYear: 2008,
  }).eq('slug', 'mizrahi-developments');

  if (e2) {
    console.log('Error updating Mizrahi:', e2.message);
  } else {
    console.log('✓ Mizrahi Developments profile updated');
  }

  // Verify
  const { data } = await sb.from('projects').select('name, slug, mainImageUrl, images, amenities, floors, totalUnits').eq('slug', 'the-one').single();
  if (data) {
    console.log('\nVerification:');
    console.log('  Name:', data.name);
    console.log('  Main image:', data.mainImageUrl ? 'YES' : 'NO');
    console.log('  Gallery images:', data.images?.gallery?.length || 0);
    console.log('  Amenities:', data.amenities?.length || 0);
    console.log('  Floors:', data.floors);
    console.log('  Units:', data.totalUnits);
  }

  console.log('\n→ View at: http://localhost:3000/properties/the-one');
}

run();
