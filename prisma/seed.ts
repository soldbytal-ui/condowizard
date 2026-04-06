import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr === '--' || priceStr === 'TBD' || priceStr === 'N/A') return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (priceStr.toLowerCase().includes('m') && num < 1000) return Math.round(num * 1_000_000);
  if (priceStr.toLowerCase().includes('k') && num < 100_000) return Math.round(num * 1000);
  return Math.round(num);
}

function parseStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s.includes('pre-launch') || s.includes('pre launch')) return 'PRE_LAUNCH';
  if (s.includes('near completion') || s.includes('nearly complete')) return 'NEAR_COMPLETION';
  if (s.includes('under construction')) return 'UNDER_CONSTRUCTION';
  if (s.includes('completed') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

function parseCategory(cat: string): string {
  const c = cat.toLowerCase().trim();
  if (c.includes('ultra')) return 'ULTRA_LUXURY';
  if (c.includes('branded')) return 'LUXURY_BRANDED';
  if (c.includes('affordable')) return 'AFFORDABLE_LUXURY';
  if (c.includes('premium')) return 'PREMIUM';
  if (c.includes('luxury')) return 'LUXURY';
  return 'PREMIUM';
}

function parseInt2(s: string): number | null {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

// --- Toronto & GTA Neighborhoods ---
const NEIGHBORHOODS = [
  { name: 'Downtown Core', slug: 'downtown-core', region: 'Toronto', displayOrder: 1, avgPriceStudio: 550000, avgPrice1br: 700000, avgPrice2br: 1100000, avgPrice3br: 1800000, avgPricePenthouse: 5000000, description: 'Toronto\'s financial and cultural heart, the Downtown Core encompasses the Financial District, the Entertainment District, and the St. Lawrence neighbourhood. Home to the CN Tower, Rogers Centre, Union Station, and the PATH — the world\'s largest underground shopping network — this area is the epicentre of urban living in Canada.\n\nPre-construction development here is dominated by supertall towers and mixed-use complexes, with developers like Pinnacle, Concord, and Menkes leading major projects. The area benefits from exceptional transit connectivity via Union Station (TTC subway, GO Transit, UP Express), making it a magnet for young professionals and investors.\n\nWith Toronto\'s growing tech sector attracting companies to the downtown core, demand for modern condos continues to outpace supply, making this one of the strongest appreciation markets in the GTA.' },
  { name: 'King West', slug: 'king-west', region: 'Toronto', displayOrder: 2, avgPriceStudio: 600000, avgPrice1br: 750000, avgPrice2br: 1200000, avgPrice3br: 2000000, avgPricePenthouse: 4000000, description: 'King West is one of Toronto\'s most desirable neighbourhoods, known for its vibrant restaurant scene, trendy bars, boutique hotels, and converted heritage buildings. Running along King Street West from University Avenue to Dufferin, this strip is the social heartbeat of the city.\n\nThe neighbourhood has seen an explosion of sleek condo towers by developers like CentreCourt, Plaza, and Great Gulf. The King Street Transit Priority corridor provides excellent streetcar service, and the area is steps from both St. Andrew and King TTC subway stations.\n\nKing West attracts young professionals, creatives, and investors drawn to its walkability, nightlife, and proximity to the Financial District. The neighbourhood\'s blend of heritage architecture and modern towers gives it a character unmatched anywhere else in Toronto.' },
  { name: 'Liberty Village', slug: 'liberty-village', region: 'Toronto', displayOrder: 3, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 950000, avgPrice3br: 1400000, description: 'Liberty Village is a dynamic, self-contained community built on the grounds of former industrial lands south of King Street West. The neighbourhood is known for its converted loft spaces, creative agencies, tech startups, and a thriving local restaurant and bar scene.\n\nPre-construction projects here offer excellent value compared to neighbouring King West and CityPlace, with developers like Lifetime and Mattamy delivering modern towers with resort-style amenities. The Exhibition GO station provides regional transit access, and the 504 King streetcar connects to the downtown core.\n\nLiberty Village\'s tight-knit community feel, dog-friendly parks, and walkable retail make it particularly popular with young professionals and first-time buyers looking for an urban lifestyle at a more accessible price point.' },
  { name: 'Queen West', slug: 'queen-west', region: 'Toronto', displayOrder: 4, avgPriceStudio: 550000, avgPrice1br: 700000, avgPrice2br: 1050000, avgPrice3br: 1600000, description: 'Queen West, once dubbed "the second coolest neighbourhood in the world" by Vogue, stretches from University Avenue to Roncesvalles. It\'s a corridor of independent boutiques, galleries, vintage shops, and some of Toronto\'s best restaurants and bars.\n\nThe neighbourhood encompasses distinct micro-areas: the gallery-heavy stretch near OCAD University, the fashion-forward West Queen West, and the increasingly hip Parkdale. Pre-construction here tends toward mid-rise and boutique developments that respect the neighbourhood\'s low-rise heritage character.\n\nWith Osgoode and St. Patrick TTC stations nearby and excellent streetcar service on Queen, the area offers strong transit connectivity. Queen West appeals to creatives, design professionals, and anyone seeking an authentic urban neighbourhood with genuine character.' },
  { name: 'Yorkville', slug: 'yorkville', region: 'Toronto', displayOrder: 5, avgPriceStudio: 800000, avgPrice1br: 1200000, avgPrice2br: 2500000, avgPrice3br: 4000000, avgPricePenthouse: 8000000, description: 'Yorkville is Toronto\'s most prestigious address, synonymous with luxury shopping, five-star hotels, and some of the most expensive real estate in Canada. Bloor Street\'s "Mink Mile" is home to Chanel, Louis Vuitton, Tiffany, and Holt Renfrew, while the neighbourhood\'s Victorian lanes house upscale galleries and restaurants.\n\nPre-construction in Yorkville commands ultra-premium pricing, with developers like Camrost Felcorp, Great Gulf, and Canderel delivering branded and bespoke luxury residences. The Royal Ontario Museum, Gardiner Museum, and University of Toronto campus add cultural cachet.\n\nWith Bloor-Yonge and Bay TTC subway stations providing direct access to both the Yonge-University and Bloor-Danforth lines, Yorkville offers connectivity matched by no other luxury neighbourhood. The area attracts high-net-worth buyers, international investors, and empty-nesters downsizing from Rosedale and Forest Hill.' },
  { name: 'The Annex', slug: 'the-annex', region: 'Toronto', displayOrder: 6, avgPriceStudio: 550000, avgPrice1br: 700000, avgPrice2br: 1000000, avgPrice3br: 1500000, description: 'The Annex is one of Toronto\'s most beloved neighbourhoods, known for its tree-lined streets, Victorian and Edwardian homes, Bloor Street cafes, and intellectual atmosphere fostered by the University of Toronto. Honest Ed\'s may be gone, but the neighbourhood retains its eclectic, bookish charm.\n\nPre-construction development in The Annex is limited by heritage protections, making new projects particularly desirable. The Bathurst and Spadina TTC stations provide subway access, while Bloor Street offers excellent streetcar and bus connectivity.\n\nThe Annex attracts university professors, professionals, and anyone who values walkability, independent retail, and proximity to both the U of T campus and Yorkville. It\'s one of the few Toronto neighbourhoods where you can walk to world-class dining, a major research university, and a subway station within minutes.' },
  { name: 'Midtown', slug: 'midtown', region: 'Toronto', displayOrder: 7, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 1000000, avgPrice3br: 1600000, description: 'Midtown Toronto encompasses the upscale residential areas around Yonge and St. Clair, Davisville, and the Summerhill neighbourhood. Known for its mature tree canopy, boutique shopping on Yonge Street, and family-friendly atmosphere, Midtown offers a quieter alternative to downtown living.\n\nThe area is experiencing significant pre-construction activity, particularly around the St. Clair and Davisville TTC stations. Developers are drawn by the neighbourhood\'s strong demographics and excellent schools, including some of Toronto\'s most sought-after public and private institutions.\n\nWith the Yonge subway line providing direct access to downtown in minutes, Midtown offers the rare combination of urban convenience and residential tranquility. Summerhill\'s LCBO flagship, the Belt Line Trail, and David Balfour Park add to the neighbourhood\'s appeal.' },
  { name: 'Yonge & Eglinton', slug: 'yonge-eglinton', region: 'Toronto', displayOrder: 8, avgPriceStudio: 480000, avgPrice1br: 620000, avgPrice2br: 950000, avgPrice3br: 1400000, description: 'Yonge and Eglinton — known locally as "Young and Eligible" for its concentration of young professionals — is one of Toronto\'s most vibrant midtown intersections. The area features a mix of boutique shops, restaurants, and entertainment options along Yonge Street and Eglinton Avenue.\n\nThe neighbourhood is being transformed by the Eglinton Crosstown LRT, a 19-kilometre rapid transit line that will dramatically improve east-west connectivity. This has spurred a wave of pre-construction development, with major towers by Menkes, RioCan, and Minto reshaping the skyline.\n\nThe Eglinton TTC station on the Yonge line provides quick access to both downtown and North York, while the upcoming Crosstown LRT will connect to the Scarborough and west-end communities. The neighbourhood\'s excellent walkability, dining scene, and transit make it a top choice for young professionals.' },
  { name: 'North York', slug: 'north-york', region: 'Toronto', displayOrder: 9, avgPriceStudio: 420000, avgPrice1br: 550000, avgPrice2br: 800000, avgPrice3br: 1200000, avgPricePenthouse: 2500000, description: 'North York Centre, along Yonge Street between Sheppard and Finch, has evolved into Toronto\'s second downtown — a dense urban centre with its own skyline of condo towers, office buildings, and cultural institutions. The area offers excellent value compared to the downtown core.\n\nMajor pre-construction projects by Menkes, Tridel, and Pinnacle line the Yonge corridor, drawn by the strong transit infrastructure including three subway stations (Sheppard-Yonge, North York Centre, Finch). The Mel Lastman Square, Toronto Centre for the Arts, and North York Central Library serve as community anchors.\n\nNorth York appeals to families, new Canadians, and investors seeking lower entry prices with strong rental demand. The neighbourhood\'s proximity to Highway 401, diverse dining options, and rapidly improving streetscape make it one of the GTA\'s strongest appreciation stories.' },
  { name: 'Scarborough', slug: 'scarborough', region: 'Toronto', displayOrder: 10, avgPriceStudio: 380000, avgPrice1br: 480000, avgPrice2br: 700000, avgPrice3br: 1000000, description: 'Scarborough is Toronto\'s eastern borough, offering some of the most affordable pre-construction opportunities in the city. The area is anchored by the Scarborough Town Centre, the Scarborough Bluffs — a stunning geological formation along Lake Ontario — and a diverse, multicultural community.\n\nThe planned Scarborough Subway Extension will bring higher-order transit to the area, spurring significant pre-construction activity around the future Scarborough Centre station. Developers are positioning projects to capitalize on the improved connectivity.\n\nScarborough\'s affordability, diversity of housing types (including townhomes and stacked towns alongside condos), and natural beauty make it an increasingly attractive option for first-time buyers and families priced out of the downtown market.' },
  { name: 'Etobicoke', slug: 'etobicoke', region: 'Toronto', displayOrder: 11, avgPriceStudio: 400000, avgPrice1br: 520000, avgPrice2br: 780000, avgPrice3br: 1100000, description: 'Etobicoke, Toronto\'s western borough, offers a suburban feel with urban amenities. The area encompasses distinct communities from the lakefront Humber Bay Shores — one of the GTA\'s densest condo clusters — to the family-oriented neighbourhoods of central Etobicoke.\n\nHumber Bay Shores has seen massive pre-construction development, with waterfront towers offering stunning lake and city views at prices below comparable downtown units. Further west, the Kipling and Islington TTC stations anchor emerging development nodes.\n\nWith proximity to Pearson International Airport, access to the Gardiner Expressway and QEW, and improving transit connections, Etobicoke appeals to commuters, airport workers, and families seeking more space without leaving the city.' },
  { name: 'Leaside', slug: 'leaside', region: 'Toronto', displayOrder: 12, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 1000000, avgPrice3br: 1500000, description: 'Leaside is one of Toronto\'s most established and desirable family neighbourhoods, known for its tree-lined streets, top-rated schools, and village-like Bayview Avenue shopping strip. The area maintains a strong sense of community with local boutiques, cafes, and a weekly farmers\' market.\n\nPre-construction in Leaside tends toward boutique mid-rise projects that complement the neighbourhood\'s low-rise character. The Bayview and Leaside TTC stations on the upcoming Ontario Line will dramatically improve transit access to the downtown core.\n\nLeaside attracts families, professionals, and downsizers from the surrounding single-family home neighbourhoods. Its combination of excellent schools, safe streets, and community feel — all within easy reach of downtown — makes it one of Toronto\'s most enduring premium neighbourhoods.' },
  { name: 'Leslieville', slug: 'leslieville', region: 'Toronto', displayOrder: 13, avgPriceStudio: 480000, avgPrice1br: 620000, avgPrice2br: 900000, avgPrice3br: 1300000, description: 'Leslieville, along Queen Street East, has blossomed from a working-class neighbourhood into one of Toronto\'s most sought-after communities. Independent coffee shops, craft breweries, farm-to-table restaurants, and vintage shops line the main strip, giving it an authentic neighbourhood feel.\n\nPre-construction projects here range from boutique low-rises to mid-rise towers, appealing to buyers who want character and walkability. The 501 Queen streetcar provides east-west connectivity, and the upcoming Ontario Line will add rapid transit access at nearby stations.\n\nLeslieville attracts young families, foodies, and creative professionals drawn by its village atmosphere, proximity to the Beaches, and relative affordability compared to the downtown core. The neighbourhood\'s continued gentrification makes it a strong investment play.' },
  { name: 'Riverside', slug: 'riverside', region: 'Toronto', displayOrder: 14, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 950000, avgPrice3br: 1400000, description: 'Riverside is a compact, vibrant neighbourhood east of the Don Valley, centred around Queen Street East and Broadview Avenue. The area is home to some of Toronto\'s best restaurants, the beloved Broadview Hotel, and quick access to the Don Valley trails.\n\nThe neighbourhood is experiencing a renaissance driven by the coming Ontario Line stations, which will provide rapid transit access to downtown and beyond. Developers are snapping up sites along Queen and Dundas for mid-rise condo projects.\n\nRiverside appeals to urbanites who want walkability, great food, and a genuine neighbourhood feel without the price premium of King West or Yorkville. The Riverdale Park views of the Toronto skyline are among the best in the city.' },
  { name: 'Danforth', slug: 'danforth', region: 'Toronto', displayOrder: 15, avgPriceStudio: 450000, avgPrice1br: 580000, avgPrice2br: 850000, avgPrice3br: 1200000, description: 'The Danforth — officially Danforth Avenue — is Toronto\'s vibrant Greektown corridor, famous for its restaurants, the annual Taste of the Danforth festival, and its family-friendly atmosphere. The neighbourhood extends along the Bloor-Danforth subway line with excellent stations at Broadview, Chester, Pape, and Donlands.\n\nPre-construction activity is growing along the Danforth as developers recognize the area\'s untapped potential and strong transit infrastructure. Projects tend toward mid-rise buildings that respect the neighbourhood\'s main-street character.\n\nThe Danforth attracts families, foodies, and buyers seeking excellent subway access at prices well below the downtown core. The neighbourhood\'s diverse dining scene, Withrow Park farmers\' market, and easy access to the Don Valley trails make it one of the east end\'s strongest communities.' },
  { name: 'High Park', slug: 'high-park', region: 'Toronto', displayOrder: 16, avgPriceStudio: 480000, avgPrice1br: 630000, avgPrice2br: 950000, avgPrice3br: 1400000, description: 'High Park is Toronto\'s premier park-adjacent neighbourhood, offering residents direct access to the 400-acre High Park with its hiking trails, zoo, outdoor pools, and spring cherry blossoms. The neighbourhood combines nature with excellent urban amenities along Bloor Street West and Roncy.\n\nPre-construction development is concentrated along Bloor Street near the High Park and Keele TTC subway stations. Projects here attract buyers who prioritize green space and outdoor recreation alongside urban convenience.\n\nHigh Park appeals to families, dog owners, and nature lovers who want the best of both worlds — subway access to downtown in 15 minutes and a 400-acre forest at their doorstep. The neighbourhood\'s strong schools and community feel make it a perennial favourite.' },
  { name: 'Junction', slug: 'junction', region: 'Toronto', displayOrder: 17, avgPriceStudio: 450000, avgPrice1br: 580000, avgPrice2br: 870000, avgPrice3br: 1250000, description: 'The Junction, centred on Dundas Street West at Keele, is one of Toronto\'s fastest-rising neighbourhoods. Once a dry neighbourhood (alcohol sales were banned until 1998), it has exploded with craft breweries, wine bars, independent restaurants, and boutique shops.\n\nPre-construction development is bringing mid-rise condos and mixed-use projects to the Junction, drawn by the neighbourhood\'s authentic character and growing cachet. The UP Express Bloor station and Dundas West/Keele TTC stations provide transit connectivity.\n\nThe Junction appeals to young professionals, creatives, and families who appreciate its gritty-turned-cool aesthetic, independent retail scene, and strong community spirit. Its relatively affordable prices and rapid gentrification make it a compelling investment opportunity.' },
  { name: 'Roncesvalles', slug: 'roncesvalles', region: 'Toronto', displayOrder: 18, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 980000, avgPrice3br: 1400000, description: 'Roncesvalles — "Roncy" to locals — is a charming, walkable neighbourhood with a strong Polish heritage, independent shops, and some of Toronto\'s best bakeries and cafes. The 504 King streetcar runs the length of Roncesvalles Avenue, connecting to King West and the downtown core.\n\nPre-construction opportunities here are rare due to the neighbourhood\'s established low-rise character, making new projects particularly desirable. When they do appear, they tend toward boutique mid-rises that respect the neighbourhood\'s heritage streetscape.\n\nRoncy attracts families, professionals, and anyone who values walkability, community, and proximity to both High Park and the lakefront. The neighbourhood\'s Sorauren Park farmers\' market and annual events foster a tight-knit community feel.' },
  { name: 'Waterfront', slug: 'waterfront', region: 'Toronto', displayOrder: 19, avgPriceStudio: 550000, avgPrice1br: 700000, avgPrice2br: 1100000, avgPrice3br: 1700000, avgPricePenthouse: 4000000, description: 'Toronto\'s Waterfront stretches along Lake Ontario from Humber Bay to the Port Lands, encompassing some of the city\'s most ambitious redevelopment projects. The area includes the Harbourfront Centre, Queens Quay, Sugar Beach, and the rapidly evolving East Bayfront.\n\nWaterfront Toronto is overseeing massive investments in public realm, transit, and residential development, making this one of the most active pre-construction zones in the city. The Queens Quay streetcar and upcoming waterfront transit improvements will enhance connectivity.\n\nThe Waterfront appeals to buyers who value lake views, cycling infrastructure (the Martin Goodman Trail runs the entire length), and proximity to both the downtown core and the Toronto Islands. It\'s one of the few areas in Toronto where you can live steps from the water.' },
  { name: 'CityPlace', slug: 'cityplace', region: 'Toronto', displayOrder: 20, avgPriceStudio: 480000, avgPrice1br: 600000, avgPrice2br: 900000, avgPrice3br: 1300000, description: 'CityPlace is a massive master-planned community west of the CN Tower, developed primarily by Concord Adex. With over 20 towers and 15,000 residents, it\'s one of the densest neighbourhoods in Canada, offering a full urban lifestyle with parks, schools, and retail.\n\nNew phases of development continue to add towers to the CityPlace skyline, while the surrounding infrastructure matures with new parks, community centres, and retail. The area benefits from proximity to Union Station, the Bathurst streetcar, and the Gardiner Expressway.\n\nCityPlace attracts young professionals, renters-turned-buyers, and investors drawn by its proximity to the downtown core and relatively accessible pricing. The neighbourhood\'s evolving community amenities and improving streetscape continue to drive appreciation.' },
  { name: 'Fort York', slug: 'fort-york', region: 'Toronto', displayOrder: 21, avgPriceStudio: 520000, avgPrice1br: 670000, avgPrice2br: 1000000, avgPrice3br: 1500000, description: 'Fort York is a rapidly evolving neighbourhood surrounding the historic Fort York National Historic Site. The area has been transformed by major condo developments that combine urban living with historical character and waterfront proximity.\n\nPre-construction projects by Concord, Canderel, and others continue to add density to this well-connected area. The Fort York Pedestrian Bridge connects to the waterfront, and the Bathurst and Spadina streetcars provide transit to downtown.\n\nFort York appeals to buyers who want modern condo living near the waterfront and downtown at prices below King West. The neighbourhood\'s growing retail, park improvements, and proximity to the Exhibition Place entertainment district add to its appeal.' },
  { name: 'Canary District', slug: 'canary-district', region: 'Toronto', displayOrder: 22, avgPriceStudio: 500000, avgPrice1br: 650000, avgPrice2br: 950000, avgPrice3br: 1400000, description: 'The Canary District is a new community built on the former Pan Am Athletes\' Village in the West Don Lands. It\'s one of Toronto\'s most thoughtfully planned neighbourhoods, with LEED-certified buildings, extensive parkland, and a mix of market and affordable housing.\n\nThe neighbourhood includes the Cooper Koo Family YMCA, the Canary District Park, and is adjacent to the Distillery District\'s heritage buildings, galleries, and restaurants. Pre-construction continues to add residential and commercial space.\n\nCanary District attracts environmentally conscious buyers, young families, and anyone drawn to the neighbourhood\'s community-first planning, proximity to the Distillery District, and easy access to the Don Valley trails and waterfront.' },
  { name: 'Port Lands', slug: 'port-lands', region: 'Toronto', displayOrder: 23, avgPriceStudio: 480000, avgPrice1br: 620000, avgPrice2br: 920000, avgPrice3br: 1350000, description: 'The Port Lands is Toronto\'s largest urban redevelopment project, transforming 800 acres of industrial waterfront into a mixed-use community. The centrepiece is Villiers Island, created by the re-naturalization of the Don River mouth, with parks, affordable housing, and new neighbourhoods.\n\nThis is a long-term investment play — full buildout will span decades — but early-phase pre-construction projects offer the opportunity to buy into what will become one of Toronto\'s most significant communities. The area will eventually include the East Harbour transit hub connecting GO, Ontario Line, and streetcar.\n\nThe Port Lands attract forward-thinking investors and buyers excited by the vision of a new waterfront community designed for the 21st century, with sustainability, public transit, and green space at its core.' },
  { name: 'Mississauga', slug: 'mississauga', region: 'GTA', displayOrder: 24, avgPriceStudio: 400000, avgPrice1br: 520000, avgPrice2br: 750000, avgPrice3br: 1100000, avgPricePenthouse: 2000000, description: 'Mississauga is the GTA\'s largest suburb and sixth-largest city in Canada, with its own growing downtown core around Square One Shopping Centre. The city offers a compelling alternative to Toronto with lower prices, new developments, and improving transit.\n\nThe Mississauga City Centre area along Hurontario Street is experiencing massive pre-construction activity, driven by the new Hurontario LRT (Hazel McCallion Line) and ambitious Official Plan densification targets. Developers like Camrost, Rogers, and Daniels are building major mixed-use communities.\n\nMississauga appeals to families, new Canadians, and commuters who work in the airport corridor or downtown Toronto via the GO Transit Milton and Lakeshore West lines. The city\'s diverse dining, cultural festivals, and lakefront parks add quality of life.' },
  { name: 'Vaughan', slug: 'vaughan', region: 'GTA', displayOrder: 25, avgPriceStudio: 420000, avgPrice1br: 540000, avgPrice2br: 780000, avgPrice3br: 1150000, description: 'Vaughan has been transformed by the opening of the TTC\'s Line 1 extension to Vaughan Metropolitan Centre (VMC), creating a new urban node at Highway 7 and Jane Street. The VMC is one of the GTA\'s most ambitious transit-oriented developments.\n\nMajor pre-construction projects by Menkes, CentreCourt, and SmartCentres are reshaping the VMC into a dense, walkable urban centre. Canada\'s Wonderland, the Vaughan Mills shopping centre, and the planned Mackenzie Health hospital expansion add amenity value.\n\nVaughan appeals to families seeking newer housing stock, transit commuters via the TTC subway extension, and investors targeting the VMC\'s rapid densification. The city\'s Italian-Canadian culinary scene along Woodbridge\'s Islington corridor is a notable draw.' },
  { name: 'Richmond Hill', slug: 'richmond-hill', region: 'GTA', displayOrder: 26, avgPriceStudio: 400000, avgPrice1br: 520000, avgPrice2br: 750000, avgPrice3br: 1100000, description: 'Richmond Hill is a growing York Region suburb with an emerging downtown along Yonge Street. The planned Yonge North Subway Extension will bring TTC service to Richmond Hill, dramatically improving connectivity to Toronto and spurring significant pre-construction activity.\n\nDevelopers are positioning projects along the Yonge corridor in anticipation of the subway extension, offering pre-construction buyers the opportunity to purchase before the transit premium is fully priced in.\n\nRichmond Hill attracts families drawn to its excellent schools, diverse community, and green spaces including the Richmond Green Sports Centre and Lake Wilcox Park. The town\'s mix of urban and suburban character, combined with future subway access, makes it a strong long-term investment.' },
  { name: 'Markham', slug: 'markham', region: 'GTA', displayOrder: 27, avgPriceStudio: 400000, avgPrice1br: 520000, avgPrice2br: 750000, avgPrice3br: 1050000, description: 'Markham is York Region\'s economic engine, home to over 1,500 technology and life sciences companies. The city\'s downtown — centred around the Markham Centre area along Highway 7 — is being built from scratch as a new urban core with high-rise condos, offices, and retail.\n\nPre-construction development is concentrated around Markham Centre and the Unionville GO station area, with developers targeting the city\'s strong employment base and growing population. The planned Highway 7 rapidway will improve east-west transit.\n\nMarkham appeals to tech workers, families, and buyers from the Chinese-Canadian community who value the city\'s excellent schools, diverse dining scene (particularly along Hwy 7\'s "Golden Mile"), and proximity to major employers.' },
  { name: 'Oakville', slug: 'oakville', region: 'GTA', displayOrder: 28, avgPriceStudio: 450000, avgPrice1br: 580000, avgPrice2br: 850000, avgPrice3br: 1300000, description: 'Oakville is one of the GTA\'s most affluent and desirable suburban communities, known for its charming downtown, lakefront parks, and top-rated schools. The town\'s Lakeshore Road shopping district and harbour area offer a village-like atmosphere.\n\nPre-construction condos in Oakville are concentrated around the Oakville and Bronte GO stations, offering commuters direct GO Transit service to Union Station. New mixed-use developments are bringing urban-style living to this traditionally low-rise town.\n\nOakville attracts affluent families, downsizers from the local housing market, and professionals who commute to Toronto via GO Transit. The town\'s waterfront trails, cultural venues, and community feel make it a premium suburban address.' },
  { name: 'Burlington', slug: 'burlington', region: 'GTA', displayOrder: 29, avgPriceStudio: 400000, avgPrice1br: 520000, avgPrice2br: 750000, avgPrice3br: 1100000, description: 'Burlington sits at the western edge of the GTA on the shores of Lake Ontario, offering a balanced lifestyle between urban and natural environments. The downtown core along Brant Street has been revitalized with new restaurants, shops, and cultural venues.\n\nPre-construction activity is centred around the Burlington GO station and the downtown waterfront, with mixed-use towers bringing density to the traditionally low-rise community. The Lakeshore West GO line provides commuter rail service to Toronto.\n\nBurlington attracts families, nature lovers, and commuters drawn by its lakefront parks, the Royal Botanical Gardens, and Bruce Trail access. The city\'s growing culinary scene and community events add to its small-city charm.' },
  { name: 'Hamilton', slug: 'hamilton', region: 'GTA', displayOrder: 30, avgPriceStudio: 350000, avgPrice1br: 450000, avgPrice2br: 650000, avgPrice3br: 950000, description: 'Hamilton — "The Hammer" — has undergone a remarkable renaissance, evolving from a steel city into a hip, affordable alternative to Toronto. The James Street North arts district, the downtown farmers\' market, and the Waterfront Trail have attracted a creative class.\n\nPre-construction development is accelerating, driven by Hamilton\'s GO Transit connections (with all-day service to Union Station), McMaster University\'s innovation corridor, and prices that are a fraction of Toronto\'s. The planned Hamilton LRT will further catalyze development.\n\nHamilton appeals to first-time buyers, artists, remote workers, and investors who see the city\'s trajectory. Its waterfalls (over 100!), escarpment trails, and revitalized downtown make it one of the GTA\'s most exciting emerging markets.' },
  { name: 'Brampton', slug: 'brampton', region: 'GTA', displayOrder: 31, avgPriceStudio: 380000, avgPrice1br: 480000, avgPrice2br: 700000, avgPrice3br: 1000000, description: 'Brampton is one of Canada\'s fastest-growing cities, with a young, diverse population and an expanding employment base. The city is investing heavily in transit, with the planned Hazel McCallion LRT connecting to the Mississauga Transitway and the Kitchener GO line.\n\nPre-construction condos in Brampton offer some of the most affordable entry points in the GTA, particularly around the downtown core and Brampton GO station area. Developers are targeting the city\'s growing population and improving transit infrastructure.\n\nBrampton appeals to young families, new Canadians, and first-time buyers seeking affordability without sacrificing access to the broader GTA. The city\'s Gage Park, PAMA arts centre, and growing food scene provide quality of life amenities.' },
];

async function seedNeighborhoods() {
  console.log('Seeding neighbourhoods...');
  for (const n of NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: n.slug },
      update: { ...n },
      create: { ...n },
    });
  }
  console.log(`  ✓ ${NEIGHBORHOODS.length} neighbourhoods seeded`);
}

