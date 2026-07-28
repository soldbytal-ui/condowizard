/**
 * Per-neighbourhood real data for Toronto pre-construction content.
 * Only include VERIFIED information. Each entry drives project-specific copy.
 * Canadian spelling. No em dashes.
 */

export const NEIGHBOURHOODS = {
  'queen-west': {
    canonicalName: 'Queen West',
    subDistrict: 'Fashion District and West Queen West',
    positioning: 'a creative and design-focused pocket of downtown Toronto west of University Avenue',
    subwayStations: [
      { name: 'Osgoode Station', line: 'Line 1 (Yonge-University)', context: 'a short walk east along Queen Street' },
      { name: 'St. Andrew Station', line: 'Line 1', context: 'accessible via the 501 Queen streetcar' },
    ],
    surfaceTransit: [
      'the 501 Queen streetcar running directly along Queen Street West',
      'the 510 Spadina streetcar connecting north to Spadina Station and south to Union',
    ],
    futureTransit: 'The provincially funded Ontario Line, currently under construction, is planned to include a Queen and Spadina station near the site.',
    landmarks: [
      { name: 'Trinity Bellwoods Park', context: 'a 15-hectare park a short streetcar ride west' },
      { name: 'MOCA Toronto', context: 'the Museum of Contemporary Art on Sterling Road' },
      { name: 'CityPlace and Rogers Centre', context: 'directly south of the site' },
      { name: 'the Financial District and TIFF Bell Lightbox', context: 'both a short streetcar ride east' },
    ],
    employmentNodes: 'The Financial District, MaRS Discovery District and the King Street West tech corridor are all reachable in under 15 minutes by streetcar.',
    employmentSummary: 'Financial District employment, the King West tech corridor and university and hospital jobs a short streetcar ride east',
    residentProfile: 'The area attracts creative professionals, media and tech workers, and downsizers who value walkable independent retail.',
    rentalDemandContext: 'Rental demand in Queen West has historically been supported by proximity to OCAD University, Toronto Metropolitan University and downtown employment.',
    supplyContext: 'A number of tower proposals along Spadina Avenue and Adelaide Street may deliver competing supply through the late 2020s.',
  },

  'downtown-core': {
    canonicalName: 'Downtown Core',
    subDistrict: 'the Church-Yonge Corridor, Bay Street Corridor and Garden District',
    positioning: 'central Toronto, within walking distance of Yonge-Dundas Square, the Financial District and Toronto Metropolitan University',
    subwayStations: [
      { name: 'Dundas Station', line: 'Line 1 (Yonge-University)', context: 'walkable from most sites in the corridor' },
      { name: 'Queen Station', line: 'Line 1', context: 'connecting north to Bloor and south to Union' },
      { name: 'College Station', line: 'Line 1', context: 'a few minutes north' },
    ],
    surfaceTransit: [
      'the 501 Queen and 505 Dundas streetcars',
      'the 506 Carlton streetcar',
      'multiple Yonge Street bus and shuttle connections',
    ],
    futureTransit: 'Future service on the Ontario Line will introduce new stations at Queen, Moss Park and Corktown, improving east-west connectivity for the corridor.',
    landmarks: [
      { name: 'Yonge-Dundas Square', context: 'the primary public plaza of downtown Toronto' },
      { name: 'Eaton Centre', context: 'the main downtown shopping mall' },
      { name: 'Toronto Metropolitan University', context: 'centred on Gould Street' },
      { name: 'the Discovery District hospitals', context: 'including Toronto General, Mount Sinai, SickKids and Princess Margaret' },
    ],
    employmentNodes: 'The Financial District, Discovery District and the healthcare cluster along University Avenue are all within a 10 to 15 minute walk.',
    employmentSummary: 'Financial District office employment, healthcare jobs along University Avenue and university employment at Toronto Metropolitan University',
    residentProfile: 'The area serves a mix of downtown professionals, hospital and university staff, students and pied-a-terre owners.',
    rentalDemandContext: 'Rental demand in the downtown core is supported by hospital, university and Financial District employment, and by ongoing tourism.',
    supplyContext: 'A significant volume of high-rise pre-construction inventory is either under construction or in registration across the corridor, which may compress lease-up pace at delivery.',
  },

  'st-lawrence': {
    canonicalName: 'St. Lawrence',
    subDistrict: 'the St. Lawrence Market, Old Town and King East neighbourhoods',
    positioning: 'a historic mixed-use quarter east of Yonge Street, defined by the St. Lawrence Market, Berczy Park and 19th-century commercial architecture',
    subwayStations: [
      { name: 'King Station', line: 'Line 1 (Yonge-University)', context: 'a short walk west along King Street' },
      { name: 'Union Station', line: 'Line 1 and GO Transit', context: 'accessible via the 504 King streetcar' },
    ],
    surfaceTransit: [
      'the 504 King streetcar running along King Street East',
      'the 503 Kingston Road streetcar during peak periods',
      'the 121 Fort York and 65 Parliament bus routes',
    ],
    futureTransit: 'The Ontario Line, currently under construction, will introduce a station at Corktown, a short walk east of the neighbourhood.',
    landmarks: [
      { name: 'St. Lawrence Market', context: 'a historic public market on Front Street East' },
      { name: 'the Distillery District', context: 'a pedestrian-only 19th-century industrial district a short walk east' },
      { name: 'Sculpture Gardens, Berczy Park and David Crombie Park', context: 'green spaces integrated with the surrounding blocks' },
      { name: 'the Meridian Hall performing arts complex', context: 'on Front Street' },
    ],
    employmentNodes: 'The Financial District is directly west along King and Wellington, and the South Core office cluster is a short walk south.',
    employmentSummary: 'Financial District office employment directly west, South Core towers south of Front Street, and Union Station commuting access',
    residentProfile: 'The area is popular with professionals working in the Financial District, empty-nesters and downtown-oriented investors.',
    rentalDemandContext: 'Rental demand is supported by downtown office employment, tourism and proximity to Union Station.',
    supplyContext: 'Several planning applications along King East and Front Street East may add competing supply, though the pace of approvals has been slower than in the Entertainment District.',
  },

  'king-west': {
    canonicalName: 'King West',
    subDistrict: 'the Entertainment District and the King West corridor',
    positioning: 'one of Toronto\'s most active downtown mixed-use districts, defined by theatres, restaurants, tech offices and 24-hour street life',
    subwayStations: [
      { name: 'St. Andrew Station', line: 'Line 1 (Yonge-University)', context: 'connecting the district to Union Station in one stop' },
      { name: 'Osgoode Station', line: 'Line 1', context: 'walkable via Queen Street West' },
    ],
    surfaceTransit: [
      'the 504 King streetcar operating along King Street West',
      'the 510 Spadina streetcar linking north to Spadina Station',
      'the 509 and 511 waterfront and Bathurst streetcars nearby',
    ],
    futureTransit: 'The Ontario Line, currently under construction, will provide additional relief at Queen Street stations, indirectly improving downtown surface transit.',
    landmarks: [
      { name: 'TIFF Bell Lightbox', context: 'the year-round home of the Toronto International Film Festival on King Street West' },
      { name: 'Roy Thomson Hall and the Royal Alexandra Theatre', context: 'both on the Simcoe Street cultural corridor' },
      { name: 'the Rogers Centre and Scotiabank Arena', context: 'a short walk south' },
      { name: 'the King West restaurant strip', context: 'concentrated between Spadina and Bathurst' },
    ],
    employmentNodes: 'The Financial District begins one block north at Wellington Street, and King West itself has become a secondary office cluster for tech, media and professional services.',
    employmentSummary: 'Financial District jobs one block north, tech and media offices along King West, and entertainment and hospitality employment across the district',
    residentProfile: 'King West attracts young professionals, tech workers, investors and downtown-oriented downsizers.',
    rentalDemandContext: 'Rental demand is consistently strong given proximity to the Financial District, entertainment venues and King Street employment.',
    supplyContext: 'The Entertainment District has one of the largest pipelines of high-rise pre-construction inventory in North America. Buyers should evaluate the volume of competing supply expected to reach occupancy within a two- to three-year window of the project.',
  },

  'waterfront': {
    canonicalName: 'Toronto Waterfront',
    subDistrict: 'Harbourfront, East Bayfront and the Central Waterfront',
    positioning: 'Toronto\'s Lake Ontario shoreline, the focus of a two-decade public realm and infrastructure programme led by Waterfront Toronto',
    subwayStations: [
      { name: 'Union Station', line: 'Line 1, GO Transit and the UP Express to Pearson Airport', context: 'a short walk or streetcar ride from most Harbourfront sites' },
    ],
    surfaceTransit: [
      'the 509 Harbourfront and 510 Spadina streetcars serving Queens Quay',
      'the 511 Bathurst streetcar to Exhibition Loop',
      'GO Transit lines terminating at Union',
      'the Toronto Islands ferry from Jack Layton Ferry Terminal',
    ],
    futureTransit: 'The proposed Waterfront East LRT would extend dedicated streetcar service east from Union along Queens Quay to the Port Lands.',
    landmarks: [
      { name: 'the Harbourfront Centre cultural campus', context: 'anchoring the central waterfront' },
      { name: 'the Music Garden and Sherbourne Common', context: 'part of the completed waterfront park network' },
      { name: 'Billy Bishop Toronto City Airport', context: 'accessible by pedestrian tunnel from the foot of Bathurst Street' },
      { name: 'Scotiabank Arena, Rogers Centre and the Financial District', context: 'all reachable on foot or by streetcar' },
    ],
    employmentNodes: 'The Financial District and South Core office towers are directly north of Harbourfront and are the primary employment draw for waterfront residents.',
    employmentSummary: 'Financial District and South Core office employment directly north, plus walk-in access to Union Station regional and commuter rail',
    residentProfile: 'Waterfront buildings serve a mix of Financial District professionals, empty-nesters, international investors and short-term rental operators subject to local zoning.',
    rentalDemandContext: 'Rental demand is supported by walkable access to the Financial District, tourism activity and Union Station connectivity.',
    supplyContext: 'Several new towers are planned or under construction across the Central Waterfront and Quayside precincts, which may add competing rental supply over the same delivery window.',
  },
};

