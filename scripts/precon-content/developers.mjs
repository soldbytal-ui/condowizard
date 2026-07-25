/**
 * Per-developer bios. Only include verifiable, publicly known information.
 * Missing developers fall back to a conservative default bio.
 * Canadian spelling. No em dashes.
 */

export const DEVELOPERS = {
  'menkes-developments': {
    displayName: 'Menkes Developments',
    hq: 'Toronto',
    founded: 1954,
    focus: 'residential, commercial and mixed-use development across the Greater Toronto Area',
    knownFor: 'large-scale downtown projects including Harbour Plaza Residences, One York, 4 Season Place and 87 Peter Street',
    portfolioContext: 'Menkes has delivered mixed-use towers, master-planned communities and Class A office buildings for more than seven decades.',
    relevanceLine: 'The company\'s track record with high-density downtown projects is directly relevant here.',
  },

  'tridel': {
    displayName: 'Tridel',
    hq: 'Toronto',
    founded: 1934,
    focus: 'residential condominium development across the Greater Toronto Area',
    knownFor: 'one of the largest condominium portfolios in Canada, including Ten York, Aqualina at Bayside, Aqua and hundreds of completed communities',
    portfolioContext: 'The company has completed over 85,000 residences and remains one of the most established condominium builders in the country.',
    relevanceLine: 'Tridel\'s scale and finishing standards are a common reference point for buyers evaluating condominium quality in the GTA.',
  },

  'freed-developments': {
    displayName: 'Freed Developments',
    hq: 'Toronto',
    founded: 1996,
    focus: 'downtown Toronto boutique and hospitality-driven condominiums, primarily along King West and Adelaide',
    knownFor: 'Six50 King West, Fashion House, 75 Portland and Art Shoppe Lofts, alongside the Bisha Hotel and Residences',
    portfolioContext: 'Freed is closely associated with the transformation of the King West and Entertainment District corridors since the late 1990s.',
    relevanceLine: 'Its previous work on hospitality-branded downtown projects is directly relevant to the concept of Freed Hotel and Residences.',
  },

  'great-gulf': {
    displayName: 'Great Gulf',
    hq: 'Toronto',
    founded: 1975,
    focus: 'residential low-rise, high-rise condominium and master-planned community development in Canada and the United States',
    knownFor: 'Charlie, One Bloor East, Yonge + Rich and multiple low-rise communities across the GTA, alongside the design-forward Frank Gehry-designed Forma project',
    portfolioContext: 'Great Gulf has completed more than 80,000 homes across North America.',
    relevanceLine: 'The company has extensive experience delivering complex downtown high-rise projects with international architects.',
  },

  'madison-group': {
    displayName: 'Madison Group',
    hq: 'Toronto',
    founded: 1961,
    focus: 'commercial, residential and mixed-use real estate development across North America',
    knownFor: 'Nobu Residences Toronto (in partnership), Design Haus, 383 Sorauren and multiple luxury and boutique condominium projects',
    portfolioContext: 'The company operates as both a developer and a long-term real estate holder across Toronto, New York and other markets.',
    relevanceLine: 'Madison\'s portfolio includes several downtown high-rises with heritage integration.',
  },

  'emblem-developments': {
    displayName: 'Emblem Developments',
    hq: 'Toronto',
    founded: 2020,
    focus: 'high-rise pre-construction condominium development across the Greater Toronto Area',
    knownFor: 'Allure Condos, Perch Condos, Untitled Toronto and multiple projects in the Toronto core and 905 markets',
    portfolioContext: 'Emblem was founded by Kash Pashootan and has assembled an active pipeline of condominium projects in a short period.',
    relevanceLine: 'As a newer developer, buyers may wish to review the specifics of construction financing and delivery experience alongside the marketing materials.',
  },

  'reserve-properties': {
    displayName: 'Reserve Properties',
    hq: 'Toronto',
    founded: 1993,
    focus: 'condominium, mixed-use and retail development across the GTA',
    knownFor: 'The Bread Company, The Design District (Hamilton), Line 5 and 8 Elm on Yonge',
    portfolioContext: 'Reserve Properties has been active across residential, retail and mixed-use projects in the GTA and Hamilton for three decades.',
    relevanceLine: 'The company frequently partners with Capital Developments on major downtown projects.',
  },

  'devron-developments': {
    displayName: 'Devron Developments',
    hq: 'Toronto',
    founded: 2004,
    focus: 'boutique condominium and mixed-use development in Toronto',
    knownFor: 'Merton Yard, 1 Marlborough and other boutique-scale projects',
    portfolioContext: 'Devron focuses on lower-density and mid-rise projects with an emphasis on architectural design.',
    relevanceLine: 'The company tends to work on smaller-unit-count projects where interior layout and design detail carry more weight.',
  },

  'great-eagle-holdings': {
    displayName: 'Great Eagle Holdings',
    hq: 'Hong Kong, with Canadian operations through Langham Hospitality Group',
    founded: 1963,
    focus: 'hotel ownership and development, primarily through the Langham Hospitality Group brand',
    knownFor: 'the Langham hotel portfolio globally, and ownership of the Chelsea Hotel Toronto site being redeveloped as Chelsea Green',
    portfolioContext: 'Great Eagle is a publicly listed Hong Kong real estate and hospitality group.',
    relevanceLine: 'The proposed Chelsea Green redevelopment reflects Great Eagle\'s long-term ownership of the existing hotel site.',
  },

  'lifetime-developments': {
    displayName: 'Lifetime Developments',
    hq: 'Toronto',
    founded: 1980,
    focus: 'condominium, mixed-use and retail development in the GTA',
    knownFor: 'The Bond, Karma Condos, Chatham House and Massey Tower',
    portfolioContext: 'Lifetime has been an active downtown developer for more than four decades, often on complex heritage or infill sites.',
    relevanceLine: 'The company has repeated experience with tall towers and heritage integration in the downtown core.',
  },

  'parallax-development': {
    displayName: 'Parallax Development',
    hq: 'Toronto',
    founded: 2013,
    focus: 'mid-market and mixed-use condominium projects in the downtown Toronto core',
    knownFor: 'The Yorkdale Condos and Queen Central Condos',
    portfolioContext: 'Parallax frequently partners with capital groups such as Harlo Capital.',
    relevanceLine: 'The company\'s recent projects have focused on transit-accessible mid-market condominiums.',
  },

  'marlin-spring-developments': {
    displayName: 'Marlin Spring Developments',
    hq: 'Toronto',
    founded: 2013,
    focus: 'urban infill and master-planned residential development across Ontario and select U.S. markets',
    knownFor: 'The Palmer, The Manderley, Waterworks (in partnership), and multiple projects in Toronto and Kitchener-Waterloo',
    portfolioContext: 'Marlin Spring has assembled an active pipeline of low-rise and high-rise projects across North American markets in a relatively short period.',
    relevanceLine: 'The developer has repeated experience with mid-market condominium and townhome projects across the GTA.',
  },

  'republic-developments': {
    displayName: 'Republic Developments',
    hq: 'Toronto',
    founded: 2015,
    focus: 'transit-oriented and urban infill condominium development',
    knownFor: '45 The Esplanade, 8188 Yonge and other transit-accessible Toronto projects',
    portfolioContext: 'Republic operates as an active downtown and inner-suburban condominium developer with a focus on planning-approved sites near transit.',
    relevanceLine: 'The developer\'s track record centres on high-density projects adjacent to subway or GO stations.',
  },

  'tribute-communities': {
    displayName: 'Tribute Communities',
    hq: 'Pickering',
    founded: 1981,
    focus: 'condominium, low-rise and master-planned community development across the Greater Toronto Area',
    knownFor: 'Stanley Condos, 210 Bloor Street West, Sonic Condos and low-rise communities in Durham and York regions',
    portfolioContext: 'Tribute has completed more than 40,000 homes over four decades and is the naming sponsor of the Tribute Communities Centre in Oshawa.',
    relevanceLine: 'The company has extensive experience delivering both low-rise and high-rise product across the GTA.',
  },

  'first-capital': {
    displayName: 'First Capital',
    hq: 'Toronto',
    founded: 1994,
    focus: 'mixed-use urban retail-anchored real estate development, primarily grocery-anchored properties in dense neighbourhoods',
    knownFor: 'Yonge and Roselawn, One Bloor West retail podium, and mixed-use master-planned developments at Wilson Yards and elsewhere',
    portfolioContext: 'First Capital REIT owns a portfolio of urban retail properties, with residential intensification proposed on several sites.',
    relevanceLine: 'Its residential projects typically integrate grocery, retail and public realm improvements on well-located sites.',
  },

  'minto-communities': {
    displayName: 'Minto Communities',
    hq: 'Toronto and Ottawa',
    founded: 1955,
    focus: 'residential condominium, master-planned community and rental development across Canada',
    knownFor: 'The Yorkville Condos, Minto Longbranch, Minto Yorkville Park, and 30 Roe',
    portfolioContext: 'Minto operates as both a developer and a long-term owner of rental buildings, and has completed over 100,000 homes across Canada.',
    relevanceLine: 'The company\'s long-term ownership model tends to inform the finish specifications and building systems on its condominium projects.',
  },

  'slate-asset-management': {
    displayName: 'Slate Asset Management',
    hq: 'Toronto',
    founded: 2005,
    focus: 'real estate investment management, with an active development platform',
    knownFor: 'One Delisle, 100 Lombard Street and multiple institutional real estate portfolios',
    portfolioContext: 'Slate is a global alternative investment platform that has expanded into ground-up residential development in select Canadian markets.',
    relevanceLine: 'Slate has partnered with international architectural firms including OMA on Toronto residential proposals.',
  },

  'the-daniels-corporation': {
    displayName: 'The Daniels Corporation',
    hq: 'Toronto',
    founded: 1983,
    focus: 'condominium, mixed-income and master-planned community development',
    knownFor: 'the transformation of Regent Park in partnership with the City of Toronto, alongside DuEast, Wyatt and Artworks Tower',
    portfolioContext: 'Daniels has completed more than 35,000 homes and is closely associated with the multi-decade rebuild of Regent Park.',
    relevanceLine: 'The company has extensive experience with large mixed-income master plans that include community and cultural facilities.',
  },

  'metropia': {
    displayName: 'Metropia',
    hq: 'Toronto',
    founded: 2005,
    focus: 'urban infill condominium, master-planned community and rental development',
    knownFor: 'The Hill Residences, 3018 Yonge (in partnership) and multiple communities across the GTA',
    portfolioContext: 'Metropia has completed and delivered high-rise and low-rise product across Ontario.',
    relevanceLine: 'The company frequently partners with established capital groups on downtown Toronto projects.',
  },

  'aspen-ridge-homes': {
    displayName: 'Aspen Ridge Homes',
    hq: 'Toronto',
    founded: 1993,
    focus: 'residential condominium, low-rise and master-planned community development',
    knownFor: 'the Crosstown community, Studio 2 Condos and multiple GTA low-rise communities',
    portfolioContext: 'Aspen Ridge has completed thousands of homes across the GTA over three decades and is the lead developer of the 60-acre Crosstown master plan at Don Mills and Eglinton.',
    relevanceLine: 'The company has direct experience with the Crosstown master-planned community and low-rise development in the surrounding areas.',
  },

  'almadev': {
    displayName: 'Almadev',
    hq: 'Toronto',
    founded: 2001,
    focus: 'commercial, industrial and residential development across Canada, the U.S. and Europe',
    knownFor: 'LSQ Condos and the Lansing Square master-plan, alongside a large commercial portfolio',
    portfolioContext: 'Almadev is a diversified real estate and private equity platform with active operations in multiple markets.',
    relevanceLine: 'The Lansing Square redevelopment is one of the larger master-plans in Toronto\'s Don Mills and Sheppard area.',
  },

  'concord-adex': {
    displayName: 'Concord Adex',
    hq: 'Toronto',
    founded: 1997,
    focus: 'master-planned high-rise residential communities in the downtown Toronto core',
    knownFor: 'CityPlace, the largest master-planned residential community in Toronto, alongside The PJ Condos, Concord Canada House and multiple towers at Concord Park Place',
    portfolioContext: 'Concord Adex is part of Concord Pacific and has been a dominant force in Toronto master-planned condominium development for over 25 years.',
    relevanceLine: 'The developer has extensive experience with complex urban master plans and delivering large-scale residential inventory.',
  },

  'camrost-felcorp': {
    displayName: 'Camrost Felcorp',
    hq: 'Toronto',
    founded: 1976,
    focus: 'luxury condominium and mixed-use development, primarily in central Toronto',
    knownFor: 'Yorkville Private Estates, Cumberland Tower, Imperial Plaza and the Imperial Village master plan',
    portfolioContext: 'Camrost Felcorp has been active in Yorkville, Deer Park and the central Toronto luxury market for nearly five decades.',
    relevanceLine: 'The company has repeated experience delivering upper-tier condominiums in the central Toronto luxury market.',
  },

  'tridel': {
    displayName: 'Tridel',
    hq: 'Toronto',
    founded: 1934,
    focus: 'residential condominium development across the Greater Toronto Area',
    knownFor: 'one of the largest condominium portfolios in Canada, including Ten York, Aqualina at Bayside, Aqua and hundreds of completed communities',
    portfolioContext: 'The company has completed over 85,000 residences and remains one of the most established condominium builders in the country.',
    relevanceLine: 'Tridel\'s scale and finishing standards are a common reference point for buyers evaluating condominium quality in the GTA.',
  },

  'centrecourt': {
    displayName: 'CentreCourt',
    hq: 'Toronto',
    founded: 2010,
    focus: 'high-rise condominium development in downtown Toronto and select transit-oriented GTA sites',
    knownFor: 'Prime Condos, 55C Bloor Yorkville Residences, 199 Church, and multiple downtown towers',
    portfolioContext: 'CentreCourt operates a vertically integrated model that combines development, construction and sales in-house.',
    relevanceLine: 'The company has one of the higher-velocity development pipelines in downtown Toronto over the past decade.',
  },

  'graywood-developments': {
    displayName: 'Graywood Developments',
    hq: 'Toronto',
    founded: 1985,
    focus: 'urban condominium, mixed-use and master-planned community development',
    knownFor: 'Scout Condos, Ivylea, The Bond, JAC Condos and Maison Wellesley',
    portfolioContext: 'Graywood has completed 32 residential communities in Toronto and Chicago over nearly four decades.',
    relevanceLine: 'The developer has consistent experience in both the mid-market and boutique segments of the Toronto condominium market.',
  },

  'pinnacle-international': {
    displayName: 'Pinnacle International',
    hq: 'Vancouver, with a Toronto office',
    founded: 1979,
    focus: 'high-rise mixed-use master-planned communities on the waterfront and downtown',
    knownFor: 'Pinnacle Toronto East, Pinnacle Grand Park (Mississauga), 5 St. Joseph and the Pinnacle Etobicoke portfolio',
    portfolioContext: 'Pinnacle has developed more than 20 towers in Toronto and Vancouver, including its own East Bayfront waterfront master plan.',
    relevanceLine: 'The company operates one of the more established Toronto waterfront development portfolios.',
  },

  'cityzen-development-group': {
    displayName: 'Cityzen Development Group',
    hq: 'Toronto',
    founded: 1996,
    focus: 'boutique and mid-scale luxury condominium development in central Toronto',
    knownFor: 'L Tower, Absolute World Towers (Mississauga, in partnership) and the redevelopment of the Cumberland Square site (in partnership)',
    portfolioContext: 'Cityzen frequently partners with Sam Mizrahi and other developers on landmark Toronto projects.',
    relevanceLine: 'The company has direct experience with landmark, architecturally distinct downtown towers.',
  },

  'dream-unlimited': {
    displayName: 'Dream Unlimited',
    hq: 'Toronto',
    founded: 1994,
    focus: 'diversified residential, commercial, retail and master-planned community development across Canada',
    knownFor: 'Zibi (Ottawa-Gatineau), Canary District (in partnership), Distillery District residential expansion and West Don Lands infrastructure',
    portfolioContext: 'Dream is a publicly listed real estate group with active development, asset management and REIT platforms.',
    relevanceLine: 'The company has extensive experience with large master-planned urban districts and public-private partnerships.',
  },

  'fieldgate-urban': {
    displayName: 'Fieldgate Urban',
    hq: 'Toronto',
    founded: 1958,
    focus: 'urban condominium development, part of the broader Fieldgate Group',
    knownFor: '572 Church Street Condos, Beacon Condos and Fashion District Lofts',
    portfolioContext: 'Fieldgate is one of the longer-established residential developers in the GTA, with active low-rise and urban condominium arms.',
    relevanceLine: 'The company\'s parent group has completed thousands of low-rise homes across Ontario.',
  },

  'canderel': {
    displayName: 'Canderel',
    hq: 'Montreal, with a Toronto office',
    founded: 1975,
    focus: 'commercial, office and residential development across Canada',
    knownFor: 'Aura at College Park (Canada\'s tallest residential tower on completion), YSL Residences and multiple Montreal and Toronto office buildings',
    portfolioContext: 'Canderel is one of Canada\'s largest privately owned real estate development companies.',
    relevanceLine: 'The company has repeated experience delivering large-scale mixed-use towers in downtown Toronto.',
  },

  'burnac-corporation': {
    displayName: 'Burnac Corporation',
    hq: 'Toronto',
    founded: 1963,
    focus: 'commercial, agricultural and select residential real estate development',
    knownFor: 'The Bedford Yorkville and multiple long-held commercial properties in central Toronto',
    portfolioContext: 'Burnac is a family-owned real estate group with a portfolio spanning multiple asset classes.',
    relevanceLine: 'The company\'s residential projects have focused on well-located central Toronto sites.',
  },

  'choice-properties-reit': {
    displayName: 'Choice Properties REIT',
    hq: 'Toronto',
    founded: 2013,
    focus: 'grocery-anchored retail, industrial and mixed-use residential development',
    knownFor: 'the mixed-use redevelopment of Loblaws-anchored sites across the GTA',
    portfolioContext: 'Choice is one of Canada\'s largest publicly listed REITs and holds an extensive land bank across Loblaws-anchored properties.',
    relevanceLine: 'Its residential projects are typically integrated with grocery retail and long-term rental components.',
  },

  'chestnut-hill-developments': {
    displayName: 'Chestnut Hill Developments',
    hq: 'Toronto',
    founded: 1981,
    focus: 'low-rise, mid-rise and high-rise residential development across the GTA',
    knownFor: 'Zen King West, The Livmore and multiple GTA condominium communities',
    portfolioContext: 'Chestnut Hill has completed over 6,000 homes across the GTA in more than four decades of operation.',
    relevanceLine: 'The company has repeated experience with mid-market and upper-mid-market condominiums.',
  },

  'cadillac-fairview': {
    displayName: 'Cadillac Fairview',
    hq: 'Toronto',
    founded: 1953,
    focus: 'office, retail and mixed-use real estate development on behalf of the Ontario Teachers\' Pension Plan',
    knownFor: 'Toronto-Dominion Centre, CF Toronto Eaton Centre, CF Sherway Gardens and multiple flagship Canadian office and shopping properties',
    portfolioContext: 'Cadillac Fairview is one of North America\'s largest institutional real estate owners and developers.',
    relevanceLine: 'Its residential projects tend to be integrated into existing mixed-use master-plans with institutional-grade design and construction standards.',
  },


  // Generic fallback used if no entry above matches
  '__default__': {
    displayName: null,
    hq: 'the Greater Toronto Area',
    focus: 'residential condominium development',
    knownFor: null,
    portfolioContext: 'Publicly verified information on the company\'s completed portfolio is limited.',
    relevanceLine: 'Buyers may wish to request a list of completed projects and reference contacts from the developer directly.',
  },
};

export function getDeveloperData(slug, fallbackName) {
  const d = DEVELOPERS[slug];
  if (d) return d;
  return { ...DEVELOPERS['__default__'], displayName: fallbackName };
}
