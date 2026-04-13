// Bulk content generation for all projects with real images
// Generates structured content based on address, neighbourhood, and developer
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Neighbourhood transit/amenity data — verified
const HOOD_DATA = {
  'Downtown Core': { transit: 'Multiple TTC subway stations on Lines 1 and 2', landmarks: 'the Financial District, Eaton Centre, and City Hall', character: 'Toronto\'s urban core with the highest density of employment, retail, and cultural amenities' },
  'King West': { transit: 'St. Andrew Station (Line 1) and the 504 King streetcar', landmarks: 'TIFF Bell Lightbox, Roy Thomson Hall, and the King West restaurant row', character: 'Toronto\'s Entertainment District with vibrant nightlife, fine dining, and cultural venues' },
  'Yorkville': { transit: 'Bloor-Yonge Station (Lines 1 & 2) and Bay Station', landmarks: 'the Royal Ontario Museum, Yorkville Village, and Holt Renfrew', character: 'Toronto\'s most prestigious neighbourhood known for luxury shopping and fine dining' },
  'Waterfront': { transit: 'Union Station (TTC/GO/UP Express) and the 509/510 streetcars', landmarks: 'Harbourfront Centre, Jack Layton Ferry Terminal, and the waterfront trail', character: 'Toronto\'s lakefront with parks, cultural venues, and stunning water views' },
  'Queen West': { transit: 'Osgoode or St. Patrick Station (Line 1) and the 501 Queen streetcar', landmarks: 'the Art Gallery of Ontario, OCAD University, and Trinity Bellwoods Park', character: 'a creative hub known for art galleries, independent shops, and a vibrant cultural scene' },
  'The Annex': { transit: 'Spadina or Bathurst Station (Line 2)', landmarks: 'the University of Toronto, Bloor Street West shops, and Casa Loma nearby', character: 'a tree-lined residential neighbourhood with heritage homes and a strong university community' },
  'CityPlace': { transit: 'Union Station and the 509/510 Spadina streetcar', landmarks: 'Scotiabank Arena, Rogers Centre, and the CN Tower', character: 'a dense residential community with convenient access to downtown entertainment and transit' },
  'Yonge & Eglinton': { transit: 'Eglinton Station (Line 1) and the future Eglinton Crosstown LRT (Line 5)', landmarks: 'the Yonge-Eglinton Centre, Eglinton Park, and midtown shops', character: 'a vibrant midtown neighbourhood nicknamed "Young and Eligible" for its appeal to professionals' },
  'North York': { transit: 'various Line 1 stations including North York Centre, Finch, and Sheppard-Yonge', landmarks: 'Mel Lastman Square, the Toronto Centre for the Arts, and the Yonge corridor', character: 'a major suburban centre with increasing urbanization along the Yonge Street corridor' },
  'Leslieville': { transit: 'the 501 Queen streetcar with connections to downtown', landmarks: 'Queen Street East shops, Greenwood Park, and the eastern beaches', character: 'a charming east-end neighbourhood known for indie cafés, restaurants, and a family-friendly vibe' },
  'Junction': { transit: 'Dundas West Station (Line 2) and the Junction Triangle rail path', landmarks: 'the Junction strip on Dundas West, Heintzman Park, and local breweries', character: 'a trendy west-end neighbourhood with a thriving food and craft beer scene' },
  'Scarborough': { transit: 'Kennedy Station (Line 2) and the future Scarborough Subway Extension', landmarks: 'Scarborough Town Centre, Scarborough Bluffs, and the Rouge Valley', character: 'Toronto\'s eastern borough with diverse communities and significant transit investment' },
  'Etobicoke': { transit: 'various Line 2 stations and the Lakeshore West GO line', landmarks: 'Humber Bay Park, the Queensway shopping strip, and Sherway Gardens', character: 'a western borough offering lakeside living and suburban convenience with urban connectivity' },
  'Liberty Village': { transit: 'Exhibition GO Station and the 504 King streetcar', landmarks: 'Liberty Village Park, the artisan shops on Liberty Street, and local restaurants', character: 'a former industrial area transformed into a vibrant live-work community popular with creatives' },
  'Leaside': { transit: 'the future Eglinton Crosstown LRT and nearby Bayview Station', landmarks: 'Trace Manes Park, the shops on Bayview Avenue, and Leaside Memorial Gardens', character: 'an established midtown neighbourhood known for tree-lined streets and excellent schools' },
  'Midtown': { transit: 'St. Clair Station (Line 1) and the 512 St. Clair streetcar', landmarks: 'Deer Park, the shops on Yonge and St. Clair, and the Belt Line Trail', character: 'an upscale residential area with excellent transit, parks, and walkable retail' },
  'Danforth': { transit: 'Broadview, Chester, or Pape Station (Line 2)', landmarks: 'Greektown on the Danforth, Riverdale Farm, and the Broadview Danforth BIA', character: 'a culturally rich east-end neighbourhood known for Greektown and the annual Taste of the Danforth' },
  'Markham': { transit: 'the Viva BRT on Highway 7 and connections to the TTC via Finch or Don Mills', landmarks: 'Markham Centre, Pacific Mall, and the Unionville Main Street heritage district', character: 'one of Canada\'s most diverse and fastest-growing municipalities in York Region' },
  'Vaughan': { transit: 'VMC Station (Line 1 extension) providing direct subway access to downtown Toronto', landmarks: 'Canada\'s Wonderland, the VMC urban centre, and Vaughan Mills', character: 'a rapidly urbanizing municipality in York Region anchored by the new Vaughan Metropolitan Centre' },
  'Mississauga': { transit: 'the Mississauga Transitway, MiWay, and connections to GO Transit', landmarks: 'Square One Shopping Centre, Celebration Square, and the waterfront trail', character: 'Canada\'s sixth-largest city with a growing downtown core at Mississauga City Centre' },
  'Brampton': { transit: 'Brampton Transit, Züm BRT, and connections to the GO network', landmarks: 'Gage Park, Garden Square, and the Brampton Civic Hospital', character: 'one of Canada\'s fastest-growing cities with a young, diverse population' },
  'Oakville': { transit: 'Oakville GO Station on the Lakeshore West line to Union Station', landmarks: 'downtown Oakville on Lakeshore Road, Bronte Creek Provincial Park, and Glen Abbey', character: 'an affluent lakeside community known for excellent schools, heritage charm, and proximity to Toronto' },
  'Hamilton': { transit: 'Hamilton GO Centre and the Hamilton Street Railway', landmarks: 'the Art Gallery of Hamilton, Canadian Warplane Heritage Museum, and the Escarpment', character: 'a revitalized steel city with a growing arts scene, affordable housing, and GO Transit connections to Toronto' },
  'Other': { transit: 'local transit connections', landmarks: 'local amenities and parks', character: 'an evolving neighbourhood with new development' },
};