// ─── Midtown & Central ───────────────────────────────────────────────────────

NEIGHBOURHOODS['yorkville'] = {
  canonicalName: 'Yorkville',
  subDistrict: 'Bloor-Yorkville and the Bloor-Yonge district',
  positioning: 'Toronto\'s primary luxury retail and hospitality district, centred on the Mink Mile between Yonge and Avenue',
  subwayStations: [
    { name: 'Bloor-Yonge Station', line: 'Line 1 (Yonge-University) and Line 2 (Bloor-Danforth)', context: 'the busiest interchange in the TTC system, directly at Yonge and Bloor' },
    { name: 'Bay Station', line: 'Line 2', context: 'a short walk west along Bloor' },
  ],
  surfaceTransit: [
    'multiple Bloor Street and Avenue Road bus routes',
    'a network of taxi and ride-hail pick-up points along Bloor and Cumberland',
  ],
  futureTransit: 'The Yonge North Subway Extension, currently in planning and design, will extend Line 1 further north from Finch and add regional demand at Bloor-Yonge.',
  landmarks: [
    { name: 'the Royal Ontario Museum', context: 'at Bloor and Avenue' },
    { name: 'the Mink Mile luxury retail strip', context: 'along Bloor Street between Avenue and Yonge' },
    { name: 'Yorkville Village and Hazelton Lanes', context: 'anchored around Avenue and Yorkville' },
    { name: 'University of Toronto', context: 'a short walk south' },
  ],
  employmentNodes: 'The Financial District and Discovery District are both within a 10 minute subway ride, and the neighbourhood itself hosts hospitality, professional services and boutique retail employment.',
  employmentSummary: 'Financial District office employment a short subway ride south, hospital and university employment along University Avenue, and hospitality and retail jobs across Yorkville itself',
  residentProfile: 'Yorkville serves an established luxury market of empty-nesters, international investors, senior executives and downsizers from Rosedale and Forest Hill.',
  rentalDemandContext: 'Rental demand is anchored by international students, hospital and university staff, and downtown professionals paying for proximity to Bloor-Yonge.',
  supplyContext: 'Several ultra-luxury and mixed-use towers are proposed or approved on Yonge, Bloor and Cumberland, which may add competing supply through the late 2020s.',
};

NEIGHBOURHOODS['the-annex'] = {
  canonicalName: 'The Annex',
  subDistrict: 'the Annex and Museum District',
  positioning: 'a residential neighbourhood defined by 19th-century houses, boutique retail and its adjacency to the University of Toronto and the Royal Ontario Museum',
  subwayStations: [
    { name: 'Spadina Station', line: 'Line 1 (Yonge-University) and Line 2 (Bloor-Danforth)', context: 'an interchange station within the neighbourhood' },
    { name: 'St. George Station', line: 'Line 1 and Line 2', context: 'a second interchange station at the campus edge' },
    { name: 'Bathurst Station', line: 'Line 2', context: 'at the western edge of the neighbourhood' },
  ],
  surfaceTransit: [
    'the 510 Spadina streetcar running along Spadina Avenue',
    'multiple Bloor and Bathurst bus routes',
  ],
  futureTransit: 'The Bloor Street protected bike lane and ongoing streetscape improvements are extending active transportation options across the neighbourhood.',
  landmarks: [
    { name: 'the University of Toronto St. George campus', context: 'directly adjacent' },
    { name: 'the Royal Ontario Museum', context: 'at the eastern end of Bloor and Avenue' },
    { name: 'Casa Loma', context: 'a short walk north' },
    { name: 'Bloor Street\'s independent retail strip', context: 'concentrated between Spadina and Bathurst' },
  ],
  employmentNodes: 'The University of Toronto, the hospitals along University Avenue and the Financial District are all reachable within 15 minutes by transit.',
  employmentSummary: 'University of Toronto employment directly adjacent, hospital jobs along University Avenue, and Financial District access via Line 1',
  residentProfile: 'The Annex has a mix of university-adjacent renters, faculty, established residents in restored houses and downsizers.',
  rentalDemandContext: 'Rental demand is supported by the University of Toronto, teaching hospitals and downtown employment.',
  supplyContext: 'Height restrictions and neighbourhood opposition have historically limited high-rise supply, though several proposals are now advancing on the Bloor Street corridor.',
};

NEIGHBOURHOODS['summerhill-rosedale'] = {
  canonicalName: 'Summerhill and Rosedale',
  subDistrict: 'the Summerhill and North Rosedale areas along Yonge Street',
  positioning: 'one of Toronto\'s most established affluent residential districts, defined by ravines, historic houses and the LCBO Summerhill store on the former CPR station',
  subwayStations: [
    { name: 'Summerhill Station', line: 'Line 1 (Yonge-University)', context: 'directly along Yonge Street in the neighbourhood' },
    { name: 'Rosedale Station', line: 'Line 1', context: 'a short walk south' },
    { name: 'St. Clair Station', line: 'Line 1', context: 'a short walk north' },
  ],
  surfaceTransit: [
    'the 5 Avenue Road bus',
    'multiple Yonge Street local routes',
  ],
  futureTransit: 'No major transit projects are currently under construction inside the neighbourhood itself.',
  landmarks: [
    { name: 'the ravine system through Rosedale', context: 'accessible via multiple entry points' },
    { name: 'the Summerhill LCBO', context: 'in the restored 1916 CPR station' },
    { name: 'the retail strip along Yonge between Summerhill and St. Clair', context: 'anchored by independent food, wine and design shops' },
  ],
  employmentNodes: 'The Financial District is a 12 minute subway ride south, and midtown Yonge and St. Clair employment is a short walk north.',
  employmentSummary: 'Financial District access via Line 1, midtown Yonge and St. Clair professional services, and the medical corridor at University Avenue',
  residentProfile: 'The area attracts established professionals, downsizers from Rosedale houses, and buyers looking for boutique-scale condominium alternatives to single-family homes in the surrounding streets.',
  rentalDemandContext: 'Rental demand is moderate given the low turnover in surrounding houses, but well-located boutique buildings often retain long-term tenants.',
  supplyContext: 'New supply in Summerhill and Rosedale has historically been limited due to zoning, though several boutique projects are moving through planning.',
};

NEIGHBOURHOODS['yonge-st-clair'] = {
  canonicalName: 'Yonge and St. Clair',
  subDistrict: 'Deer Park and the Yonge-St. Clair midtown district',
  positioning: 'a compact office and retail node at the top of the Yonge subway line, with easy access to Rosedale, Forest Hill and downtown',
  subwayStations: [
    { name: 'St. Clair Station', line: 'Line 1 (Yonge-University)', context: 'at the heart of the district' },
  ],
  surfaceTransit: [
    'the 512 St. Clair streetcar running east and west along St. Clair',
    'multiple Yonge Street bus routes',
  ],
  futureTransit: 'No major transit projects are currently under construction at Yonge and St. Clair.',
  landmarks: [
    { name: 'the office and retail cluster at Yonge and St. Clair', context: 'a secondary midtown employment node' },
    { name: 'Rosehill Reservoir Park and David A. Balfour Park', context: 'both a short walk east into the ravine system' },
    { name: 'Forest Hill Village', context: 'a short streetcar ride west' },
  ],
  employmentNodes: 'The Yonge-St. Clair office cluster hosts professional services, financial back-office and healthcare tenants, and the Financial District is a 12 minute subway ride south.',
  employmentSummary: 'the local Yonge and St. Clair office cluster, downtown Financial District access via Line 1, and midtown hospital employment',
  residentProfile: 'The area serves professionals, downsizers from Forest Hill and Rosedale, and long-term midtown residents.',
  rentalDemandContext: 'Rental demand is anchored by Line 1 subway access, midtown office employment and proximity to established residential neighbourhoods.',
  supplyContext: 'A number of mid-rise and high-rise proposals are advancing on Yonge, Pleasant and St. Clair, which may add supply through 2030.',
};

NEIGHBOURHOODS['yonge-eglinton'] = {
  canonicalName: 'Yonge and Eglinton',
  subDistrict: 'the Yonge and Eglinton midtown employment and retail node',
  positioning: 'a rapidly densifying midtown centre at the intersection of the Yonge subway line and the new Eglinton Crosstown LRT',
  subwayStations: [
    { name: 'Eglinton Station', line: 'Line 1 (Yonge-University) and Line 5 (Eglinton Crosstown LRT)', context: 'an interchange station at the heart of the district' },
    { name: 'Davisville Station', line: 'Line 1', context: 'a short walk south' },
  ],
  surfaceTransit: [
    'the Line 5 Eglinton Crosstown LRT providing east-west service across the city',
    'multiple bus routes along Yonge, Eglinton and Mount Pleasant',
  ],
  futureTransit: 'The Line 5 Eglinton Crosstown LRT is expected to open in phases, reshaping east-west travel across the midtown corridor.',
  landmarks: [
    { name: 'Yonge Eglinton Centre', context: 'a mixed-use office, retail and cinema complex' },
    { name: 'the North Toronto Collegiate Institute campus and June Rowlands Park', context: 'directly across from the intersection' },
    { name: 'the Eglinton restaurant strip', context: 'concentrated along Eglinton Avenue east and west of Yonge' },
  ],
  employmentNodes: 'The Yonge and Eglinton office cluster has become one of Toronto\'s largest midtown employment nodes, and downtown is a 15 minute Line 1 ride south.',
  employmentSummary: 'the Yonge and Eglinton midtown office cluster, downtown Financial District access via Line 1, and future east-west LRT connections along Line 5',
  residentProfile: 'The area serves young professionals, downsizers from Chaplin Estates and Lawrence Park, and an active rental market of transit-oriented tenants.',
  rentalDemandContext: 'Rental demand at Yonge and Eglinton has historically been strong given subway access and midtown employment, and the Line 5 LRT is expected to reinforce this.',
  supplyContext: 'One of the highest concentrations of high-rise pre-construction proposals outside downtown is now advancing at Yonge and Eglinton, which may generate significant lease-up competition.',
};

