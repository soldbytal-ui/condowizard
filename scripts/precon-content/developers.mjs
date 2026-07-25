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