async function seedProjects() {
  console.log('Seeding projects from database file...');

  const dbPath = path.join(__dirname, '../scripts/toronto-precon-database.md');
  if (!fs.existsSync(dbPath)) {
    console.log('  ⚠ Project database file not found at ' + dbPath + ', skipping');
    return;
  }

  const content = fs.readFileSync(dbPath, 'utf-8');
  const neighborhoodMap = await getNeighborhoodMap();
  const developerCache: Record<string, string> = {};
  let projectCount = 0;

  const sections = content.split(/^## /m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0].trim().replace(/[#*]/g, '').trim();

    const tableRows = lines.filter(
      (l) => l.startsWith('|') && !l.includes('---') && !l.toLowerCase().includes('project name')
    );

    for (const row of tableRows) {
      const cols = row
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (cols.length < 5) continue;

      const name = cols[0].replace(/\*\*/g, '').trim();
      if (!name || name.toLowerCase().includes('project name')) continue;

      const address = cols[1] && cols[1] !== '--' ? cols[1] : null;
      const developerName = cols[2] && cols[2] !== '--' ? cols[2].trim() : null;
      const architect = cols[3] && cols[3] !== '--' ? cols[3].trim() : null;
      const status = cols[4] ? parseStatus(cols[4]) : 'PRE_CONSTRUCTION';
      const estCompletion = cols[5] && cols[5] !== '--' ? cols[5].trim() : null;
      const totalUnits = cols[6] ? parseInt2(cols[6]) : null;
      const floors = cols[7] ? parseInt2(cols[7]) : null;
      const priceRange = cols[8] || '';
      const category = cols[9] ? parseCategory(cols[9]) : 'PREMIUM';

      const priceMin = parsePrice(priceRange);
      const slug = slugify(name);

      let neighborhoodId: string | null = null;
      const sectionLower = sectionTitle.toLowerCase();
      for (const [nSlug, nId] of Object.entries(neighborhoodMap)) {
        if (sectionLower.includes(nSlug.replace(/-/g, ' ')) || sectionLower.includes(nSlug.replace(/-/g, ''))) {
          neighborhoodId = nId;
          break;
        }
      }

      let developerId: string | null = null;
      if (developerName) {
        if (!developerCache[developerName]) {
          const devSlug = slugify(developerName);
          const dev = await prisma.developer.upsert({
            where: { slug: devSlug },
            update: {},
            create: { name: developerName, slug: devSlug },
          });
          developerCache[developerName] = dev.id;
        }
        developerId = developerCache[developerName];
      }

      try {
        await prisma.project.upsert({
          where: { slug },
          update: {
            name, address, neighborhoodId, developerId, architect,
            status: status as any, estCompletion, totalUnits, floors,
            priceMin, category: category as any,
          },
          create: {
            name, slug, address, neighborhoodId, developerId, architect,
            status: status as any, estCompletion, totalUnits, floors,
            priceMin, category: category as any,
          },
        });
        projectCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          const newSlug = `${slug}-2`;
          await prisma.project.upsert({
            where: { slug: newSlug },
            update: { name, neighborhoodId, developerId },
            create: {
              name, slug: newSlug, address, neighborhoodId, developerId, architect,
              status: status as any, estCompletion, totalUnits, floors,
              priceMin, category: category as any,
            },
          });
          projectCount++;
        }
      }
    }
  }

  console.log(`  ✓ ${projectCount} projects seeded`);
}