// ─── North York ───────────────────────────────────────────────────────────────

NEIGHBOURHOODS['north-york'] = {
  canonicalName: 'North York Centre',
  subDistrict: 'the Yonge-Sheppard, Yonge-Finch, North York Centre and Newtonbrook corridors',
  positioning: 'the largest suburban office and residential centre in Toronto, focused along the northern segment of Line 1',
  subwayStations: [
    { name: 'North York Centre Station', line: 'Line 1 (Yonge-University)', context: 'central to the district' },
    { name: 'Sheppard-Yonge Station', line: 'Line 1 and Line 4 (Sheppard)', context: 'an interchange station south of Finch' },
    { name: 'Finch Station', line: 'Line 1', context: 'the northern terminus of Line 1 with a major bus terminal' },
  ],
  surfaceTransit: [
    'the Line 4 Sheppard subway running east from Sheppard-Yonge',
    'the future Finch West LRT (Line 6) intersecting the Yonge corridor at Finch',
    'multiple Yonge, Sheppard and Steeles bus routes',
  ],
  futureTransit: 'The Yonge North Subway Extension will extend Line 1 north from Finch to Highway 7 in Richmond Hill, and the Line 6 Finch West LRT is under construction.',
  landmarks: [
    { name: 'Mel Lastman Square and North York Centre', context: 'the civic heart of the district' },
    { name: 'the Toronto Centre for the Arts', context: 'along Yonge Street' },
    { name: 'Empress Walk and Yonge Street retail', context: 'along the subway spine' },
    { name: 'the North York General Hospital campus', context: 'along Leslie Street' },
  ],
  employmentNodes: 'North York Centre hosts significant office employment along Yonge Street and Sheppard Avenue, and downtown is reachable in about 30 minutes via Line 1.',
  employmentSummary: 'the North York Centre office cluster, hospital employment along Leslie Street, and Line 1 access to the downtown Financial District',
  residentProfile: 'North York serves a mix of new-immigrant families, transit-oriented professionals and downsizers from surrounding North York and Willowdale houses.',
  rentalDemandContext: 'Rental demand is strong given Line 1 access, hospital and office employment, and a large international student population attending York University to the west.',
  supplyContext: 'A large volume of high-rise supply is proposed along the Yonge, Sheppard and Finch corridors, with several master-planned communities advancing through planning.',
};

NEIGHBOURHOODS['don-mills'] = {
  canonicalName: 'Don Mills',
  subDistrict: 'the Don Mills and Eglinton and Don Mills and Sheppard corridors',
  positioning: 'a post-war planned suburb now being intensified around new Line 5 Eglinton Crosstown LRT stations and mixed-use master plans',
  subwayStations: [
    { name: 'Don Mills Station', line: 'Line 4 (Sheppard)', context: 'at Don Mills and Sheppard' },
    { name: 'the future Science Centre Station', line: 'Line 5 (Eglinton Crosstown LRT) and Line 4', context: 'a planned interchange at Don Mills and Eglinton' },
  ],
  surfaceTransit: [
    'multiple Don Mills, Eglinton and Sheppard bus routes',
    'the future Line 5 Eglinton Crosstown LRT along Eglinton Avenue',
  ],
  futureTransit: 'The Line 5 Eglinton Crosstown LRT will provide new east-west rapid transit across the district, and the Ontario Line is planned to terminate at Science Centre Station in the future.',
  landmarks: [
    { name: 'the Ontario Science Centre', context: 'adjacent to the future LRT station' },
    { name: 'the Shops at Don Mills', context: 'a mixed-use open-air retail centre at Don Mills and Lawrence' },
    { name: 'the Aga Khan Museum', context: 'a short drive north on Wynford' },
    { name: 'Edwards Gardens and the Toronto Botanical Garden', context: 'immediately south of Lawrence' },
  ],
  employmentNodes: 'Don Mills hosts commercial and technology tenants at the CIBC Square North York campus and neighbouring office parks, and the downtown Financial District is a 25 minute drive.',
  employmentSummary: 'the Don Mills office and technology parks, retail employment at Shops at Don Mills, and future Line 5 access to midtown and beyond',
  residentProfile: 'Don Mills serves a mix of established families, transit-oriented professionals working in the surrounding office parks and downsizers from the neighbouring low-rise streets.',
  rentalDemandContext: 'Rental demand is expected to strengthen with the opening of Line 5 and additional master-planned inventory.',
  supplyContext: 'Several master-plan communities are in construction or approvals along Don Mills, which will deliver significant new supply through the late 2020s.',
};

// ─── East End ─────────────────────────────────────────────────────────────────

NEIGHBOURHOODS['leslieville'] = {
  canonicalName: 'Leslieville',
  subDistrict: 'Leslieville and adjacent portions of South Riverdale',
  positioning: 'an east-end mixed residential and commercial neighbourhood along Queen East, defined by heritage main-street retail and creative-industry offices',
  subwayStations: [
    { name: 'Pape Station', line: 'Line 2 (Bloor-Danforth)', context: 'a short bus ride north' },
  ],
  surfaceTransit: [
    'the 501 Queen streetcar running directly along Queen East',
    'the 506 Carlton streetcar linking to Broadview and downtown',
    'the 72 Pape and 83 Jones bus routes',
  ],
  futureTransit: 'The Line 3 Ontario Line, currently under construction, will include a Leslieville station at Queen and Degrassi, providing rapid transit into downtown.',
  landmarks: [
    { name: 'the Leslieville main street on Queen East', context: 'anchored by independent restaurants, shops and cafes' },
    { name: 'Riverside and the Broadview Hotel', context: 'a short streetcar ride west' },
    { name: 'the Beaches', context: 'a 10 minute streetcar ride east' },
    { name: 'the Port Lands and future Villiers Island', context: 'south of the neighbourhood' },
  ],
  employmentNodes: 'The Financial District is a 15 to 20 minute streetcar or car ride west, and the neighbourhood itself hosts a growing creative and film-industry office cluster.',
  employmentSummary: 'downtown Financial District via the 501 Queen streetcar, film and creative-industry offices along Queen East, and future Ontario Line access',
  residentProfile: 'Leslieville attracts young families, creative professionals and downtown-oriented residents priced out of King West and Queen West.',
  rentalDemandContext: 'Rental demand is strong given downtown streetcar access, main-street amenities and family-friendly parks.',
  supplyContext: 'A moderate number of low-rise and mid-rise projects are advancing along Queen and Eastern, though supply remains lower than in comparable downtown neighbourhoods.',
};

NEIGHBOURHOODS['danforth'] = {
  canonicalName: 'The Danforth',
  subDistrict: 'Greektown on the Danforth and the Main and Danforth intersection',
  positioning: 'a mixed residential and main-street neighbourhood along the Danforth, defined by walkable retail, subway access and low-rise character streets',
  subwayStations: [
    { name: 'Pape Station', line: 'Line 2 (Bloor-Danforth)', context: 'along the Danforth corridor' },
    { name: 'Chester and Broadview Stations', line: 'Line 2', context: 'other station options west along Danforth' },
    { name: 'Main Street Station', line: 'Line 2', context: 'at Main and Danforth further east' },
  ],
  surfaceTransit: [
    'multiple bus routes along Pape, Coxwell and Woodbine',
    'the 506 Carlton streetcar reaching the northern edge of the neighbourhood',
  ],
  futureTransit: 'The Line 3 Ontario Line, currently under construction, will add a Pape interchange with Line 2 and further improve east-side rapid transit.',
  landmarks: [
    { name: 'Greektown restaurants and shops', context: 'concentrated between Chester and Pape' },
    { name: 'Riverdale Park and Broadview Avenue', context: 'a short walk west with downtown skyline views' },
    { name: 'the Danforth Music Hall', context: 'along the main strip' },
    { name: 'Withrow Park', context: 'directly south of the Danforth' },
  ],
  employmentNodes: 'The Financial District is a 20 minute subway ride via Line 2, and downtown east-end employment is a short streetcar ride south.',
  employmentSummary: 'downtown Financial District via Line 2, retail and hospitality employment along the Danforth, and future Ontario Line east-side connections',
  residentProfile: 'The Danforth attracts young families, downtown-oriented professionals and long-term east-end residents.',
  rentalDemandContext: 'Rental demand is supported by subway access, main-street amenities and the family-friendly character of the surrounding streets.',
  supplyContext: 'New pre-construction supply along the Danforth has been modest to date but is beginning to increase around subway stations.',
};

// ─── West End ─────────────────────────────────────────────────────────────────

NEIGHBOURHOODS['high-park'] = {
  canonicalName: 'High Park',
  subDistrict: 'the High Park, Bloor West Village, Swansea and Roncesvalles areas',
  positioning: 'a west-end residential district anchored by High Park, one of Toronto\'s largest urban parks',
  subwayStations: [
    { name: 'High Park Station', line: 'Line 2 (Bloor-Danforth)', context: 'at the eastern edge of the park' },
    { name: 'Keele Station', line: 'Line 2', context: 'a short walk east' },
    { name: 'Runnymede Station', line: 'Line 2', context: 'along the Bloor West Village strip' },
  ],
  surfaceTransit: [
    'the 504 King streetcar via Roncesvalles',
    'the 501 Queen streetcar along Queen West',
    'the 40 Junction and 168 Symington bus routes',
  ],
  futureTransit: 'No major new transit projects are currently under construction within the neighbourhood.',
  landmarks: [
    { name: 'High Park', context: 'a 400-acre park with playgrounds, tennis, hiking and the historic Grenadier Pond' },
    { name: 'Bloor West Village', context: 'a walkable retail main street along Bloor' },
    { name: 'Roncesvalles Village', context: 'a Polish-heritage main street south of the park' },
    { name: 'the waterfront at Sunnyside', context: 'a short walk south' },
  ],
  employmentNodes: 'The Financial District is a 20 minute streetcar or subway ride east, and local retail, hospitality and school employment are anchored on the surrounding main streets.',
  employmentSummary: 'downtown Financial District via Line 2, retail and school employment along Bloor West Village and Roncesvalles, and creative-industry offices in adjacent Junction and Parkdale',
  residentProfile: 'High Park serves families with children, downsizers from surrounding low-rise houses and long-term west-end residents.',
  rentalDemandContext: 'Rental demand is supported by park access, walkable retail and Line 2 subway connectivity.',
  supplyContext: 'High-rise development in the immediate High Park area is limited by zoning and community opposition, though several mid-rise proposals are advancing along Bloor and Dundas.',
};