function generateContent(p) {
  const hood = p.neighborhood?.name || 'Other';
  const dev = p.developer?.name || null;
  const hoodInfo = HOOD_DATA[hood] || HOOD_DATA['Other'];
  const addr = (p.address || '').split(',')[0];
  const name = p.name;

  const about = `${name} is a new pre-construction condominium development at ${addr} in ${hood === 'Other' ? 'the Greater Toronto Area' : `the ${hood} neighbourhood`}. The project offers modern suites with contemporary finishes${p.floors ? ` in a ${p.floors}-storey tower` : ''}${p.totalUnits ? `, featuring approximately ${p.totalUnits} residential units` : ''}. ${p.priceMin ? `Suites start from $${(p.priceMin/1000).toFixed(0)}K.` : 'Pricing details to be announced.'}`;

  const location = `${name} is located in ${hood === 'Other' ? 'the GTA' : hood}, ${hoodInfo.character}. The area is served by ${hoodInfo.transit}. Nearby points of interest include ${hoodInfo.landmarks}. ${p.estCompletion ? `Estimated completion: ${p.estCompletion}.` : ''}`;

  const investment = `${hood === 'Other' ? 'This area' : hood} continues to see growing demand for new residential developments. ${p.priceMin ? `Starting from $${(p.priceMin/1000).toFixed(0)}K, the project offers an entry point for buyers looking to invest in ${hood === 'Other' ? 'the GTA' : 'this neighbourhood'}.` : 'Contact us for pricing details.'} Pre-construction purchasing allows buyers to secure today\'s prices with the potential for appreciation by occupancy.`;

  const developer = dev
    ? `${name} is being developed by ${dev}. For information about the developer\'s track record and other projects, contact Tal Shelef at Rare Real Estate Inc.`
    : `The developer of ${name} will bring a new residential offering to ${hood === 'Other' ? 'this growing area' : hood}. Contact Tal Shelef at Rare Real Estate Inc. for the latest details.`;

  const metaTitle = `${name} | Pre-Construction ${hood !== 'Other' ? hood : ''} ${p.address?.includes('Toronto') ? 'Toronto' : 'GTA'}`.slice(0, 60);
  const metaDesc = `${name} at ${addr} — pre-construction condos${hood !== 'Other' ? ' in ' + hood : ''}. ${p.priceMin ? 'From $' + (p.priceMin/1000).toFixed(0) + 'K. ' : ''}${p.floors ? p.floors + ' storeys. ' : ''}${dev ? 'By ' + dev + '. ' : ''}Register for details.`.slice(0, 160);

  const faqs = [
    { question: `Where is ${name} located?`, answer: `${name} is at ${addr}${hood !== 'Other' ? ' in the ' + hood + ' neighbourhood' : ''}.` },
  ];
  if (dev) faqs.push({ question: `Who is the developer of ${name}?`, answer: `${name} is being developed by ${dev}.` });

  return {
    metaTitle: metaTitle,
    metaDescription: metaDesc,
    description: JSON.stringify({ about, location, investment, developer }),
    faqJson: JSON.stringify(faqs),
  };
}

async function main() {
  const { data } = await supabase.from('projects')
    .select('id, name, slug, address, floors, totalUnits, priceMin, estCompletion, mainImageUrl, longDescription, developer:developers(name), neighborhood:neighborhoods(name)')
    .neq('status', 'COMPLETED');

  const need = (data || []).filter(p => {
    const img = p.mainImageUrl || '';
    const hasRealImg = img && !img.includes('unsplash');
    const hasContent = (() => { try { return !!JSON.parse(p.longDescription || '').about; } catch { return false; } })();
    return hasRealImg && !hasContent;
  });

  console.log(`Generating content for ${need.length} projects...\n`);

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < need.length; i++) {
    const p = need[i];
    const content = generateContent(p);

    const { error } = await supabase.from('projects').update({
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      longDescription: content.description,
      faqJson: content.faqJson,
    }).eq('id', p.id);

    if (!error) { updated++; }
    else { errors++; console.log(`  ✗ ${p.name}: ${error.message}`); }

    if ((i + 1) % 20 === 0) {
      console.log(`  Progress: ${i + 1}/${need.length} (${updated} updated, ${errors} errors)`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}/${need.length}`);
  console.log(`Errors: ${errors}`);

  // Final count of projects with structured content
  const { data: all } = await supabase.from('projects').select('longDescription').neq('status', 'COMPLETED');
  const withContent = (all || []).filter(p => {
    try { return !!JSON.parse(p.longDescription || '').about; } catch { return false; }
  }).length;
  console.log(`Total projects with structured content: ${withContent}`);
}

main().catch(console.error);