async function seedBlogPosts() {
  console.log('Seeding blog posts...');

  const blogPath = path.join(__dirname, '../scripts/toronto-blog-posts.md');
  if (!fs.existsSync(blogPath)) {
    console.log('  ⚠ Blog posts file not found at ' + blogPath + ', skipping');
    return;
  }

  const content = fs.readFileSync(blogPath, 'utf-8');
  const posts = content.split(/={3,}\s*POST\s*(BREAK|[0-9]+)\s*={3,}/i).filter((s) => s.trim().length > 100);

  let count = 0;
  for (const postContent of posts) {
    const titleMatch = postContent.match(/^#\s+(.+?)$/m);
    const metaTitleMatch = postContent.match(/\*\*Meta Title\*\*:\s*(.+)/i) || postContent.match(/Meta Title:\s*(.+)/i);
    const metaDescMatch = postContent.match(/\*\*Meta Description\*\*:\s*(.+)/i) || postContent.match(/Meta Description:\s*(.+)/i);
    const keywordMatch = postContent.match(/\*\*Target Keyword\*\*:\s*(.+)/i) || postContent.match(/Target Keyword:\s*(.+)/i);
    const slugMatch = postContent.match(/\*\*Slug\*\*:\s*\/blog\/(.+)/i) || postContent.match(/Slug:\s*\/blog\/(.+)/i) || postContent.match(/\*\*Slug\*\*:\s*(.+)/i);

    const title = titleMatch?.[1]?.replace(/\*\*/g, '').trim();
    if (!title) continue;

    const slug = slugMatch?.[1]?.trim() || slugify(title);
    const metaTitle = metaTitleMatch?.[1]?.replace(/"/g, '').trim();
    const metaDescription = metaDescMatch?.[1]?.replace(/"/g, '').trim();
    const targetKeyword = keywordMatch?.[1]?.replace(/"/g, '').trim();

    let bodyContent = postContent;
    bodyContent = bodyContent.replace(/^\*\*(Meta Title|Meta Description|Target Keyword|Slug)\*\*:.*$/gim, '');
    bodyContent = bodyContent.replace(/^(Meta Title|Meta Description|Target Keyword|Slug):.*$/gim, '');
    bodyContent = bodyContent.trim();

    const paragraphs = bodyContent.split('\n\n').filter((p) => p.trim() && !p.startsWith('#') && !p.startsWith('*'));
    const excerpt = paragraphs[0]?.replace(/[#*_]/g, '').trim().slice(0, 300);

    try {
      await prisma.blogPost.upsert({
        where: { slug },
        update: { title, content: bodyContent, metaTitle, metaDescription, targetKeyword, excerpt },
        create: {
          title, slug, content: bodyContent, metaTitle, metaDescription,
          targetKeyword, excerpt, publishedAt: new Date(),
          author: 'CondoWizard.ca',
        },
      });
      count++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⚠ Duplicate slug: ${slug}, skipping`);
      } else {
        console.error(`  ✗ Error seeding post "${title}":`, e.message);
      }
    }
  }
  console.log(`  ✓ ${count} blog posts seeded`);
}

async function getNeighborhoodMap(): Promise<Record<string, string>> {
  const neighborhoods = await prisma.neighborhood.findMany({ select: { id: true, slug: true } });
  const map: Record<string, string> = {};
  for (const n of neighborhoods) {
    map[n.slug] = n.id;
    map[n.slug.replace(/-/g, '')] = n.id;
  }
  return map;
}

async function main() {
  console.log('🏗️ Starting CondoWizard seed...\n');
  await seedNeighborhoods();
  await seedProjects();
  await seedBlogPosts();
  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