NEIGHBOURHOODS['junction'] = {
  canonicalName: 'The Junction',
  subDistrict: 'The Junction, Junction Triangle and Stockyards areas',
  positioning: 'a west-end former industrial district being redeveloped around Dundas West and Keele, with a focus on independent retail and heritage industrial buildings',
  subwayStations: [
    { name: 'Dundas West Station', line: 'Line 2 (Bloor-Danforth)', context: 'the primary subway access, connected to the Bloor GO station' },
    { name: 'Keele Station', line: 'Line 2', context: 'a second option a short walk east' },
  ],
  surfaceTransit: [
    'the 40 Junction bus along Dundas West',
    'the 168 Symington and 89 Weston bus routes',
    'the 505 Dundas streetcar terminating at Dundas West',
  ],
  futureTransit: 'The Line 5 Eglinton Crosstown LRT and future GO expansion along the Kitchener line will improve regional connectivity to the west.',
  landmarks: [
    { name: 'the Dundas West main street', context: 'anchored by independent restaurants, breweries and shops' },
    { name: 'the Stockyards retail centre', context: 'to the north on St. Clair West' },
    { name: 'the West Toronto Railpath', context: 'a linear cycling and walking route from Dundas West' },
    { name: 'the MOCA Toronto museum on Sterling Road', context: 'a short walk east' },
  ],
  employmentNodes: 'The Financial District is a 25 minute ride via Line 2 or GO, and the district itself hosts a growing creative and small-business office base.',
  employmentSummary: 'downtown Financial District via Line 2 and the Bloor GO station, creative-industry offices along Sterling Road, and retail and hospitality employment along Dundas West',
  residentProfile: 'The Junction attracts young families, creative professionals and downtown-oriented residents priced out of Queen West and Dundas West.',
  rentalDemandContext: 'Rental demand is supported by main-street amenities, subway access and the growing office and creative-industry base along Sterling and Dupont.',
  supplyContext: 'A significant volume of low-rise and mid-rise projects is advancing along Dundas West and Keele, which may increase competing supply through the late 2020s.',
};

// ─── Scarborough ──────────────────────────────────────────────────────────────

NEIGHBOURHOODS['scarborough'] = {
  canonicalName: 'Scarborough',
  subDistrict: 'the Scarborough Town Centre, Kennedy, Golden Mile, Birch Cliff and adjacent Scarborough neighbourhoods',
  positioning: 'Toronto\'s largest suburban district, being reshaped by the Line 2 subway extension to Scarborough Town Centre and the Line 5 Eglinton Crosstown LRT',
  subwayStations: [
    { name: 'Kennedy Station', line: 'Line 2 (Bloor-Danforth) and future Line 5 (Eglinton Crosstown LRT)', context: 'the current interchange point' },
    { name: 'the future Scarborough Centre Station', line: 'Line 2 extension', context: 'planned as the northern terminus of the extended subway' },
  ],
  surfaceTransit: [
    'the future Line 5 Eglinton Crosstown LRT along Eglinton East',
    'the future Line 3 Scarborough replacement bus service and BRT along the former RT alignment',
    'multiple Kingston Road, Sheppard and Lawrence bus routes',
  ],
  futureTransit: 'The Line 2 East Extension is under construction and will extend the subway to Scarborough Centre, and the Line 5 Eglinton Crosstown LRT is being extended east across Scarborough.',
  landmarks: [
    { name: 'Scarborough Town Centre', context: 'a major regional shopping mall and civic hub' },
    { name: 'the Scarborough Bluffs and Bluffer\'s Park', context: 'along the Lake Ontario shoreline' },
    { name: 'the Toronto Zoo and Rouge National Urban Park', context: 'to the east of the district' },
    { name: 'Centennial College and the University of Toronto Scarborough campus', context: 'in Highland Creek' },
  ],
  employmentNodes: 'Scarborough hosts significant office, healthcare, education and industrial employment, and downtown is a 45 minute commute via Line 2.',
  employmentSummary: 'the Scarborough Town Centre and Consilium Place office clusters, healthcare employment at Scarborough Health Network hospitals, and future Line 2 subway access to downtown',
  residentProfile: 'Scarborough serves a diverse mix of new-immigrant families, transit-oriented renters and downsizers from surrounding low-rise houses.',
  rentalDemandContext: 'Rental demand is supported by employment centres, colleges and universities, and improving transit access.',
  supplyContext: 'New high-rise supply is concentrated around Scarborough Town Centre, Kennedy Station and Golden Mile, with a significant pipeline advancing through the late 2020s.',
};

// ─── Etobicoke ────────────────────────────────────────────────────────────────

NEIGHBOURHOODS['etobicoke'] = {
  canonicalName: 'Etobicoke',
  subDistrict: 'the Islington City Centre, Mimico, Humber Bay Shores, Kingsway, Long Branch and adjacent Etobicoke neighbourhoods',
  positioning: 'Toronto\'s western district, containing the Islington-Kipling office cluster, Mimico waterfront, Humber Bay Shores condominium corridor and older residential neighbourhoods along the lake',
  subwayStations: [
    { name: 'Kipling Station', line: 'Line 2 (Bloor-Danforth) and GO Milton', context: 'the western terminus of Line 2 and a major regional interchange' },
    { name: 'Islington Station', line: 'Line 2', context: 'a short walk east of Kipling' },
    { name: 'Royal York Station', line: 'Line 2', context: 'along Bloor West' },
  ],
  surfaceTransit: [
    'the 501 Queen streetcar terminating at Long Branch',
    'GO Transit Lakeshore West trains at Mimico, Long Branch and Kipling',
    'MiWay Mississauga Transit and Brampton Transit connections at Islington and Kipling',
  ],
  futureTransit: 'The Metrolinx GO Expansion programme is increasing Lakeshore West service, and the future Waterfront West LRT would extend rapid transit along Queensway and Lake Shore.',
  landmarks: [
    { name: 'Humber Bay Shores Park and the Humber Bay Arch Bridge', context: 'along the waterfront' },
    { name: 'Mimico Village and the waterfront trail', context: 'south of Lake Shore Boulevard' },
    { name: 'Sherway Gardens', context: 'a regional shopping mall on The West Mall' },
    { name: 'the Islington and Kipling office cluster', context: 'anchored at Bloor and Islington' },
  ],
  employmentNodes: 'The Islington-Kipling office cluster hosts significant back-office and professional-services employment, and downtown Toronto is a 30 minute Line 2 ride east.',
  employmentSummary: 'the Islington and Kipling office cluster, downtown Toronto via Line 2 and Lakeshore West GO, and Mississauga employment via MiWay connections',
  residentProfile: 'Etobicoke serves a mix of downsizers from surrounding low-rise houses, GTA-wide commuters using Kipling as a hub, and waterfront-oriented buyers.',
  rentalDemandContext: 'Rental demand is supported by Line 2 and GO access, waterfront amenities and the Islington-Kipling office employment base.',
  supplyContext: 'Significant new supply is being delivered around Islington-Kipling and Humber Bay Shores, with additional master-planned communities advancing along Lake Shore.',
};

// ─── Regent Park ──────────────────────────────────────────────────────────────

NEIGHBOURHOODS['regent-park'] = {
  canonicalName: 'Regent Park',
  subDistrict: 'the Regent Park master-planned community, redeveloped in partnership between Toronto Community Housing and The Daniels Corporation',
  positioning: 'a downtown east-side neighbourhood rebuilt over multiple phases as a mixed-income community with new market and affordable housing, parks and community facilities',
  subwayStations: [
    { name: 'Dundas Station', line: 'Line 1 (Yonge-University)', context: 'a short streetcar ride west' },
    { name: 'Queen Station', line: 'Line 1', context: 'a short streetcar ride west along Queen' },
  ],
  surfaceTransit: [
    'the 501 Queen and 505 Dundas streetcars along the neighbourhood edges',
    'the 65 Parliament bus and other Parliament Street routes',
  ],
  futureTransit: 'The Line 3 Ontario Line, currently under construction, will include a Moss Park station a short walk west of the neighbourhood.',
  landmarks: [
    { name: 'the Regent Park Aquatic Centre and Community Centre', context: 'anchoring the community\'s civic amenities' },
    { name: 'the Regent Park Athletic Grounds and Big Park', context: 'a network of public open space added through the redevelopment' },
    { name: 'Daniels Spectrum', context: 'a cultural centre on Dundas East' },
    { name: 'the retail spine along Dundas Street East', context: 'anchored by grocery, banking and neighbourhood-scale retail' },
  ],
  employmentNodes: 'The Financial District is a 15 minute streetcar or subway ride west, and downtown east-side employment is directly adjacent.',
  employmentSummary: 'downtown Financial District via streetcar, hospital and university employment along the University Avenue corridor, and local retail and community-sector jobs',
  residentProfile: 'Regent Park is intentionally mixed-income and serves market condominium buyers, subsidised-housing residents and long-term community members.',
  rentalDemandContext: 'Rental demand is supported by downtown employment, community amenities and improving transit access.',
  supplyContext: 'The final phases of the Regent Park redevelopment are still advancing, and additional supply is planned on Parliament Street and along Dundas East.',
};

