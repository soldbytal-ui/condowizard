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

export function getNeighbourhoodData(slug) {
  return NEIGHBOURHOODS[slug] || null;
}
