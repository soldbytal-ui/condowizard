// Batch 3: Content for next 10 important projects with real images
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const CONTENT = {
  'elektra': {
    metaTitle: 'Elektra Condos | Pre-Construction Dundas East Toronto',
    metaDescription: 'Elektra at 218 Dundas St E by Menkes — modern tower in the Garden District near Dundas Station and Toronto Metropolitan University.',
    description: JSON.stringify({
      about: 'Elektra is a new condominium development by Menkes Developments at 218 Dundas Street East in Toronto\'s Garden District. The project brings Menkes\' signature quality to one of downtown Toronto\'s most centrally located neighbourhoods, offering modern suites with premium finishes and a comprehensive amenity package.',
      location: 'Elektra is steps from Dundas TTC Station (Line 1) and Toronto Metropolitan University (formerly Ryerson). The Eaton Centre, Yonge-Dundas Square, and Allan Gardens are within a 5-minute walk. The Dundas streetcar (505) runs on the doorstep. The neighbourhood is undergoing significant revitalization with new residential and mixed-use developments.',
      investment: 'The Garden District is one of downtown Toronto\'s most affordable pockets with strong upside potential. Proximity to Toronto Metropolitan University ensures consistent rental demand from students and faculty. The neighbourhood\'s central location and improving streetscape support long-term appreciation.',
      developer: 'Menkes Developments is one of Toronto\'s most established developers with over 65 years of experience. Their portfolio includes landmark projects like Four Seasons Hotel & Residences, Harbour Plaza, and Sugar Wharf. Menkes is known for exceptional build quality and has won numerous industry awards.',
    }),
    faqJson: JSON.stringify([
      { question: 'Who is building Elektra?', answer: 'Menkes Developments, one of Toronto\'s most established developers with 65+ years of experience.' },
      { question: 'What transit is near Elektra?', answer: 'Dundas Station (Line 1) is a 2-minute walk, plus the 505 Dundas streetcar.' },
    ]),
  },
  'sugar-wharf-condominiums-phase-2': {
    metaTitle: 'Sugar Wharf Phase 2 | Pre-Construction Waterfront Toronto',
    metaDescription: 'Sugar Wharf Phase 2 — Menkes\' massive waterfront community at Queens Quay E. Steps from Union Station, new park, and future LRT.',
    description: JSON.stringify({
      about: 'Sugar Wharf Phase 2 is part of Menkes\' massive 12-acre waterfront community at Queens Quay East, one of the largest private developments in Toronto\'s history. The master plan includes multiple residential towers, office space, a 2-acre public park, a community centre, and a new elementary school. Phase 2 continues the vision of creating a complete waterfront neighbourhood.',
      location: 'Sugar Wharf is on Queens Quay East near Jarvis Street, a 10-minute walk from Union Station. The neighbourhood is part of the East Bayfront revitalization, alongside Daniels Waterfront and Bayside Toronto. The Martin Goodman Trail, Sugar Beach, and Sherbourne Common are at the doorstep. Future transit improvements include the waterfront LRT extension.',
      investment: 'Toronto\'s waterfront represents one of the most significant urban development opportunities in North America. Sugar Wharf\'s scale creates a self-sustaining community that drives property values as each phase completes. Waterfront properties historically outperform the broader market due to scarcity of lakefront land.',
      developer: 'Menkes Developments has invested over $3.5 billion in the Sugar Wharf project, demonstrating their confidence in Toronto\'s waterfront future. Their track record of delivering large-scale, complex projects on time sets Sugar Wharf apart.',
    }),
    faqJson: JSON.stringify([
      { question: 'How big is Sugar Wharf?', answer: 'Sugar Wharf spans 12 acres with multiple towers, a 2-acre park, community centre, and elementary school.' },
      { question: 'Where is Sugar Wharf?', answer: 'On Queens Quay East near Jarvis Street, a 10-minute walk from Union Station.' },
    ]),
  },
  'spadina-adelaide-square': {
    metaTitle: 'Spadina Adelaide Square | Pre-Construction King West',
    metaDescription: 'Spadina Adelaide Square at 46 Charlotte St — mixed-use development in the heart of King West\'s Entertainment District.',
    description: JSON.stringify({
      about: 'Spadina Adelaide Square is a mixed-use development at 46 Charlotte Street in the King West Entertainment District. The project brings new residential, commercial, and retail space to one of Toronto\'s most dynamic neighbourhoods, contributing to the continuing evolution of the Spadina-Adelaide corridor.',
      location: 'Located at the intersection of Spadina and Adelaide in King West, the project is a 5-minute walk from both St. Andrew and Osgoode TTC stations (Line 1). The King streetcar (504) and Spadina streetcar (510) provide additional transit options. TIFF Bell Lightbox, the Princess of Wales Theatre, and the King West restaurant strip are steps away.',
      investment: 'King West\'s Entertainment District is one of Toronto\'s highest-demand real estate markets. The area commands premium pricing due to its cultural amenities, transit access, and proximity to the Financial District. Rental yields remain strong given the neighbourhood\'s appeal to young professionals and entertainment industry workers.',
      developer: 'Fengate is a leading Canadian alternative investment manager with significant real estate development experience across the country.',
    }),
    faqJson: JSON.stringify([
      { question: 'Where is Spadina Adelaide Square?', answer: '46 Charlotte Street in King West, between Spadina and Adelaide.' },
    ]),
  },
  '906-yonge-street-25-mcmurrich-street': {
    metaTitle: '906 Yonge St | Pre-Construction Yorkville Toronto',
    metaDescription: '906 Yonge Street by Gupta Group — luxury development at Yonge & Davenport in Yorkville. Steps from Rosedale Station.',
    description: JSON.stringify({
      about: '906 Yonge Street is a development at the corner of Yonge Street and McMurrich Street in the coveted Yorkville neighbourhood. Located in one of Toronto\'s most prestigious residential areas, the project offers residents an upscale urban lifestyle at the crossroads of Yorkville and Rosedale.',
      location: 'The site is at Yonge and Davenport, steps from Rosedale TTC Station (Line 1) and the shops of Yorkville village. The neighbourhood is home to the Royal Ontario Museum, Gardiner Museum, and some of Toronto\'s finest restaurants. Bloor-Yonge Station is a short walk south, connecting Lines 1 and 2.',
      investment: 'Yorkville and Rosedale represent the pinnacle of Toronto\'s real estate market. Properties in this area consistently command the city\'s highest price per square foot. The combination of prestigious address, excellent transit, and proximity to cultural institutions ensures enduring demand.',
      developer: 'The Gupta Group is a Toronto-based real estate developer known for luxury projects. Their portfolio includes developments across the GTA with a focus on quality finishes and prime locations.',
    }),
    faqJson: JSON.stringify([
      { question: 'What neighbourhood is 906 Yonge in?', answer: 'The project is at the edge of Yorkville and Rosedale, two of Toronto\'s most prestigious neighbourhoods.' },
    ]),
  },
  'lawrence-plaza-redevelopment': {
    metaTitle: 'Lawrence Plaza | Pre-Construction Lawrence Ave Toronto',
    metaDescription: 'Lawrence Plaza Redevelopment at 490 Lawrence Ave W by RioCan Living — transforming a beloved plaza into a new mixed-use community.',
    description: JSON.stringify({
      about: 'The Lawrence Plaza Redevelopment is transforming the beloved Lawrence Plaza shopping centre at 490 Lawrence Avenue West into a modern mixed-use community. Led by RioCan Living, the project will include residential towers, new retail space, a public park, and community amenities while preserving the plaza\'s role as a neighbourhood gathering place. The redevelopment has been designed through extensive community consultation.',
      location: 'Lawrence Plaza is at Lawrence Avenue West and Bathurst Street, served by the Lawrence West bus (52) and Bathurst bus (7). Lawrence West Station (Line 1 Spadina extension) is a potential future connection. The neighbourhood is a vibrant, diverse community with a mix of restaurants, shops, and services along Bathurst Street. Cedarvale Park is nearby.',
      investment: 'Large-scale plaza redevelopments create significant value as they transform aging retail sites into complete communities. RioCan\'s track record of successful mixed-use conversions (including The Well) provides confidence in execution. The Lawrence-Bathurst area is an established residential neighbourhood with room for appreciation.',
      developer: 'RioCan Living is the residential development arm of RioCan REIT, Canada\'s largest real estate investment trust. RioCan specializes in converting underperforming retail properties into vibrant mixed-use communities, with The Well being their most prominent project to date.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is happening to Lawrence Plaza?', answer: 'The existing shopping plaza is being redeveloped into a mixed-use community with residential towers, new retail, a park, and community spaces by RioCan Living.' },
    ]),
  },
  'beltline-yards': {
    metaTitle: 'Beltline Yards | Pre-Construction Davisville Toronto',
    metaDescription: 'Beltline Yards at 250 Bowie Ave by Hullmark — new community in midtown Toronto near the Kay Gardner Beltline Trail.',
    description: JSON.stringify({
      about: 'Beltline Yards is a new residential development at 250 Bowie Avenue by Hullmark, named after the historic Kay Gardner Beltline Trail that runs through midtown Toronto. The project offers modern urban living in a leafy, established neighbourhood with excellent transit connectivity and community amenities.',
      location: 'Located near the intersection of Yonge and Davisville, Beltline Yards is a short walk from Davisville TTC Station (Line 1). The Kay Gardner Beltline Trail — a beloved linear park and cycling route — is at the doorstep. The neighbourhood offers a village-like atmosphere with independent shops and restaurants along Yonge Street. Chaplin Estates and midtown parks are nearby.',
      investment: 'Midtown Toronto\'s Davisville-Chaplin area is one of the city\'s most stable residential markets. The combination of excellent schools, green spaces, transit access, and a family-friendly character attracts a diverse buyer pool. New supply in the area is limited, supporting pricing.',
      developer: 'Hullmark is a Toronto-based real estate firm known for thoughtfully designed developments. Their portfolio includes Hullmark Centre at Yonge and Sheppard and various residential projects across the GTA.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is the Beltline Trail?', answer: 'The Kay Gardner Beltline Trail is a popular 9km walking and cycling path that follows the route of a historic railway through midtown Toronto.' },
    ]),
  },
  '295-jarvis-street-condos': {
    metaTitle: '295 Jarvis St | Pre-Construction Garden District Toronto',
    metaDescription: '295 Jarvis Street Condos by CentreCourt — new tower in the Garden District near Dundas Station and Allan Gardens.',
    description: JSON.stringify({
      about: '295 Jarvis Street Condos is a new development by CentreCourt Developments in the Garden District. The project adds to CentreCourt\'s growing portfolio of transit-oriented condominiums, offering efficiently designed suites in a central downtown location.',
      location: '295 Jarvis is in the Garden District, a short walk from Dundas TTC Station (Line 1) and Sherbourne Station (Line 2). Allan Gardens — one of Toronto\'s oldest parks with its historic conservatory — is steps away. The neighbourhood is central to downtown, with the Eaton Centre, Ryerson campus, and Cabbagetown all within walking distance.',
      investment: 'The Garden District is experiencing significant revitalization as new residential development replaces aging commercial properties. CentreCourt\'s focus on transit-oriented development ensures strong rental demand. The area offers one of the best value propositions in downtown Toronto.',
      developer: 'CentreCourt Developments is a Toronto-based developer specializing in transit-oriented condominiums. Known for projects at key transit intersections, CentreCourt has delivered thousands of units across the GTA. Their focus on efficient unit design and prime locations appeals to both investors and end-users.',
    }),
    faqJson: JSON.stringify([
      { question: 'Who is CentreCourt?', answer: 'CentreCourt Developments specializes in transit-oriented condominiums at key subway intersections across Toronto.' },
    ]),
  },
  'concord-park-place-block-2': {
    metaTitle: 'Concord Park Place Block 2 | Pre-Construction North York',
    metaDescription: 'Concord Park Place Block 2 at 1125 Sheppard Ave E — Concord Adex\'s massive master-planned community at Sheppard and Leslie.',
    description: JSON.stringify({
      about: 'Concord Park Place Block 2 is part of Concord Adex\'s expansive master-planned community at Sheppard Avenue East and Leslie Street. Building on the success of earlier phases, Block 2 continues to add residential towers, parkland, and community amenities to this growing North York neighbourhood. The master plan envisions a complete community with parks, retail, and public spaces.',
      location: 'Located at Sheppard and Leslie in North York, the project is near Leslie TTC Station (Line 4 Sheppard). The Sheppard corridor provides access to the Yonge subway line at Sheppard-Yonge Station. The neighbourhood includes Ikea North York, the Shops at Don Mills, and the Don River valley trail system. Highway 401 is nearby for regional road access.',
      investment: 'Large master-planned communities by established developers tend to appreciate strongly as each phase adds amenities and retail. Concord\'s track record at CityPlace demonstrates their ability to create value through phased development. The Sheppard corridor benefits from Line 4 subway access and proximity to major employment centres.',
      developer: 'Concord Adex brings the same vision that created CityPlace — one of Canada\'s largest residential communities — to North York. With over 30,000 units built, Concord is one of Canada\'s most prolific residential developers.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is Concord Park Place?', answer: 'A master-planned community by Concord Adex at Sheppard and Leslie in North York, featuring multiple residential towers, parks, and community amenities.' },
    ]),
  },
  'galleria-on-the-park': { /* Already done in batch 2 — skip */ },
  'agincourt-mall-redevelopment': {
    metaTitle: 'Agincourt Mall Redevelopment | Pre-Construction Scarborough',
    metaDescription: 'Agincourt Mall Redevelopment at 3850 Sheppard Ave E — transforming the aging mall into a new mixed-use community in Scarborough.',
    description: JSON.stringify({
      about: 'The Agincourt Mall Redevelopment is a transformative project at 3850 Sheppard Avenue East, replacing the aging Agincourt Mall with a new mixed-use community. The North American Development Group\'s plan includes residential towers, new retail, public spaces, and community amenities. The redevelopment preserves essential services while creating a modern, transit-oriented neighbourhood.',
      location: 'Located on Sheppard Avenue East in the Agincourt neighbourhood of Scarborough, the project is near the Sheppard East bus corridor and future transit improvements. The area is a vibrant multicultural community with diverse restaurants and shops along Sheppard. Pacific Mall and Agincourt Recreation Centre are nearby. Highway 401 provides regional road access.',
      investment: 'Mall redevelopments in the GTA have proven to be highly successful investments. The conversion of aging retail into mixed-use communities creates significant value. Agincourt\'s strong multicultural community and demand for new housing support the project\'s long-term prospects.',
      developer: 'North American Development Group (NADG) is a real estate development and investment company with expertise in retail redevelopment. They specialize in transforming underperforming retail properties into vibrant mixed-use communities.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is happening to Agincourt Mall?', answer: 'The aging mall at 3850 Sheppard Ave E is being redeveloped into a new mixed-use community with residential towers, retail, and public spaces.' },
    ]),
  },
  'ava-luxury-residence': {
    metaTitle: 'Ava Luxury Residence | Pre-Construction Yorkville Toronto',
    metaDescription: 'Ava Luxury Residence in Yorkville — boutique luxury condo in Toronto\'s most prestigious neighbourhood near Bloor-Yonge Station.',
    description: JSON.stringify({
      about: 'Ava Luxury Residence is a boutique luxury condominium in the heart of Yorkville, Toronto\'s most prestigious neighbourhood. The project offers an exclusive collection of meticulously crafted residences with premium materials, high ceilings, and sophisticated design. As a boutique building, Ava provides an intimate, service-oriented living experience.',
      location: 'Yorkville is Toronto\'s premier luxury neighbourhood, home to Canada\'s finest boutiques, restaurants, and cultural institutions. Bloor-Yonge Station — the busiest interchange in the TTC system — connects residents to all parts of the city. The Royal Ontario Museum, Yorkville Village, and Holt Renfrew are steps away. The University of Toronto St. George campus is immediately south.',
      investment: 'Yorkville commands Toronto\'s highest price per square foot and has historically provided the strongest appreciation. Luxury boutique buildings with limited unit counts tend to hold value exceptionally well. International buyer interest in Yorkville remains strong, providing a diverse demand base.',
      developer: 'Details to be announced. The project\'s Yorkville location ensures it will attract the city\'s most discerning buyers.',
    }),
    faqJson: JSON.stringify([
      { question: 'What makes Yorkville special?', answer: 'Yorkville is Toronto\'s most prestigious neighbourhood, known for luxury shopping, fine dining, the Royal Ontario Museum, and some of the city\'s highest property values.' },
    ]),
  },
};

async function main() {
  console.log('=== Batch 3: Content for 10 important projects ===\n');
  let updated = 0;
  for (const [slug, content] of Object.entries(CONTENT)) {
    if (!content.metaTitle) continue; // Skip empty entries
    const { data, error } = await supabase.from('projects').update({
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      longDescription: content.description,
      faqJson: content.faqJson,
    }).eq('slug', slug).select('id, name');

    if (data?.length) { updated++; console.log('  ✓ ' + data[0].name); }
    else console.log('  ✗ ' + slug + ': ' + (error?.message || 'not found'));
  }
  console.log('\nUpdated ' + updated + ' projects');
}

main().catch(console.error);