NEIGHBOURHOODS['forest-hill'] = {
  canonicalName: 'Forest Hill',
  subDistrict: 'Forest Hill Village and the St. Clair West corridor',
  positioning: 'an established affluent central Toronto neighbourhood defined by tree-lined streets, boutique retail on Spadina Road, and proximity to Casa Loma and the ravine system',
  subwayStations: [
    { name: 'St. Clair West Station', line: 'Line 1 (Yonge-University)', context: 'at Bathurst and St. Clair with 512 St. Clair streetcar connections' },
    { name: 'St. Clair Station', line: 'Line 1', context: 'to the east on Yonge' },
  ],
  surfaceTransit: [
    'the 512 St. Clair streetcar running east and west across the top of the neighbourhood',
    'multiple Bathurst and Eglinton bus routes',
  ],
  futureTransit: 'The Line 5 Eglinton Crosstown LRT will add rapid east-west service one block north of the neighbourhood along Eglinton.',
  landmarks: [
    { name: 'Forest Hill Village along Spadina Road', context: 'a compact retail strip' },
    { name: 'the Beltline Trail and Cedarvale Ravine', context: 'a linear ravine and rail-trail park' },
    { name: 'Upper Canada College and Bishop Strachan School', context: 'two of Toronto\'s prominent private schools' },
    { name: 'Casa Loma', context: 'a short walk south' },
  ],
  employmentNodes: 'Downtown employment is a 15 minute Line 1 ride, and the Yonge and St. Clair office cluster is a short streetcar ride east.',
  employmentSummary: 'downtown Financial District via Line 1, midtown employment at Yonge and St. Clair and Yonge and Eglinton, and hospital and academic employment along University Avenue',
  residentProfile: 'Forest Hill serves an established affluent market of families in surrounding houses, downsizers, and long-term Toronto residents.',
  rentalDemandContext: 'Rental demand is limited relative to downtown but well-located buildings often retain long-term tenants.',
  supplyContext: 'New supply is limited within Forest Hill itself, though several projects are advancing along St. Clair West and Eglinton West on the neighbourhood\'s edges.',
};

NEIGHBOURHOODS['church-wellesley'] = {
  canonicalName: 'Church-Wellesley Village',
  subDistrict: 'the Church-Wellesley Village and adjacent Wellesley-Yonge district',
  positioning: 'the historic centre of Toronto\'s 2SLGBTQ+ community, a dense mixed residential and retail neighbourhood between Yonge and Jarvis',
  subwayStations: [
    { name: 'Wellesley Station', line: 'Line 1 (Yonge-University)', context: 'directly in the neighbourhood' },
    { name: 'College Station', line: 'Line 1', context: 'a short walk south' },
    { name: 'Bloor-Yonge Station', line: 'Line 1 and Line 2', context: 'a short walk north' },
  ],
  surfaceTransit: [
    'the 506 Carlton streetcar along the southern edge',
    'multiple Yonge Street bus and shuttle connections',
  ],
  futureTransit: 'No new subway construction is planned within the neighbourhood itself.',
  landmarks: [
    { name: 'the Church-Wellesley Village retail and hospitality strip', context: 'centred on Church between Wellesley and Alexander' },
    { name: 'Barbara Hall Park and the AIDS Memorial', context: 'at the heart of the community' },
    { name: 'Toronto Metropolitan University', context: 'a short walk south' },
    { name: 'Bloor-Yorkville', context: 'a short walk north' },
  ],
  employmentNodes: 'The Financial District, Toronto Metropolitan University and the hospitals along University Avenue are all within a 10 to 15 minute walk or subway ride.',
  employmentSummary: 'Financial District office employment, university employment at Toronto Metropolitan University, and hospital jobs along University Avenue',
  residentProfile: 'The neighbourhood serves a mix of long-term community members, young professionals, students and downtown investors.',
  rentalDemandContext: 'Rental demand is consistently strong given downtown employment, university proximity and community anchoring.',
  supplyContext: 'A number of high-rise projects are proposed along Church Street and adjacent blocks, which may add competing supply through the late 2020s.',
};

// ═══════════════════════════════════════════════════════════════════════════
// GTA cities beyond Toronto
// ═══════════════════════════════════════════════════════════════════════════

NEIGHBOURHOODS['mississauga'] = {
  canonicalName: 'Mississauga',
  subDistrict: 'the City Centre, Port Credit, Cooksville, Erin Mills and Lakeview areas',
  positioning: 'the sixth-largest city in Canada and the largest municipality in Peel Region, with a dense downtown around Square One and a network of waterfront and transit-oriented growth areas',
  subwayStations: [
    { name: 'Kipling Station', line: 'Line 2 (Bloor-Danforth)', context: 'the western TTC terminus, accessible from northeast Mississauga via MiWay' },
  ],
  surfaceTransit: [
    'MiWay Mississauga Transit routes across the city',
    'the Hurontario LRT (Line 10, currently under construction) running north-south from Port Credit to Steeles',
    'GO Transit Lakeshore West trains at Port Credit, Clarkson and Long Branch stations',
    'GO Milton line service at Cooksville, Erindale and Streetsville',
  ],
  futureTransit: 'The Hurontario LRT is expected to open in phases and will link Port Credit GO to the Brampton Gateway Terminal via Square One and Cooksville GO.',
  landmarks: [
    { name: 'Square One Shopping Centre', context: 'the largest shopping mall in Ontario, anchoring downtown Mississauga' },
    { name: 'the Living Arts Centre and Celebration Square', context: 'the civic and cultural heart of the City Centre' },
    { name: 'Port Credit and the Lake Ontario waterfront', context: 'a walkable waterfront neighbourhood served by GO Transit' },
    { name: 'Trillium Health Partners Mississauga Hospital', context: 'along Hurontario near the QEW' },
  ],
  employmentNodes: 'Mississauga is home to over 60 Fortune 500 head offices and Canadian HQs, plus Pearson International Airport at its northern edge.',
  employmentSummary: 'the Airport Corporate Centre and Pearson employment cluster, downtown Mississauga office towers around Square One, and downtown Toronto access via GO Transit',
  residentProfile: 'Mississauga serves a diverse mix of new-immigrant families, dual-income professionals, downsizers from surrounding houses and international students.',
  rentalDemandContext: 'Rental demand is supported by Pearson Airport employment, downtown Mississauga office jobs and GO Train access to downtown Toronto.',
  supplyContext: 'A significant volume of high-rise supply is proposed or under construction around Square One, along the Hurontario corridor and at Lakeview Village, which may compress lease-up pace at delivery.',
};

NEIGHBOURHOODS['vaughan'] = {
  canonicalName: 'Vaughan',
  subDistrict: 'the Vaughan Metropolitan Centre, Thornhill, Woodbridge, Maple and Kleinburg areas',
  positioning: 'a rapidly urbanising city north of Toronto, anchored by the Vaughan Metropolitan Centre (VMC) at the western terminus of Line 1',
  subwayStations: [
    { name: 'Vaughan Metropolitan Centre Station', line: 'Line 1 (Yonge-University)', context: 'the northern terminus of the extended subway' },
    { name: 'Highway 407 Station', line: 'Line 1', context: 'a park-and-ride station serving regional commuters' },
  ],
  surfaceTransit: [
    'York Region Transit and Viva BRT service across the city',
    'GO Transit Barrie line service at Rutherford and Maple stations',
  ],
  futureTransit: 'The Yonge North Subway Extension will extend Line 1 further north to Richmond Hill through Thornhill, adding a Steeles station in Vaughan.',
  landmarks: [
    { name: 'Vaughan Metropolitan Centre', context: 'the emerging downtown with office towers, retail and the KPMG Canadian headquarters' },
    { name: 'Vaughan Mills shopping centre', context: 'one of Ontario\'s largest outlet malls' },
    { name: 'Canada\'s Wonderland', context: 'a major theme park on Jane Street' },
    { name: 'Kortright Centre and the McMichael Canadian Art Collection', context: 'in Kleinburg to the northwest' },
  ],
  employmentNodes: 'Vaughan hosts KPMG Canada, PwC and other corporate tenants at VMC, plus a large industrial and logistics employment base across the city.',
  employmentSummary: 'the Vaughan Metropolitan Centre office cluster, Highway 407/400 industrial and logistics jobs, and downtown Toronto access via Line 1',
  residentProfile: 'Vaughan serves families, transit-oriented professionals working at VMC or downtown, and downsizers from surrounding low-rise neighbourhoods.',
  rentalDemandContext: 'Rental demand is supported by subway access to downtown Toronto, VMC office employment and York University\'s Keele campus a short bus ride south.',
  supplyContext: 'A significant volume of high-rise supply is under construction and proposed around VMC, which may create competing lease-up conditions.',
};

NEIGHBOURHOODS['markham'] = {
  canonicalName: 'Markham',
  subDistrict: 'the Downtown Markham, Unionville, Milliken and Cornell areas',
  positioning: 'one of Canada\'s fastest-growing municipalities, known for its technology employment corridor along Highway 404 and its heritage main street in Unionville',
  subwayStations: [
    { name: 'Finch Station', line: 'Line 1 (Yonge-University)', context: 'the closest TTC subway, reachable via YRT bus routes' },
  ],
  surfaceTransit: [
    'York Region Transit and Viva BRT service along Highway 7 and Highway 404',
    'GO Transit Stouffville line service at Unionville, Centennial, Markham and Mount Joy stations',
  ],
  futureTransit: 'The Yonge North Subway Extension will improve regional transit access from Markham via Richmond Hill.',
  landmarks: [
    { name: 'Downtown Markham', context: 'a new master-planned urban centre with offices, retail and residential' },
    { name: 'Unionville Historic Main Street', context: 'a 19th-century high street on Main Street Unionville' },
    { name: 'Markham Pan Am Centre', context: 'a public recreation facility with an aquatic centre' },
    { name: 'the Aaniin Community Centre and Cornell Community Park', context: 'anchoring east Markham' },
  ],
  employmentNodes: 'Markham hosts one of Canada\'s largest technology employment clusters, with IBM Canada, Motorola, Huawei and other tenants along the Highway 404 corridor.',
  employmentSummary: 'the Highway 404 technology corridor, Downtown Markham office towers, and downtown Toronto access via the Stouffville GO line',
  residentProfile: 'Markham serves a diverse mix of technology professionals, new-immigrant families and long-established residents from Unionville and Thornhill.',
  rentalDemandContext: 'Rental demand is supported by technology sector employment, GO train access and York University access to the west.',
  supplyContext: 'A large pipeline of high-rise supply is advancing at Downtown Markham and along Highway 7, which may create competing lease-up conditions.',
};

