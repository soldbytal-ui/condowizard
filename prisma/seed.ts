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
  // Handle "From $2M" vs "From $2,000,000"
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

// --- Neighborhoods data ---
const NEIGHBORHOODS = [
  {
    name: 'Downtown Core',
    slug: 'downtown-core',
    region: 'Toronto',
    displayOrder: 1,
    avgPriceStudio: 550000,
    avgPrice1br: 700000,
    avgPrice2br: 1100000,
    avgPrice3br: 1800000,
    avgPricePenthouse: 5000000,
    description: 'Toronto\'s financial and cultural heart centered around the Financial District, PATH underground network, Union Station, and the waterfront. Home to the CN Tower, Rogers Centre, and the Scotiabank Arena, the Downtown Core is the most densely developed area in the country, with a skyline that continues to transform year after year. Bay Street\'s towers house the headquarters of Canada\'s largest banks, while the surrounding streets pulse with energy from morning commuters to late-night theatre crowds along King Street.\n\nThe neighbourhood offers unparalleled transit connectivity. Union Station serves as the hub for the TTC subway (Lines 1 and 2), GO Transit commuter rail to every corner of the GTA, and the UP Express to Pearson Airport. The PATH system connects over 30 kilometres of underground shopping and walkways, making it possible to live, work, and shop without stepping outside during Toronto\'s coldest months.\n\nPre-construction activity in the Downtown Core remains intense, with dozens of towers in various stages of development. Buyers here are typically professionals, investors, and newcomers to Canada who value walkability and proximity to employment centres. Prices reflect the premium of being at the absolute centre of Canada\'s largest city, though studios and one-bedrooms remain the most accessible entry points into this market.'
  },
  {
    name: 'King West',
    slug: 'king-west',
    region: 'Toronto',
    displayOrder: 2,
    avgPriceStudio: 600000,
    avgPrice1br: 750000,
    avgPrice2br: 1200000,
    avgPrice3br: 2000000,
    description: 'King West is one of Toronto\'s trendiest neighbourhoods, stretching along King Street West from University Avenue to Dufferin Street. Once a garment manufacturing district, it has reinvented itself as the city\'s premier dining, nightlife, and entertainment destination. The stretch between Bathurst and Spadina is packed with some of the best restaurants in the city, rooftop bars, boutique hotels like the Thompson and the Broadview, and a thriving arts scene anchored by TIFF Bell Lightbox and the Royal Alexandra Theatre.\n\nTransit access is strong, with the 504 King streetcar providing a direct east-west connection and St. Andrew station on Line 1 at the eastern edge. The neighbourhood is highly walkable, with a Walk Score consistently above 95. Cycling infrastructure along Richmond and Adelaide provides additional commuting options for residents.\n\nPre-construction condos in King West command a premium thanks to the lifestyle factor. Projects here tend to be mid-rise to tall towers with design-forward aesthetics, appealing to young professionals and couples who want to be in the middle of the action. The area\'s former industrial lofts and converted warehouses add character that sets King West apart from the glass towers of the Financial District.'
  },
  {
    name: 'Liberty Village',
    slug: 'liberty-village',
    region: 'Toronto',
    displayOrder: 3,
    avgPriceStudio: 500000,
    avgPrice1br: 650000,
    avgPrice2br: 950000,
    avgPrice3br: 1400000,
    description: 'Liberty Village is a self-contained urban community nestled south of King Street West between Dufferin Street and Strachan Avenue. Built on the grounds of a former industrial park, the neighbourhood retains its red-brick heritage character while embracing a modern, tech-forward identity. It has become a hub for creative agencies, tech startups, and media companies, giving it a youthful, entrepreneurial energy that few Toronto neighbourhoods can match.\n\nTransit has historically been Liberty Village\'s biggest challenge, but the arrival of the Ontario Line and improvements to the Exhibition GO station have significantly improved connectivity. The 504 King streetcar runs along the northern edge, and the Gardiner Expressway provides quick vehicle access to downtown and the western suburbs. Within the neighbourhood itself, everything from groceries to fitness studios is within walking distance.\n\nPre-construction pricing in Liberty Village is more accessible than neighbouring King West or CityPlace, making it a popular entry point for first-time buyers and investors. The community has a strong social fabric, with farmers\' markets, outdoor festivals, and a dog-friendly culture centred around the off-leash parks. Projects here tend toward mid-rise buildings that respect the area\'s heritage scale.'
  },
  {
    name: 'Queen West',
    slug: 'queen-west',
    region: 'Toronto',
    displayOrder: 4,
    avgPriceStudio: 520000,
    avgPrice1br: 680000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: 'Queen West has long been regarded as one of Canada\'s most creative and culturally significant streets. Stretching from University Avenue westward through the Art & Design District, Ossington, and into Parkdale, Queen West was once named one of the world\'s coolest neighbourhoods by Vogue. The strip is home to independent boutiques, vintage shops, the Museum of Contemporary Art (MOCA), Drake Hotel, and Gladstone House, creating a bohemian atmosphere that continues to draw artists and creatives.\n\nThe neighbourhood is served by the 501 Queen streetcar, one of the longest streetcar routes in North America, and is within walking distance of Osgoode and St. Patrick stations on Line 1. Trinity Bellwoods Park serves as the social heart of the area, a sprawling green space that fills up on summer weekends with picnickers, dog walkers, and drum circles.\n\nDevelopment along Queen West has been measured compared to the tower-heavy corridors to the south and east, with a mix of mid-rise projects and boutique condos that respect the low-rise streetscape. Buyers here tend to prioritize character and lifestyle over square footage, and the neighbourhood commands a premium for its cultural cachet and walkability.'
  },
  {
    name: 'Yorkville',
    slug: 'yorkville',
    region: 'Toronto',
    displayOrder: 5,
    avgPriceStudio: 800000,
    avgPrice1br: 1200000,
    avgPrice2br: 2500000,
    avgPrice3br: 4000000,
    avgPricePenthouse: 8000000,
    description: 'Yorkville is Toronto\'s most prestigious residential address, a luxury enclave centred around Bloor Street between Avenue Road and Yonge Street. Home to flagship stores from Chanel, Hermes, Louis Vuitton, and Tiffany, as well as the Hazelton Hotel, the Royal Ontario Museum, and some of the city\'s finest dining establishments, Yorkville represents the pinnacle of upscale Toronto living. The Victorian-era laneway known as Yorkville Avenue and Cumberland Street add a charming, village-like quality to the neighbourhood.\n\nTransit is excellent, with Bay and Bloor-Yonge stations providing connections across the entire TTC subway network. The neighbourhood is steps from the University of Toronto\'s St. George campus and the Royal Conservatory of Music, adding an intellectual dimension to its luxury appeal. The annual Toronto International Film Festival transforms the area each September, with celebrity sightings and red-carpet events.\n\nPre-construction in Yorkville is defined by ultra-luxury projects with premium finishes, concierge services, and price points that rival the most expensive markets in North America. Buyers here are high-net-worth individuals, empty nesters downsizing from Rosedale or Forest Hill estates, and international purchasers seeking a blue-chip Toronto address. The limited supply of developable land ensures that Yorkville properties hold their value exceptionally well.'
  },
  {
    name: 'The Annex',
    slug: 'the-annex',
    region: 'Toronto',
    displayOrder: 6,
    avgPriceStudio: 480000,
    avgPrice1br: 640000,
    avgPrice2br: 950000,
    avgPrice3br: 1400000,
    description: 'The Annex is one of Toronto\'s most established and intellectually vibrant neighbourhoods, bounded roughly by Bloor Street to the south, Dupont to the north, Bathurst to the west, and Avenue Road to the east. Its tree-lined streets are home to beautifully preserved Victorian and Edwardian houses, while Bloor Street offers an eclectic mix of bookshops, independent restaurants, music venues like Lee\'s Palace, and the legendary Honest Ed\'s site now being redeveloped into a mixed-use community.\n\nThe neighbourhood is anchored by the University of Toronto, giving it a youthful academic energy. Spadina and Bathurst stations on Line 2 provide easy subway access, and the area is exceptionally bike-friendly with dedicated lanes along Bloor Street. The Bata Shoe Museum, Hot Docs Ted Rogers Cinema, and numerous live music venues make The Annex a cultural destination in its own right.\n\nPre-construction development in The Annex is limited by heritage protections and low-rise zoning on residential streets, which keeps supply tight and values stable. New projects tend to cluster along Bloor and Dupont, offering boutique-scale condos that appeal to academics, professionals, and downsizers who want a walkable, culturally rich lifestyle without the intensity of downtown living.'
  },
  {
    name: 'Midtown',
    slug: 'midtown',
    region: 'Toronto',
    displayOrder: 7,
    avgPriceStudio: 500000,
    avgPrice1br: 670000,
    avgPrice2br: 1050000,
    avgPrice3br: 1600000,
    description: 'Midtown Toronto generally refers to the area between St. Clair Avenue and Eglinton Avenue, centred along Yonge Street. It encompasses established residential enclaves like Deer Park, Summerhill, and Moore Park, offering a more relaxed pace of life than the downtown core while remaining thoroughly urban. The neighbourhood is popular with families and professionals who appreciate its excellent schools, mature tree canopy, and proximity to the ravine system.\n\nTransit is a defining feature of Midtown, with St. Clair, Summerhill, Rosedale, and Davisville stations on Line 1 providing quick subway access to downtown in under 15 minutes. The St. Clair streetcar connects east and west, and the Eglinton Crosstown LRT has added a major new rapid transit line along the northern boundary. GO Transit\'s Leaside and Oriole stations are also nearby for commuters heading beyond the city.\n\nPre-construction in Midtown focuses on the Yonge Street corridor, where planning permissions allow for taller buildings amid the otherwise low-rise residential fabric. Projects here attract move-up buyers, empty nesters from surrounding single-family neighbourhoods, and young families who want top-ranked schools and green space without sacrificing urban convenience. Summerhill Market, the shops of Yonge and St. Clair, and the David Balfour Park ravine trail system anchor daily life.'
  },
  {
    name: 'Yonge & Eglinton',
    slug: 'yonge-eglinton',
    region: 'Toronto',
    displayOrder: 8,
    avgPriceStudio: 490000,
    avgPrice1br: 650000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: 'Yonge and Eglinton, affectionately known as "Young and Eligible," is one of Toronto\'s most active development nodes. The intersection of Yonge Street and Eglinton Avenue has become a forest of construction cranes, with dozens of towers reshaping the skyline of this midtown hub. The neighbourhood combines the energy of a secondary downtown with the residential charm of the surrounding tree-lined streets of Davisville, Mount Pleasant, and North Toronto.\n\nThe area is a transit powerhouse. Eglinton station on Line 1 sits at the intersection, and the Eglinton Crosstown LRT now provides rapid east-west service stretching from Mount Dennis to Kennedy station. This connectivity has been a major catalyst for development and has significantly boosted property values in the surrounding blocks.\n\nBuyers at Yonge and Eglinton are drawn by the neighbourhood\'s completeness: excellent dining along Yonge Street, proximity to shops at the Yonge Eglinton Centre, access to parks like Eglinton Park and Sherwood Park, and some of the best public and private schools in the city. Pre-construction pricing is more moderate than the downtown core, making this a popular choice for young professionals and families who want urban convenience in a slightly quieter setting.'
  },
  {
    name: 'North York',
    slug: 'north-york',
    region: 'Toronto',
    displayOrder: 9,
    avgPriceStudio: 420000,
    avgPrice1br: 560000,
    avgPrice2br: 800000,
    avgPrice3br: 1200000,
    description: 'North York is a vast former municipality stretching across the northern portion of Toronto, with its urban core centred around the Yonge Street corridor between Sheppard Avenue and Finch Avenue. The North York City Centre, anchored by Mel Lastman Square, the Toronto Centre for the Arts, and Empress Walk, functions as a secondary downtown with a growing cluster of residential towers, office buildings, and retail.\n\nTransit infrastructure is excellent along the Yonge corridor, with Finch, North York Centre, Sheppard-Yonge, and several other Line 1 stations providing direct subway service to downtown in 25-30 minutes. The Sheppard Line (Line 4) extends eastward toward Don Mills, and numerous bus routes fan out across the wider North York area. Highway 401 provides vehicle access to all corners of the GTA.\n\nPre-construction in North York offers some of the best value in the city, with prices significantly below downtown while still providing genuine urban density and walkability along the Yonge corridor. The area attracts a diverse mix of buyers including newcomers to Canada, families seeking more space, and investors targeting the strong rental market driven by nearby York University, Seneca College, and numerous corporate offices.'
  },
  {
    name: 'Scarborough',
    slug: 'scarborough',
    region: 'Toronto',
    displayOrder: 10,
    avgPriceStudio: 380000,
    avgPrice1br: 490000,
    avgPrice2br: 700000,
    avgPrice3br: 1000000,
    description: 'Scarborough is Toronto\'s eastern borough, a sprawling and culturally diverse area that stretches from Victoria Park Avenue to the Rouge River. It is home to the Scarborough Bluffs, a dramatic geological formation rising 65 metres above Lake Ontario, as well as Rouge National Urban Park, Canada\'s first national urban park. Scarborough Town Centre serves as the commercial hub, surrounded by a growing cluster of residential towers.\n\nTransit is evolving rapidly in Scarborough. Line 2 currently terminates at Kennedy station, where it connects to numerous bus routes, but the planned Scarborough subway extension will bring rapid transit deeper into the borough. The Eglinton Crosstown LRT\'s eastern terminus at Kennedy will also improve east-west connectivity. GO Transit\'s Rouge Hill, Guildwood, and Scarborough stations provide commuter rail service along the Lakeshore East line.\n\nPre-construction in Scarborough represents some of the most affordable new-build opportunities in the City of Toronto. The borough\'s incredible culinary diversity, with world-class Chinese, South Asian, Caribbean, and Middle Eastern food, combined with its natural beauty and improving transit, make it increasingly attractive to first-time buyers and investors looking for growth potential. The University of Toronto Scarborough campus and Centennial College drive rental demand.'
  },
  {
    name: 'Etobicoke',
    slug: 'etobicoke',
    region: 'Toronto',
    displayOrder: 11,
    avgPriceStudio: 400000,
    avgPrice1br: 530000,
    avgPrice2br: 780000,
    avgPrice3br: 1100000,
    description: 'Etobicoke is Toronto\'s western borough, encompassing diverse communities from the lakefront to the northern reaches of the city along the Humber River valley. Key centres include the Queensway corridor, Mimico, Humber Bay Shores (an increasingly dense waterfront community of gleaming towers), Islington-City Centre West, and the residential enclaves of Kingsway and Princess Margaret. The area offers a suburban-urban blend that appeals to families and commuters alike.\n\nTransit options include Line 2\'s western terminus at Kipling station, the Bloor-Danforth stations at Royal York, Old Mill, and Islington, and GO Transit\'s Lakeshore West line with stops at Mimico and Long Branch. The Gardiner Expressway and Highway 427 provide vehicle access to downtown and Pearson International Airport, which sits just north of Etobicoke\'s boundaries.\n\nHumber Bay Shores has emerged as one of the GTA\'s most active pre-construction markets, offering waterfront living with skyline views at prices well below the downtown core. Elsewhere in Etobicoke, developments along the Queensway and near Kipling station offer more affordable entry points. The borough\'s lakeside parks, including Humber Bay Park and Colonel Samuel Smith Park, provide green space and cycling trails that add significant lifestyle value.'
  },
  {
    name: 'Leaside',
    slug: 'leaside',
    region: 'Toronto',
    displayOrder: 12,
    avgPriceStudio: 500000,
    avgPrice1br: 680000,
    avgPrice2br: 1050000,
    avgPrice3br: 1600000,
    description: 'Leaside is one of Toronto\'s most coveted family neighbourhoods, a leafy residential enclave east of Yonge Street defined by its excellent schools, safe streets, and strong community spirit. Originally developed as a planned garden suburb in the 1920s, Leaside features well-maintained bungalows and two-storey homes on generous lots, along with a charming commercial strip along Bayview Avenue anchored by independent shops, cafes, and the beloved Leaside Pub.\n\nThe neighbourhood sits adjacent to the sprawling Leaside ravine system, offering hiking and cycling trails that connect to the Don Valley trail network. Leaside station on the future Ontario Line will dramatically improve rapid transit access, complementing the existing bus network and proximity to the Bayview and Broadview extensions. GO Transit\'s Leaside station on the Barrie line provides commuter rail service.\n\nPre-construction opportunities in Leaside proper are limited due to its predominantly low-rise residential character, but developments along the Laird Drive industrial corridor and near the future Ontario Line stations are bringing new condo inventory to the area. Buyers here are typically families and downsizers from the surrounding single-family market who want to stay in a neighbourhood known for its top-ranked schools, including Northlea, Bessborough, and Leaside High School.'
  },
  {
    name: 'Leslieville',
    slug: 'leslieville',
    region: 'Toronto',
    displayOrder: 13,
    avgPriceStudio: 470000,
    avgPrice1br: 620000,
    avgPrice2br: 900000,
    avgPrice3br: 1350000,
    description: 'Leslieville is a vibrant east-end neighbourhood stretching along Queen Street East from the Don River to Greenwood Avenue. Once a working-class industrial area, Leslieville has undergone a dramatic transformation into one of Toronto\'s most desirable communities for young families and creatives. The main strip is lined with independent coffee shops, brunch spots, antique stores, and design showrooms that give the neighbourhood its distinctive character.\n\nTransit access is provided by the 501 Queen streetcar, one of the city\'s most-used surface routes, with connections to the Broadview subway station on Line 2. The neighbourhood is highly bikeable, with the Martin Goodman Trail along the waterfront accessible via a short ride south. Greenwood Park, Jimmie Simpson Park, and the nearby Ashbridges Bay provide ample green space and recreational opportunities.\n\nPre-construction in Leslieville is primarily mid-rise, reflecting the neighbourhood\'s low-rise streetscape character. The Unilever precinct and surrounding former industrial lands to the south are being transformed into a massive mixed-use community that will significantly increase housing supply. Leslieville appeals to buyers who want a neighbourhood with genuine personality, strong community bonds, and an east-end lifestyle that feels authentically Toronto.'
  },
  {
    name: 'Riverside',
    slug: 'riverside',
    region: 'Toronto',
    displayOrder: 14,
    avgPriceStudio: 480000,
    avgPrice1br: 640000,
    avgPrice2br: 930000,
    avgPrice3br: 1400000,
    description: 'Riverside is a compact, character-rich neighbourhood east of the Don River, centred along Queen Street East between the Don Valley and Broadview Avenue. It is home to some of Toronto\'s most acclaimed dining establishments, including award-winning restaurants along the Queen East strip, and anchored culturally by the Riverside BIA, the Broadview Hotel, and the historic Jilly\'s site redevelopment.\n\nThe neighbourhood benefits from excellent transit, with Broadview station on Line 2 at its doorstep and the 501 Queen and 504 King streetcars running through. The Don Valley trail system is immediately accessible, providing cycling and running paths that stretch from the waterfront to well north of the city. The planned East Harbour transit hub, just south of Riverside, will bring Ontario Line, GO Transit, and SmartTrack service to the area.\n\nPre-construction interest in Riverside has surged in recent years as buyers recognize its proximity to downtown, authentic neighbourhood feel, and the transformative impact of the East Harbour development. Projects here tend to be thoughtfully designed mid-rise buildings that complement the existing Victorian and Edwardian streetscape. The neighbourhood attracts professionals and young families who value walkability, culture, and access to nature.'
  },
  {
    name: 'Danforth',
    slug: 'danforth',
    region: 'Toronto',
    displayOrder: 15,
    avgPriceStudio: 440000,
    avgPrice1br: 580000,
    avgPrice2br: 850000,
    avgPrice3br: 1250000,
    description: 'The Danforth is one of Toronto\'s great neighbourhood streets, stretching along Danforth Avenue from Broadview to Victoria Park. Known historically as Greektown for its concentration of Greek restaurants and bakeries between Chester and Pape, the Danforth has evolved into a multicultural, family-friendly corridor with excellent independent dining, the annual Taste of the Danforth festival, and a strong sense of community pride.\n\nTransit access is superb, with Line 2 running directly beneath Danforth Avenue and stations at Broadview, Chester, Pape, Donlands, Greenwood, Coxwell, and Woodbine. This gives residents direct subway access to downtown and connections across the city. The neighbourhood is also well-served by north-south bus routes and an increasingly robust cycling network.\n\nPre-construction along the Danforth is gaining momentum as city planning encourages gentle density along transit corridors. Projects tend to be mid-rise buildings of 8 to 15 storeys, concentrated near subway stations. The Danforth attracts families priced out of the single-family market in the surrounding Riverdale and Playter Estates neighbourhoods, as well as first-time buyers who want Line 2 subway access and a walkable, community-oriented lifestyle at prices below the downtown core.'
  },
  {
    name: 'High Park',
    slug: 'high-park',
    region: 'Toronto',
    displayOrder: 16,
    avgPriceStudio: 470000,
    avgPrice1br: 630000,
    avgPrice2br: 920000,
    avgPrice3br: 1350000,
    description: 'High Park is one of Toronto\'s most beloved neighbourhoods, defined by its proximity to the 161-hectare High Park, the city\'s largest public park. The park features hiking trails, Grenadier Pond, a free zoo, swimming pool, tennis courts, and the famous cherry blossoms that draw thousands of visitors each spring. The surrounding residential streets are lined with mature trees and a mix of Victorian homes, Edwardian semis, and apartment buildings along Bloor Street West.\n\nThe neighbourhood is well-connected by transit, with High Park and Keele stations on Line 2 providing subway access, and the 501 Queen and 504 King streetcars running along the southern edges. The Gardiner Expressway is accessible for drivers, and the Martin Goodman Trail along the waterfront connects to the park\'s extensive trail network for cyclists and runners.\n\nPre-construction in the High Park area tends to be concentrated along Bloor Street West and the Junction Triangle to the north, where former industrial sites are being transformed into mixed-use communities. The neighbourhood appeals to families, nature lovers, and anyone who prioritizes green space and outdoor recreation. The charming commercial strip along Roncesvalles Avenue and the shops on Bloor West Village are within easy walking or cycling distance, adding to the area\'s completeness.'
  },
  {
    name: 'Junction',
    slug: 'junction',
    region: 'Toronto',
    displayOrder: 17,
    avgPriceStudio: 450000,
    avgPrice1br: 590000,
    avgPrice2br: 870000,
    avgPrice3br: 1300000,
    description: 'The Junction is a resurgent west-end neighbourhood centred around the intersection of Dundas Street West and Keele Street. Once a dry municipality that prohibited alcohol sales until 1998, The Junction has since blossomed into one of Toronto\'s most exciting food and drink destinations, with craft breweries, wine bars, and independent restaurants lining Dundas West. The neighbourhood retains a gritty, independent spirit that appeals to artists, entrepreneurs, and young professionals.\n\nTransit access includes Dundas West station on Line 2 and the UP Express to Pearson Airport, with the Bloor GO/UP station providing additional commuter rail options. The Junction Triangle area to the south is also served by the Bloor-Danforth line, and bus routes connect to surrounding neighbourhoods. Cycling infrastructure is improving, with bike lanes on Dupont and connections to the West Toronto Railpath, a popular linear park built on a former rail corridor.\n\nPre-construction in The Junction and Junction Triangle has accelerated rapidly, with numerous mid-rise and tall projects taking advantage of the area\'s former industrial zoning. The neighbourhood offers strong value compared to more established areas like King West and Queen West, while delivering a similarly vibrant street-level experience. Buyers here tend to be design-conscious young professionals and families who appreciate the area\'s artisanal character and improving transit connectivity.'
  },
  {
    name: 'Roncesvalles',
    slug: 'roncesvalles',
    region: 'Toronto',
    displayOrder: 18,
    avgPriceStudio: 490000,
    avgPrice1br: 650000,
    avgPrice2br: 960000,
    avgPrice3br: 1450000,
    description: 'Roncesvalles, known locally as "Roncy," is a charming residential neighbourhood stretching along Roncesvalles Avenue from Queen Street West to Bloor Street. With its Polish bakeries, independent bookshops, cozy cafes, and the revitalized repertory cinema, the Revue, Roncesvalles has a distinctly European village atmosphere that sets it apart from Toronto\'s more urban-feeling neighbourhoods. The area is one of the city\'s most sought-after family destinations.\n\nThe 504 King streetcar runs the length of Roncesvalles Avenue, connecting residents to King West and the downtown core, while Dundas West station on Line 2 and the UP Express sit at the northern end of the neighbourhood. High Park is steps away to the west, and the Martin Goodman waterfront trail is accessible to the south, making this one of the most naturally connected neighbourhoods in the city.\n\nPre-construction opportunities in Roncesvalles are rare, as the neighbourhood\'s low-rise residential character is protected by local planning policies. When new projects do emerge, they tend to be boutique in scale and sell quickly. This scarcity supports strong resale values and makes Roncesvalles one of the most stable residential markets in Toronto. Buyers here are typically established families and downsizers who value community, walkability, and proximity to both High Park and the downtown core.'
  },
  {
    name: 'Waterfront',
    slug: 'waterfront',
    region: 'Toronto',
    displayOrder: 19,
    avgPriceStudio: 530000,
    avgPrice1br: 700000,
    avgPrice2br: 1050000,
    avgPrice3br: 1650000,
    avgPricePenthouse: 4500000,
    description: 'Toronto\'s Waterfront stretches along the Lake Ontario shoreline from Humber Bay in the west through the central harbour to the Port Lands in the east. This is one of the largest urban waterfront revitalization projects in the world, guided by Waterfront Toronto, and it is transforming former industrial lands into vibrant mixed-use communities with parks, cultural spaces, and thousands of new residences. Sugar Beach, HTO Park, and Sherbourne Common have already established the area as a major public amenity.\n\nTransit along the waterfront includes the 509 and 510 streetcar routes connecting to Union Station, with the future Waterfront LRT planned to improve east-west connectivity. Union Station provides connections to the TTC subway, GO Transit, and the UP Express. The Gardiner Expressway runs just north, and the Billy Bishop Toronto City Airport on the Toronto Islands provides short-haul flights to Montreal, Ottawa, and select US destinations.\n\nPre-construction on the waterfront is booming, with major projects at Quayside, East Bayfront, and Bayside transforming the eastern waterfront. Buyers are attracted by the unobstructed lake views, proximity to the Jack Layton Ferry Terminal and Toronto Islands, and the sense of living in a neighbourhood that is being purpose-built for the 21st century. The waterfront lifestyle, with its sailing, kayaking, and cycling along the Martin Goodman Trail, is a powerful draw for those willing to invest in an area still maturing.'
  },
  {
    name: 'CityPlace',
    slug: 'cityplace',
    region: 'Toronto',
    displayOrder: 20,
    avgPriceStudio: 480000,
    avgPrice1br: 620000,
    avgPrice2br: 900000,
    avgPrice3br: 1350000,
    description: 'CityPlace is a master-planned community of residential towers built on former railway lands between Bathurst Street and Strachan Avenue, south of Front Street. Developed primarily by Concord Adex, the community has grown from empty rail yards into a dense neighbourhood of over 20 towers housing tens of thousands of residents. Canoe Landing Park, the neighbourhood\'s central green space, provides playgrounds, sports fields, and public art installations.\n\nTransit access is good, with Bathurst and Spadina streetcars connecting to the subway, and the 509 and 510 Harbourfront streetcars providing waterfront service. Union Station is a short streetcar ride or 15-minute walk to the east. The Gardiner Expressway provides vehicle access, and the Bentway, an innovative public space built beneath the Gardiner, has added a major recreational and cultural amenity to the neighbourhood.\n\nCityPlace has matured significantly since its early days, with improved retail, schools, and community facilities addressing earlier criticisms of the development. Pre-construction pricing remains competitive relative to the downtown core, making it attractive to young professionals, investors, and newcomers. The neighbourhood\'s proximity to Rogers Centre, Scotiabank Arena, and the entertainment district adds lifestyle value, while ongoing development continues to fill in the remaining parcels.'
  },
  {
    name: 'Fort York',
    slug: 'fort-york',
    region: 'Toronto',
    displayOrder: 21,
    avgPriceStudio: 510000,
    avgPrice1br: 670000,
    avgPrice2br: 980000,
    avgPrice3br: 1500000,
    description: 'Fort York is a rapidly evolving neighbourhood adjacent to CityPlace, centred around the historic Fort York National Historic Site, one of Toronto\'s most significant heritage landmarks. The area has seen an explosion of residential tower development, transforming into a dense urban community while preserving the 200-year-old fort as its cultural anchor. The Fort York Visitor Centre and the Bentway, a 1.75-kilometre public space beneath the Gardiner Expressway, have added cultural and recreational infrastructure.\n\nTransit options include the Bathurst streetcar, the 509 Harbourfront route, and proximity to both Bathurst station on Line 2 and Union Station via a short streetcar ride. The Exhibition GO station is a short walk to the west, providing commuter rail access. Cycling infrastructure is strong, with connections to the Martin Goodman Trail and the waterfront path network.\n\nPre-construction in Fort York continues at a brisk pace, with new towers rising on the remaining development parcels. The neighbourhood offers a slightly more premium experience than CityPlace, with newer buildings featuring improved design standards and larger suite layouts. Buyers are attracted by the central location, historic character, proximity to the waterfront, and improving neighbourhood amenities including new schools, retail, and public spaces.'
  },
  {
    name: 'Canary District',
    slug: 'canary-district',
    region: 'Toronto',
    displayOrder: 22,
    avgPriceStudio: 520000,
    avgPrice1br: 680000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: 'The Canary District is a purpose-built neighbourhood in Toronto\'s West Don Lands, originally constructed as the Athletes\' Village for the 2015 Pan American Games. After the games, the residences were converted into a mix of condominiums, affordable rental housing, and student residences for George Brown College. The result is one of Toronto\'s most thoughtfully designed new communities, with wide sidewalks, generous parks, and a mix of building types.\n\nTransit access is solid and improving. The neighbourhood is within walking distance of the Distillery District and the 504 King streetcar, while the future East Harbour transit hub, just to the southeast, will bring Ontario Line, GO Transit, and SmartTrack service to the area. The Don Valley trail system is immediately accessible for cycling and recreation, connecting to a city-wide network of paths.\n\nPre-construction in the Canary District and surrounding West Don Lands continues with new phases of development. Corktown Common, a beautifully designed park with a marsh, splash pad, and skyline views, serves as the neighbourhood\'s green heart. Buyers here appreciate the modern urban planning, sustainability features, proximity to the Distillery District\'s restaurants and cultural events, and the area\'s strong growth trajectory as East Harbour transforms into a major employment and transit hub.'
  },
  {
    name: 'Port Lands',
    slug: 'port-lands',
    region: 'Toronto',
    displayOrder: 23,
    avgPriceStudio: 500000,
    avgPrice1br: 660000,
    avgPrice2br: 970000,
    avgPrice3br: 1450000,
    description: 'The Port Lands is Toronto\'s most ambitious urban development frontier, an 800-acre expanse of former industrial waterfront land east of the downtown core currently undergoing a multi-billion-dollar transformation led by Waterfront Toronto. The centrepiece is the Port Lands Flood Protection Project, which is creating a new mouth for the Don River and building Villiers Island, a new neighbourhood surrounded by water. When complete, the Port Lands will add an entirely new district to the city.\n\nFuture transit plans for the Port Lands include extensions of the waterfront streetcar network and potential connections to the Ontario Line and East Harbour transit hub. Currently, the area is accessible via Cherry Street and the existing streetcar network. The East Harbour development immediately to the north will serve as the transit gateway to the Port Lands.\n\nPre-construction in the Port Lands is in its earliest stages, with Villiers Island expected to deliver its first residential phases in the coming years. This is a long-term investment opportunity for buyers who want to get in at the ground floor of what will eventually be one of North America\'s most significant waterfront communities. The combination of parks, a renaturalized river, mixed-use development, and waterfront access makes the Port Lands a compelling bet on Toronto\'s future.'
  },
  {
    name: 'Mississauga',
    slug: 'mississauga',
    region: 'GTA',
    displayOrder: 24,
    avgPriceStudio: 400000,
    avgPrice1br: 530000,
    avgPrice2br: 750000,
    avgPrice3br: 1050000,
    description: 'Mississauga is the GTA\'s largest suburb and Canada\'s sixth-largest city, with a rapidly urbanizing downtown core centred around Square One Shopping Centre, Celebration Square, and the Mississauga Civic Centre. The city has aggressively pursued transit-oriented development, and the area around Square One is now home to a growing cluster of residential towers that are transforming Mississauga\'s identity from a car-dependent suburb into a genuine urban centre.\n\nTransit is improving significantly with the Hurontario LRT (Hazel McCallion Line) connecting Port Credit on the lakefront to the Brampton Gateway Terminal, with a stop at Square One. GO Transit\'s Lakeshore West and Milton lines provide commuter rail service, and the MiWay bus network covers the city. Highway 403, the QEW, and Highway 401 provide vehicle access, while Pearson International Airport sits at Mississauga\'s northeastern boundary.\n\nPre-construction in Mississauga offers substantial value compared to Toronto, with prices typically 30-40% below equivalent downtown Toronto units. The city\'s waterfront communities in Port Credit and Lakeview are particularly desirable, offering a small-town lakeside feel within a major urban region. Buyers range from first-time purchasers seeking affordability to families wanting more space and investors targeting the strong rental market driven by corporate tenants and airport proximity.'
  },
  {
    name: 'Vaughan',
    slug: 'vaughan',
    region: 'GTA',
    displayOrder: 25,
    avgPriceStudio: 390000,
    avgPrice1br: 510000,
    avgPrice2br: 720000,
    avgPrice3br: 1000000,
    description: 'Vaughan is a rapidly growing city north of Toronto, anchored by the Vaughan Metropolitan Centre (VMC), a new downtown built around the northernmost station on the TTC\'s Line 1 subway extension. The VMC is one of the GTA\'s most ambitious transit-oriented developments, with a cluster of residential and commercial towers rising around the subway station and a new YMCA, library, and public spaces.\n\nTransit connectivity is excellent for a suburban location, with the VMC subway station providing direct service to downtown Toronto in approximately 45 minutes. York Region\'s Viva and YRT bus networks fan out from the VMC across the wider area. Highway 400 and Highway 7 provide vehicle access, and the area is close to Canada\'s Wonderland, the Vaughan Mills shopping centre, and the Kortright Centre for Conservation.\n\nPre-construction in Vaughan is concentrated around the VMC, where prices are significantly below Toronto\'s downtown core while offering genuine subway access. The city also has active development along Highway 7 and in the Concord and Thornhill communities. Buyers include families seeking larger suites, commuters who value the subway connection, and investors attracted by the VMC\'s long-term growth potential as it matures into a true urban centre.'
  },
  {
    name: 'Richmond Hill',
    slug: 'richmond-hill',
    region: 'GTA',
    displayOrder: 26,
    avgPriceStudio: 380000,
    avgPrice1br: 500000,
    avgPrice2br: 710000,
    avgPrice3br: 980000,
    description: 'Richmond Hill is an established suburban community in York Region, located along the Yonge Street corridor north of Toronto. The city blends small-town heritage charm around its historic downtown on Yonge Street with modern development and excellent schools. Richmond Hill\'s diverse population, strong Chinese and Iranian communities, and family-oriented character make it one of the GTA\'s most desirable suburban destinations.\n\nTransit includes GO Transit\'s Richmond Hill line providing commuter rail service to Union Station, and York Region Transit\'s Viva Blue rapid bus service along Yonge Street. The planned Yonge North subway extension will bring TTC Line 1 service to Richmond Hill, a transformative project that is already driving pre-construction activity near the future station locations. Highway 404 and Highway 7 provide vehicle access to the wider GTA.\n\nPre-construction in Richmond Hill is gaining momentum in anticipation of the Yonge North subway extension. Projects near the future subway stations offer strong appreciation potential. The city\'s green spaces, including Mill Pond Park, Richmond Green, and Lake Wilcox Park, provide recreational amenities that appeal to families. Buyers here are typically families and commuters seeking a balance of suburban space, good schools, and improving transit connections to downtown Toronto.'
  },
  {
    name: 'Markham',
    slug: 'markham',
    region: 'GTA',
    displayOrder: 27,
    avgPriceStudio: 380000,
    avgPrice1br: 500000,
    avgPrice2br: 700000,
    avgPrice3br: 980000,
    description: 'Markham is one of Canada\'s most diverse and economically dynamic municipalities, home to a thriving tech sector centred around the IBM, AMD, and Huawei campuses, as well as the Markham Convergence Centre. The city\'s downtown, Markham Centre, is being developed as a new urbanist community with mid-rise and high-rise buildings, while historic Unionville Main Street offers one of the most charming village cores in the GTA.\n\nTransit includes the Stouffville GO line providing commuter rail to Union Station, York Region Transit bus services, and proximity to Highway 404 and Highway 407 for vehicle access. The proposed extension of transit services into Markham Centre will further support the area\'s urbanization and development ambitions.\n\nPre-construction in Markham is concentrated around Markham Centre and the Highway 7 corridor, where transit-oriented developments offer suburban pricing with increasingly urban amenities. The city is particularly popular with families from Chinese, South Asian, and Korean communities, and its schools consistently rank among the best in Ontario. Buyers here are attracted by the combination of cultural familiarity, strong employment prospects, excellent schools, and pre-construction prices that are well below Toronto\'s urban core.'
  },
  {
    name: 'Oakville',
    slug: 'oakville',
    region: 'GTA',
    displayOrder: 28,
    avgPriceStudio: 430000,
    avgPrice1br: 570000,
    avgPrice2br: 830000,
    avgPrice3br: 1200000,
    description: 'Oakville is one of the GTA\'s most affluent and established communities, located along the Lake Ontario shoreline between Mississauga and Burlington. Known for its charming downtown core on Lakeshore Road, excellent schools, heritage harbour, and tree-lined streets, Oakville has traditionally been a single-family home market. However, increasing density along the Kerr Street corridor, near the Oakville GO station, and in Bronte Village is bringing condo living to this prestigious community.\n\nTransit is anchored by GO Transit\'s Lakeshore West line, with Oakville, Bronte, and Clarkson stations providing commuter rail to Union Station in approximately 45 minutes. The QEW and Highway 403 provide vehicle access, and Oakville Transit buses serve the local area. The town\'s cycling and trail network, including the waterfront trail, is extensive.\n\nPre-construction in Oakville appeals to downsizers from the surrounding luxury home market, commuters seeking a lakeside lifestyle, and families attracted by the town\'s top-ranked schools and safe, community-oriented atmosphere. Prices are higher than neighbouring Mississauga and Burlington, reflecting Oakville\'s premium reputation and limited supply of new development sites. The town\'s proximity to Sheridan College also supports rental demand.'
  },
  {
    name: 'Burlington',
    slug: 'burlington',
    region: 'GTA',
    displayOrder: 29,
    avgPriceStudio: 390000,
    avgPrice1br: 510000,
    avgPrice2br: 730000,
    avgPrice3br: 1050000,
    description: 'Burlington is a lakeside city at the western edge of the GTA, positioned between Oakville and Hamilton on the shores of Lake Ontario and Burlington Bay. Its revitalized downtown, centred on Brant Street from the GO station to the waterfront, has become a vibrant dining and shopping destination with a small-city charm that draws comparisons to Oakville but at more accessible price points. Spencer Smith Park and the waterfront promenade are the city\'s crown jewels.\n\nGO Transit\'s Lakeshore West line provides commuter rail service from Burlington and Appleby stations to Union Station. The QEW connects to Toronto and Hamilton, and Burlington Transit buses serve the local area. The city is also well-positioned for access to Hamilton\'s emerging tech and healthcare economy and McMaster University.\n\nPre-construction in Burlington is concentrated along the Brant Street corridor and near the GO stations, where transit-oriented development policies are encouraging density. The city offers excellent value within the western GTA corridor, attracting young families, commuters, and downsizers who appreciate the lakefront lifestyle and strong sense of community. Burlington\'s Royal Botanical Gardens, the Art Gallery of Burlington, and the Joseph Brant Museum add cultural depth.'
  },
  {
    name: 'Hamilton',
    slug: 'hamilton',
    region: 'GTA',
    displayOrder: 30,
    avgPriceStudio: 320000,
    avgPrice1br: 420000,
    avgPrice2br: 600000,
    avgPrice3br: 850000,
    description: 'Hamilton is a former steel city experiencing a remarkable renaissance, driven by its arts community, growing tech sector, McMaster University, and some of the most affordable real estate in the Greater Toronto and Hamilton Area. James Street North has become one of Ontario\'s most celebrated arts and dining districts, with monthly Art Crawl events drawing thousands of visitors. The city\'s dramatic setting, bisected by the Niagara Escarpment, provides stunning waterfalls and natural beauty.\n\nGO Transit\'s Lakeshore West line provides commuter rail service from Hamilton GO Centre and West Harbour stations to Union Station, with planned all-day, two-way service improving frequency. The city\'s HSR bus network serves the urban area, and the proposed Hamilton LRT along King Street would add rapid transit. The QEW and Highway 403 provide vehicle access to the wider GTA.\n\nPre-construction in Hamilton offers the most affordable entry point in the GTHA for new-build condos, with prices typically 40-50% below downtown Toronto. The city\'s arts community, waterfall trails, and proximity to wine country in Niagara make it attractive to buyers seeking lifestyle value. Investors are drawn by strong rental yields driven by McMaster University, Mohawk College, and a growing population of Toronto transplants who work remotely or commute via GO Transit.'
  },
  {
    name: 'Brampton',
    slug: 'brampton',
    region: 'GTA',
    displayOrder: 31,
    avgPriceStudio: 360000,
    avgPrice1br: 470000,
    avgPrice2br: 660000,
    avgPrice3br: 920000,
    description: 'Brampton is one of Canada\'s fastest-growing and most diverse cities, located northwest of Toronto in Peel Region. The city\'s downtown core around Queen Street and Main Street is undergoing revitalization, with the Riverwalk project along Etobicoke Creek creating a new urban gathering space. Brampton is home to a major healthcare cluster anchored by Brampton Civic Hospital and William Osler Health System, as well as Sheridan College\'s Davis Campus.\n\nTransit is improving with the Hurontario LRT\'s connection at Gateway Terminal, GO Transit\'s Kitchener and Barrie lines providing commuter rail from Brampton, Mount Pleasant, and Bramalea stations, and Brampton Transit\'s Zum rapid bus service. Highway 410 and Highway 407 provide vehicle access. The proposed extension of rapid transit services into Brampton\'s core is expected to accelerate development.\n\nPre-construction in Brampton offers some of the most affordable pricing in the GTA, making it particularly attractive to first-time buyers and newcomers to Canada. The city\'s young, diverse population drives strong rental demand, and its proximity to Pearson Airport and major distribution centres supports employment. Buyers here are typically value-conscious families and investors who see long-term appreciation potential as the city matures and transit infrastructure improves. Gage Park, Chinguacousy Park, and the Professor\'s Lake recreation area provide family-friendly amenities.'
  },
];