NEIGHBOURHOODS['oakville'] = {
  canonicalName: 'Oakville',
  subDistrict: 'the Uptown Core, Bronte, Kerr Village, downtown Oakville and Palermo Village areas',
  positioning: 'a well-established Halton Region community along Lake Ontario, characterised by a preserved downtown, waterfront parks and top-ranked school catchments',
  subwayStations: [],
  surfaceTransit: [
    'Oakville Transit bus routes across the city',
    'GO Transit Lakeshore West trains at Oakville and Bronte GO stations',
    'the future Dundas Bus Rapid Transit (BRT) corridor along Dundas Street',
  ],
  futureTransit: 'The Dundas BRT (Halton Region\'s share of the Metrolinx Dundas corridor project) will provide high-frequency east-west service across Oakville.',
  landmarks: [
    { name: 'downtown Oakville and Lakeside Park', context: 'a preserved 19th-century main street and waterfront' },
    { name: 'Bronte Harbour and Bronte Village', context: 'a smaller lakefront main street to the west' },
    { name: 'the Oakville Trafalgar Memorial Hospital', context: 'along Third Line' },
    { name: 'Sheridan College Trafalgar Road campus', context: 'in the Uptown Core' },
  ],
  employmentNodes: 'Oakville hosts Ford Canada\'s national headquarters, several major energy and consumer-goods head offices and an active professional-services employment base.',
  employmentSummary: 'Oakville\'s corporate head office cluster, downtown Toronto and Mississauga access via Lakeshore West GO, and healthcare employment at Oakville Trafalgar Hospital',
  residentProfile: 'Oakville serves an affluent family market, professionals commuting west along the QEW or east into Toronto by GO Train, and downsizers.',
  rentalDemandContext: 'Rental demand is moderate given the strong ownership market, but well-located transit-oriented buildings often retain long-term tenants.',
  supplyContext: 'New pre-construction supply is concentrated in the Uptown Core, along Dundas and in Bronte, with a growing but manageable pipeline.',
};

NEIGHBOURHOODS['hamilton'] = {
  canonicalName: 'Hamilton',
  subDistrict: 'the downtown, Corktown, Kirkendall, Westdale, Stoney Creek and Ancaster areas',
  positioning: 'Ontario\'s tenth-largest city, being reshaped by the LRT project along King Street, McMaster University\'s expansion and significant investment along the Hamilton waterfront',
  subwayStations: [],
  surfaceTransit: [
    'Hamilton Street Railway (HSR) bus routes across the city',
    'GO Transit Lakeshore West trains at Hamilton, West Harbour and Aldershot stations',
    'the future Hamilton LRT (Line 6 in the Metrolinx system) along King and Main streets',
  ],
  futureTransit: 'The Hamilton LRT is under construction and will run from McMaster University to Eastgate Square along King and Main.',
  landmarks: [
    { name: 'McMaster University', context: 'anchoring the Westdale neighbourhood' },
    { name: 'the Bayfront and Pier 8 waterfront development', context: 'redeveloping the harbour edge' },
    { name: 'Locke Street South and James Street North', context: 'walkable independent retail strips' },
    { name: 'the Royal Botanical Gardens', context: 'in Burlington immediately west' },
  ],
  employmentNodes: 'Hamilton hosts McMaster University and Hospital, ArcelorMittal Dofasco steelmaking, Stelco, and a growing professional-services and healthcare employment base.',
  employmentSummary: 'McMaster University and Hospital, healthcare employment across Hamilton\'s hospital network, and downtown Toronto access via Lakeshore West GO',
  residentProfile: 'Hamilton serves a mix of students, healthcare professionals, downtown-oriented young households and buyers priced out of Burlington and Oakville.',
  rentalDemandContext: 'Rental demand is anchored by McMaster University, Mohawk College, hospital employment and increasing Toronto-priced-out renters.',
  supplyContext: 'A meaningful pipeline of downtown and King Street condominium supply is advancing in tandem with the LRT programme.',
};

NEIGHBOURHOODS['pickering'] = {
  canonicalName: 'Pickering',
  subDistrict: 'the Pickering City Centre, Bay Ridges, Rosebank and Seaton communities',
  positioning: 'a Durham Region community on Lake Ontario, being densified around the Pickering GO station and the Pickering City Centre redevelopment',
  subwayStations: [],
  surfaceTransit: [
    'Durham Region Transit bus routes across the city',
    'GO Transit Lakeshore East trains at Pickering GO station',
  ],
  futureTransit: 'GO Expansion is increasing Lakeshore East train frequency, and the Durham-Scarborough BRT will provide high-frequency service west into Scarborough.',
  landmarks: [
    { name: 'Pickering Town Centre', context: 'a major regional shopping mall being redeveloped as a mixed-use centre' },
    { name: 'the Pickering waterfront trail and Frenchman\'s Bay', context: 'along Lake Ontario' },
    { name: 'the Pickering Casino Resort', context: 'a large entertainment and hotel complex' },
    { name: 'Seaton, the new master-planned community', context: 'expanding north Pickering' },
  ],
  employmentNodes: 'Pickering hosts OPG (Ontario Power Generation), the Pickering Nuclear Generating Station and a growing office and retail base at the City Centre.',
  employmentSummary: 'OPG and energy sector employment, downtown Toronto access via Lakeshore East GO, and the future Durham-Scarborough BRT',
  residentProfile: 'Pickering serves families, downsizers from surrounding houses, and Toronto-priced-out professionals with GO commutes.',
  rentalDemandContext: 'Rental demand is anchored by OPG employment, GO access to downtown Toronto and healthcare and retail jobs across Durham.',
  supplyContext: 'New supply is concentrated around Pickering City Centre and the GO station, with a growing but manageable pipeline.',
};

NEIGHBOURHOODS['burlington'] = {
  canonicalName: 'Burlington',
  subDistrict: 'the downtown, Aldershot, Alton and Mountainside areas',
  positioning: 'a Halton Region community on Lake Ontario, consistently ranked among Canada\'s best mid-sized cities, characterised by a preserved downtown and lakefront',
  subwayStations: [],
  surfaceTransit: [
    'Burlington Transit bus routes',
    'GO Transit Lakeshore West trains at Burlington, Aldershot and Appleby stations',
  ],
  futureTransit: 'The Dundas BRT will provide high-frequency east-west service linking Burlington to Oakville and Mississauga.',
  landmarks: [
    { name: 'downtown Burlington and Spencer Smith Park', context: 'a preserved main street on the waterfront' },
    { name: 'the Royal Botanical Gardens', context: 'straddling the Burlington-Hamilton border' },
    { name: 'the Burlington waterfront trail', context: 'along Lake Ontario' },
    { name: 'Joseph Brant Hospital', context: 'along the waterfront' },
  ],
  employmentNodes: 'Burlington hosts a diverse professional-services, manufacturing and healthcare employment base, plus corporate tenants along the QEW.',
  employmentSummary: 'downtown Burlington professional services, healthcare employment at Joseph Brant Hospital, and downtown Toronto and Hamilton access via GO Transit',
  residentProfile: 'Burlington serves an affluent family market, downsizers from surrounding houses and Toronto-priced-out households commuting by GO.',
  rentalDemandContext: 'Rental demand is moderate given the strong ownership market, though well-located transit-oriented buildings tend to lease well.',
  supplyContext: 'New pre-construction supply is concentrated in downtown Burlington and along GO station corridors.',
};

NEIGHBOURHOODS['brampton'] = {
  canonicalName: 'Brampton',
  subDistrict: 'the downtown, Mount Pleasant, Bramalea and Heart Lake communities',
  positioning: 'one of Canada\'s fastest-growing cities and the third-largest municipality in the GTA, characterised by a large young family population and expanding transit',
  subwayStations: [],
  surfaceTransit: [
    'Brampton Transit and Züm BRT routes across the city',
    'GO Transit Kitchener line service at Brampton, Mount Pleasant and Bramalea stations',
  ],
  futureTransit: 'The Hurontario LRT will terminate at Brampton Gateway Terminal, providing rapid transit south to Mississauga and Port Credit GO.',
  landmarks: [
    { name: 'downtown Brampton and Gage Park', context: 'a historic main street with a farmers\' market' },
    { name: 'Bramalea City Centre', context: 'a regional shopping mall' },
    { name: 'the Peel Memorial Centre and Brampton Civic Hospital', context: 'healthcare employment' },
    { name: 'Mount Pleasant Village and the Mount Pleasant GO station', context: 'a master-planned transit-oriented community' },
  ],
  employmentNodes: 'Brampton hosts Rogers Communications, Loblaw, Sun Life and Amazon distribution operations, plus a large logistics employment base along Highway 407 and 401.',
  employmentSummary: 'Brampton\'s logistics and distribution employment along the 400-series highways, downtown Toronto access via the Kitchener GO line, and Mississauga access via the future Hurontario LRT',
  residentProfile: 'Brampton serves a large young family and new-immigrant market, plus GO-commuting professionals working in Toronto and Mississauga.',
  rentalDemandContext: 'Rental demand is supported by rapid population growth, hospital and logistics employment, and GO Train access to Toronto.',
  supplyContext: 'New high-rise supply is concentrated in downtown Brampton, along the Hurontario corridor and around Mount Pleasant GO.',
};

NEIGHBOURHOODS['whitby'] = {
  canonicalName: 'Whitby',
  subDistrict: 'the downtown, Whitby Shores, Rossland and Brooklin communities',
  positioning: 'a Durham Region community on Lake Ontario, characterised by a preserved downtown, waterfront parks and strong school catchments',
  subwayStations: [],
  surfaceTransit: [
    'Durham Region Transit bus routes',
    'GO Transit Lakeshore East trains at Whitby GO station',
  ],
  futureTransit: 'GO Expansion is increasing Lakeshore East service frequency, and the Durham-Scarborough BRT will provide high-frequency east-west service.',
  landmarks: [
    { name: 'downtown Whitby and the Whitby Public Library', context: 'a preserved 19th-century main street' },
    { name: 'the Whitby waterfront trail and Iroquois Park', context: 'along Lake Ontario' },
    { name: 'Whitby Shores and the marina', context: 'along the waterfront' },
    { name: 'Lakeridge Health Whitby', context: 'the local hospital campus' },
  ],
  employmentNodes: 'Whitby hosts a mix of manufacturing, logistics and professional-services employment, plus Toronto-oriented commuters using GO.',
  employmentSummary: 'Whitby\'s manufacturing and logistics employment, downtown Toronto access via Lakeshore East GO, and Durham Region healthcare jobs',
  residentProfile: 'Whitby serves families, GO-commuting professionals and downsizers from surrounding low-rise neighbourhoods.',
  rentalDemandContext: 'Rental demand is supported by GO access, hospital employment and steady Durham Region growth.',
  supplyContext: 'New pre-construction supply is concentrated in downtown Whitby and around the GO station corridor.',
};

// ═══════════════════════════════════════════════════════════════════════════
// Additional GTA and exurb communities (primarily low-rise markets)
// ═══════════════════════════════════════════════════════════════════════════

const simpleHood = (name, region, opts = {}) => ({
  canonicalName: name,
  subDistrict: opts.subDistrict || `the ${name} area`,
  positioning: opts.positioning || `a ${region} community with a growing residential market`,
  subwayStations: [],
  surfaceTransit: opts.surfaceTransit || ['local municipal transit service'],
  futureTransit: opts.futureTransit || 'No major rapid transit projects are currently under construction in the immediate area.',
  landmarks: opts.landmarks || [
    { name: 'local schools and community centres', context: 'across the surrounding neighbourhood' },
    { name: 'regional parks and recreation trails', context: 'within a short drive' },
  ],
  employmentNodes: opts.employmentNodes || `Employment is a mix of local commercial services and commuting to the broader ${region} market.`,
  employmentSummary: opts.employmentSummary || `local commercial employment and commuting to the wider ${region} employment centres`,
  residentProfile: opts.residentProfile || 'The area attracts families and buyers seeking freehold ownership at a lower price point than central Toronto.',
  rentalDemandContext: opts.rentalDemandContext || `Rental demand is typically modest for freehold product in ${name}.`,
  supplyContext: opts.supplyContext || `New low-rise supply is being added through master-planned communities in and around ${name}.`,
});

NEIGHBOURHOODS['caledon'] = simpleHood('Caledon', 'Peel Region', {
  positioning: 'a large, primarily rural Peel Region municipality north of Brampton, known for its rolling countryside and small towns like Bolton and Caledon East',
  landmarks: [
    { name: 'the Caledon Trailway', context: 'a rail-trail linking Terra Cotta to Palgrave' },
    { name: 'the Cheltenham Badlands', context: 'a distinctive geological site' },
    { name: 'Downey\'s Farm and Albion Hills Conservation Area', context: 'family-oriented recreation' },
  ],
  employmentSummary: 'commuting to Brampton, Mississauga and Toronto, plus local commercial and agricultural employment',
});

NEIGHBOURHOODS['milton'] = simpleHood('Milton', 'Halton Region', {
  positioning: 'a fast-growing Halton Region community at the base of the Niagara Escarpment, one of the fastest-growing municipalities in Canada',
  surfaceTransit: ['Milton Transit local bus service', 'GO Transit Milton line trains at Milton GO station'],
  futureTransit: 'Metrolinx GO Expansion is planned to increase Milton line service frequency over time.',
  landmarks: [
    { name: 'the Kelso Conservation Area', context: 'with beach and hiking access at the Niagara Escarpment' },
    { name: 'the Milton Sports Centre and Mattamy National Cycling Centre', context: 'regional sport facilities' },
    { name: 'downtown Milton\'s historic Main Street', context: 'anchored by 19th-century commercial buildings' },
  ],
  employmentSummary: 'Milton\'s industrial and logistics employment along the 401, plus GO commuting to Toronto and Mississauga',
});

NEIGHBOURHOODS['aurora'] = simpleHood('Aurora', 'York Region', {
  positioning: 'an established York Region community north of Richmond Hill, with a heritage main street and access to the Barrie GO line',
  surfaceTransit: ['York Region Transit and Viva bus routes', 'GO Transit Barrie line trains at Aurora GO station'],
  landmarks: [
    { name: 'downtown Aurora\'s Yonge Street historic core', context: 'anchored by the Aurora Cultural Centre' },
    { name: 'Sheppard\'s Bush Conservation Area', context: 'for local trails' },
  ],
  employmentSummary: 'commuting to York Region employment centres and downtown Toronto via GO, plus local retail and professional services',
});

NEIGHBOURHOODS['whitchurch-stouffville'] = simpleHood('Whitchurch-Stouffville', 'York Region', {
  positioning: 'a York Region town north of Markham, with a preserved historic downtown and access to the Stouffville GO line',
  surfaceTransit: ['York Region Transit bus routes', 'GO Transit Stouffville line trains at Stouffville and Old Elm stations'],
  landmarks: [
    { name: 'downtown Stouffville\'s heritage main street', context: 'along Main Street' },
    { name: 'Musselman\'s Lake and the Vandorf Sideroad recreation area', context: 'a short drive north' },
  ],
  employmentSummary: 'commuting to Markham and Toronto via the Stouffville GO line, plus local commercial employment',
});

NEIGHBOURHOODS['king-city'] = simpleHood('King City', 'York Region', {
  positioning: 'a small York Region community within King Township, known for its estate lots, equestrian properties and access to the Barrie GO line',
  surfaceTransit: ['York Region Transit bus routes', 'GO Transit Barrie line trains at King City GO station'],
  landmarks: [
    { name: 'the Oak Ridges Moraine and the ravine system', context: 'directly surrounding the community' },
    { name: 'the King Township Museum', context: 'documenting local history' },
  ],
  employmentSummary: 'GO commuting to Toronto and Vaughan, plus estate-market local employment',
});

NEIGHBOURHOODS['east-gwillimbury'] = simpleHood('East Gwillimbury', 'York Region', {
  positioning: 'a growing York Region community north of Newmarket, with new master-planned communities along the Yonge corridor',
  surfaceTransit: ['York Region Transit bus routes', 'GO Transit Barrie line trains at East Gwillimbury GO station'],
  employmentSummary: 'commuting to Newmarket and Toronto via GO, plus local commercial and industrial employment',
});

NEIGHBOURHOODS['ajax'] = simpleHood('Ajax', 'Durham Region', {
  positioning: 'a Durham Region community on Lake Ontario between Pickering and Whitby, with a preserved lakefront and active downtown',
  surfaceTransit: ['Durham Region Transit bus routes', 'GO Transit Lakeshore East trains at Ajax GO station'],
  landmarks: [
    { name: 'the Ajax waterfront trail and Rotary Park', context: 'along Lake Ontario' },
    { name: 'Duffins Trail and Greenwood Conservation Area', context: 'for local recreation' },
  ],
  employmentSummary: 'commuting to Toronto via Lakeshore East GO, plus Ajax industrial and healthcare employment',
});

NEIGHBOURHOODS['oshawa'] = simpleHood('Oshawa', 'Durham Region', {
  positioning: 'the largest Durham Region city, historically anchored by General Motors and now home to Ontario Tech University and Trent University Durham',
  surfaceTransit: ['Durham Region Transit and Pulse BRT service', 'GO Transit Lakeshore East trains at Oshawa GO station'],
  landmarks: [
    { name: 'Ontario Tech University and Durham College campuses', context: 'anchoring north Oshawa' },
    { name: 'the Oshawa waterfront and Lakeview Park', context: 'along Lake Ontario' },
    { name: 'the Canadian Automotive Museum and Parkwood Estate', context: 'downtown Oshawa heritage sites' },
  ],
  employmentSummary: 'Ontario Tech and Durham College employment, healthcare at Lakeridge Health, and GO Transit access to Toronto',
});

NEIGHBOURHOODS['bowmanville'] = simpleHood('Bowmanville', 'Durham Region', {
  positioning: 'the largest urban area within the Municipality of Clarington in eastern Durham Region, with a preserved historic downtown along King Street',
  surfaceTransit: ['Durham Region Transit bus routes'],
  futureTransit: 'The GO Transit Lakeshore East extension will add a Bowmanville GO station, providing rail service to Toronto.',
  landmarks: [
    { name: 'downtown Bowmanville\'s King Street heritage strip', context: 'anchored by 19th-century commercial buildings' },
    { name: 'Canadian Tire Motorsport Park (Mosport)', context: 'a major motorsport venue nearby' },
  ],
  employmentSummary: 'commuting to Oshawa and the broader Durham market, plus local commercial and manufacturing employment',
});

NEIGHBOURHOODS['newcastle'] = simpleHood('Newcastle', 'Durham Region', {
  positioning: 'a village within the Municipality of Clarington east of Bowmanville, with a preserved historic downtown and access to Lake Ontario',
  employmentSummary: 'commuting west to Bowmanville, Oshawa and the broader Durham region for employment',
});