async function seedNeighborhoods() {
  console.log('Seeding neighborhoods...');
  for (const n of NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: n.slug },
      update: { ...n },
      create: { ...n },
    });
  }
  console.log(`  ✓ ${NEIGHBORHOODS.length} neighborhoods seeded`);
}

async function seedProjects() {
  console.log('Seeding projects from database file...');

  const dbPath = path.join(__dirname, '../scripts/toronto-precon-database.md');
  if (!fs.existsSync(dbPath)) {
    console.log('  ⚠ Project database file not found, skipping');
    return;
  }

  const content = fs.readFileSync(dbPath, 'utf-8');
  const neighborhoodMap = await getNeighborhoodMap();
  const developerCache: Record<string, string> = {};
  let projectCount = 0;

  // Split by ## headers to get neighborhood sections
  const sections = content.split(/^## /m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0].trim().replace(/[#*]/g, '').trim();

    // Find table rows (lines starting with |, skip header/separator)
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

      // Resolve neighborhood
      let neighborhoodId: string | null = null;
      const sectionLower = sectionTitle.toLowerCase();
      for (const [nSlug, nId] of Object.entries(neighborhoodMap)) {
        if (sectionLower.includes(nSlug.replace(/-/g, ' ')) || sectionLower.includes(nSlug.replace(/-/g, ''))) {
          neighborhoodId = nId;
          break;
        }
      }

      // Resolve developer
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
          // Duplicate slug, append a suffix
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
    console.log('  ⚠ Blog posts file not found, skipping');
    return;
  }

  const content = fs.readFileSync(blogPath, 'utf-8');
  // Split by post separators
  const posts = content.split(/={3,}\s*POST\s*(BREAK|[0-9]+)\s*={3,}/i).filter((s) => s.trim().length > 100);

  let count = 0;
  for (const postContent of posts) {
    // Extract metadata
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

    // Extract the main content (everything after the metadata block)
    let bodyContent = postContent;
    // Remove metadata lines at the top
    bodyContent = bodyContent.replace(/^\*\*(Meta Title|Meta Description|Target Keyword|Slug)\*\*:.*$/gim, '');
    bodyContent = bodyContent.replace(/^(Meta Title|Meta Description|Target Keyword|Slug):.*$/gim, '');
    bodyContent = bodyContent.trim();

    // Generate excerpt from first paragraph after the title
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
    // Also add without hyphens for matching
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