NEIGHBOURHOODS['kleinburg'] = simpleHood('Kleinburg', 'York Region', {
  positioning: 'a small heritage village within the City of Vaughan, known for the McMichael Canadian Art Collection and estate-style residential communities',
  landmarks: [
    { name: 'the McMichael Canadian Art Collection', context: 'a major public gallery' },
    { name: 'the Kortright Centre for Conservation', context: 'a nearby environmental education centre' },
    { name: 'the Kleinburg village heritage main street', context: 'anchored by boutique shops and restaurants' },
  ],
  employmentSummary: 'commuting to Vaughan and Toronto for employment, plus local commercial and hospitality jobs',
});

NEIGHBOURHOODS['bolton'] = simpleHood('Bolton', 'Peel Region', {
  positioning: 'a historic village within the Town of Caledon, north of Brampton along Highway 50 and the Humber River',
  landmarks: [
    { name: 'the Humber River trail system', context: 'running through the village' },
    { name: 'Bolton Camp and Palgrave Forest', context: 'for outdoor recreation' },
  ],
  employmentSummary: 'commuting to Brampton, Vaughan and Toronto for employment, plus local commercial services',
});

NEIGHBOURHOODS['georgina'] = simpleHood('Georgina', 'York Region', {
  positioning: 'a Lake Simcoe waterfront community at the northern edge of York Region, including the historic villages of Sutton and Keswick',
  landmarks: [
    { name: 'Lake Simcoe and the ROC (Recreational Outdoor Campus)', context: 'anchoring the waterfront' },
    { name: 'Sibbald Point Provincial Park', context: 'for camping and beach access' },
  ],
  employmentSummary: 'commuting south to Newmarket, Aurora and the broader GTA for employment',
});

NEIGHBOURHOODS['keswick'] = simpleHood('Keswick', 'York Region', {
  positioning: 'a community within the Town of Georgina on the west shore of Lake Simcoe, north of Newmarket via Highway 404',
  landmarks: [
    { name: 'Lake Simcoe waterfront parks', context: 'along Cook\'s Bay' },
    { name: 'the ROC (Recreational Outdoor Campus)', context: 'for four-season recreation' },
  ],
  employmentSummary: 'commuting to Newmarket, Aurora and the broader GTA for employment via Highway 404',
});

NEIGHBOURHOODS['nobleton'] = simpleHood('Nobleton', 'York Region', {
  positioning: 'a village within King Township north of Vaughan, characterised by estate lots and rural properties',
  employmentSummary: 'commuting to Vaughan, Aurora and Toronto for employment',
});

NEIGHBOURHOODS['georgetown'] = simpleHood('Georgetown', 'Halton Region', {
  positioning: 'a community within the Town of Halton Hills west of Brampton, with a preserved historic main street and access to GO Transit',
  surfaceTransit: ['Halton Hills Transit bus service', 'GO Transit Kitchener line trains at Georgetown GO station'],
  employmentSummary: 'commuting to Brampton, Mississauga and Toronto via the Kitchener GO line, plus local employment',
});

NEIGHBOURHOODS['ancaster'] = simpleHood('Ancaster', 'Hamilton area', {
  positioning: 'a community within the City of Hamilton on the Niagara Escarpment, with a preserved village core and premium residential streets',
  landmarks: [
    { name: 'downtown Ancaster village', context: 'anchored by 19th-century commercial buildings' },
    { name: 'the Dundas Valley Conservation Area', context: 'for hiking and nature' },
  ],
  employmentSummary: 'commuting to Hamilton, McMaster University and the broader Halton and Hamilton employment markets',
});

NEIGHBOURHOODS['stoney-creek'] = simpleHood('Stoney Creek', 'Hamilton area', {
  positioning: 'a community within the City of Hamilton along the Lake Ontario shoreline east of downtown Hamilton',
  landmarks: [
    { name: 'the Stoney Creek waterfront and Fifty Point Conservation Area', context: 'along Lake Ontario' },
    { name: 'Battlefield House Museum', context: 'a War of 1812 heritage site' },
  ],
  employmentSummary: 'commuting to Hamilton, Burlington and Oakville for employment',
});

NEIGHBOURHOODS['binbrook'] = simpleHood('Binbrook', 'Hamilton area', {
  positioning: 'a growing community within the City of Hamilton south of Stoney Creek, with new master-planned residential development',
  employmentSummary: 'commuting to Hamilton and the broader western GTA for employment',
});

NEIGHBOURHOODS['caledonia'] = simpleHood('Caledonia', 'Hamilton area', {
  positioning: 'a small community within Haldimand County south of Hamilton on the Grand River',
  employmentSummary: 'commuting to Hamilton and Brantford for employment',
});

NEIGHBOURHOODS['mount-hope'] = simpleHood('Mount Hope', 'Hamilton area', {
  positioning: 'a community within the City of Hamilton adjacent to John C. Munro Hamilton International Airport',
  employmentSummary: 'commuting to Hamilton and Hamilton Airport employment, plus local commercial jobs',
});

NEIGHBOURHOODS['bradford'] = simpleHood('Bradford', 'Outer GTA', {
  positioning: 'a community within Bradford West Gwillimbury in Simcoe County, north of East Gwillimbury via Highway 400',
  surfaceTransit: ['GO Transit Barrie line trains at Bradford GO station'],
  employmentSummary: 'commuting via GO Transit to Toronto and the broader York Region market',
});

NEIGHBOURHOODS['shelburne'] = simpleHood('Shelburne', 'Outer GTA', {
  positioning: 'a small town in Dufferin County northwest of Brampton',
  employmentSummary: 'commuting to Orangeville, Brampton and the broader GTA for employment',
});

NEIGHBOURHOODS['innisfil'] = simpleHood('Innisfil', 'Outer GTA', {
  positioning: 'a Lake Simcoe waterfront town in Simcoe County south of Barrie, with the Alcona and Cookstown communities',
  landmarks: [
    { name: 'Lake Simcoe waterfront and Innisfil Beach Park', context: 'along Cook\'s Bay' },
  ],
  employmentSummary: 'commuting to Barrie and the broader York and GTA markets for employment',
});

NEIGHBOURHOODS['blue-mountains'] = simpleHood('The Blue Mountains', 'Outer GTA', {
  positioning: 'a Georgian Bay four-season resort community northwest of Toronto, known for skiing at Blue Mountain Resort',
  landmarks: [
    { name: 'Blue Mountain Resort', context: 'a major ski resort' },
    { name: 'the Georgian Bay waterfront and Beaver Valley', context: 'for four-season recreation' },
  ],
  employmentSummary: 'primarily hospitality, tourism and construction employment, plus commuting to nearby Collingwood',
});

NEIGHBOURHOODS['wasaga-beach'] = simpleHood('Wasaga Beach', 'Outer GTA', {
  positioning: 'a Georgian Bay waterfront town in Simcoe County, home to the longest freshwater beach in the world',
  landmarks: [
    { name: 'the Wasaga Beach shoreline and Wasaga Beach Provincial Park', context: 'along Georgian Bay' },
  ],
  employmentSummary: 'primarily hospitality and tourism employment, plus commuting to Collingwood and Barrie',
});

NEIGHBOURHOODS['welland'] = simpleHood('Welland', 'Outer GTA', {
  positioning: 'a city in the Niagara Region along the Welland Canal, south of St. Catharines',
  employmentSummary: 'local commercial and industrial employment plus commuting to St. Catharines and Niagara Falls',
});

NEIGHBOURHOODS['brantford'] = simpleHood('Brantford', 'Outer GTA', {
  positioning: 'a city in southern Ontario west of Hamilton, along the Grand River',
  landmarks: [
    { name: 'the Grand River waterfront trail', context: 'through downtown' },
    { name: 'Wilfrid Laurier University\'s Brantford campus', context: 'in the downtown core' },
  ],
  employmentSummary: 'local manufacturing and healthcare employment plus commuting to Hamilton',
});

NEIGHBOURHOODS['kitchener'] = simpleHood('Kitchener', 'Outer GTA', {
  positioning: 'the largest city in the Waterloo Region, forming a tri-city area with Waterloo and Cambridge',
  surfaceTransit: ['Grand River Transit and the ION LRT', 'GO Transit Kitchener line trains at Kitchener GO station'],
  landmarks: [
    { name: 'downtown Kitchener\'s tech corridor', context: 'anchored by Google Canada, Communitech and other tech tenants' },
    { name: 'the University of Waterloo and Wilfrid Laurier University', context: 'in adjacent Waterloo' },
  ],
  employmentSummary: 'the Waterloo Region tech employment cluster, university employment and GO commuting to Toronto',
});

NEIGHBOURHOODS['niagara'] = simpleHood('Niagara Region', 'Outer GTA', {
  positioning: 'the wine country and international border region south of Hamilton, including St. Catharines, Niagara Falls and Niagara-on-the-Lake',
  landmarks: [
    { name: 'Niagara Falls', context: 'a major international tourism destination' },
    { name: 'Niagara-on-the-Lake\'s heritage main street and Shaw Festival', context: 'in the wine region' },
    { name: 'Brock University', context: 'in St. Catharines' },
  ],
  employmentSummary: 'hospitality, tourism, wine industry and manufacturing employment across the Niagara Region',
});

NEIGHBOURHOODS['uxbridge'] = simpleHood('Uxbridge', 'Durham Region', {
  positioning: 'a small town in northern Durham Region, characterised by preserved trails and equestrian properties',
  landmarks: [
    { name: 'the Uxbridge Trail Network', context: 'the town\'s designated Trail Capital of Canada network' },
  ],
  employmentSummary: 'commuting to Markham, Whitchurch-Stouffville and the broader GTA for employment',
});

export function getNeighbourhoodData(slug) {
  return NEIGHBOURHOODS[slug] || null;
}
