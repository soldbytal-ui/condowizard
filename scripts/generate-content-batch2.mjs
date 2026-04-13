// Batch 2: Structured content for remaining 19 featured projects
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const CONTENT = {
  'sq2-condos': {
    metaTitle: 'SQ2 Condos | Pre-Construction Queen West Toronto',
    metaDescription: 'SQ2 Condos at 39 Augusta Ave — 14-storey boutique condo in Queen West by Tridel. Steps from the AGO, OCAD, and Dundas West.',
    description: JSON.stringify({
      about: 'SQ2 is a boutique 14-storey condominium at 39 Augusta Avenue, the second phase of Tridel\'s SQ development in the heart of Queen West. The intimate scale reflects the neighbourhood\'s artistic character, with design-forward interiors and curated amenity spaces. Unit layouts prioritize open-concept living with oversized windows framing the vibrant streetscape below.',
      location: 'SQ2 is steps from the Art Gallery of Ontario, OCAD University, and the Queen West gallery district. Dundas West is a short walk north, with St. Patrick TTC station (Line 1) a 5-minute walk east. The neighbourhood is one of Toronto\'s most walkable, with a Walk Score consistently above 95. Kensington Market, Trinity Bellwoods Park, and the Ossington strip are all within a 10-minute walk.',
      investment: 'Queen West consistently ranks among Toronto\'s most desirable neighbourhoods, commanding premium prices per square foot. The area\'s cultural cachet attracts both young professionals and investors seeking strong rental yields. Boutique buildings like SQ2 tend to hold value well due to limited supply and high demand in the neighbourhood.',
      developer: 'Tridel is Canada\'s leading condominium developer with over 85 years of experience and more than 90,000 homes built. Known for build quality and customer service, their portfolio includes Via Bloor, Ten York, and the award-winning Aquavista project. Tridel is consistently ranked among the GTA\'s most trusted builders.',
    }),
    faqJson: JSON.stringify([
      { question: 'Where is SQ2 Condos located?', answer: 'SQ2 is at 39 Augusta Avenue in the Queen West neighbourhood, steps from the AGO and Kensington Market.' },
      { question: 'Who is the developer of SQ2?', answer: 'Tridel, Canada\'s leading condo developer with 85+ years of experience.' },
      { question: 'What transit is nearby?', answer: 'St. Patrick Station (Line 1) is a 5-minute walk. The Queen and Dundas streetcars are steps away.' },
    ]),
  },
  'via-bloor': {
    metaTitle: 'Via Bloor | Pre-Construction Bloor West Toronto',
    metaDescription: 'Via Bloor by Tridel at 1 Valhalla Inn Rd — 28-storey tower near Kipling Station with direct subway access. Suites from the mid-$400Ks.',
    description: JSON.stringify({
      about: 'Via Bloor is a transit-oriented condominium development by Tridel located at 1 Valhalla Inn Road. The project offers a collection of thoughtfully designed suites in a 28-storey tower with a comprehensive amenity package including fitness centre, party room, co-working lounge, and landscaped outdoor terraces.',
      location: 'Via Bloor benefits from exceptional transit connectivity — Kipling Station (Line 2 Bloor-Danforth and Mississauga MiWay terminal) is adjacent. The Kipling GO Station provides regional rail access. Residents are minutes from the Queensway shopping corridor, Humber Bay Park, and the Martin Grove Road retail area. Highway 427 provides quick access to Pearson Airport.',
      investment: 'Transit-oriented developments near subway stations consistently outperform the broader market. Via Bloor\'s proximity to Kipling Station — a major transit hub connecting TTC, GO Transit, and MiWay — provides a strong foundation for both end-user demand and rental yields. The area is seeing significant new development activity.',
      developer: 'Tridel has been building condominiums in the GTA for over 85 years. Their commitment to sustainability (LEED certifications), build quality, and homeowner satisfaction has made them the most recognized condo brand in Canada. Recent projects include Ten York, Bianca, and the Via Bloor series.',
    }),
    faqJson: JSON.stringify([
      { question: 'What transit is near Via Bloor?', answer: 'Kipling Station (Line 2) and Kipling GO Station are directly adjacent, plus MiWay bus terminal.' },
      { question: 'Who is building Via Bloor?', answer: 'Tridel, Canada\'s most recognized condominium developer.' },
    ]),
  },
  'park-place': {
    metaTitle: 'Park Place | Pre-Construction Scarborough by Tridel',
    metaDescription: 'Park Place at 814 Brimley Rd Scarborough — 50-storey tower by Tridel in the Scarborough Centre renewal area. Near SRT/future subway extension.',
    description: JSON.stringify({
      about: 'Park Place is a significant 50-storey residential tower by Tridel at 814 Brimley Road in Scarborough Centre. The project is part of the broader Scarborough Centre renewal, bringing a new standard of condominium living to this emerging transit hub. Residents will enjoy views of the surrounding neighbourhood and a full suite of modern amenities.',
      location: 'Located in Scarborough Centre, Park Place is near the Scarborough Town Centre mall and the future Scarborough Centre subway station (Line 2 extension). Kennedy Station (Line 2 and future Line 3 replacement) is nearby via bus. The area is served by multiple TTC bus routes and is close to Highway 401 for regional access.',
      investment: 'Scarborough Centre is one of the GTA\'s most significant urban renewal areas. The confirmed Scarborough Subway Extension (SSE) will bring Line 2 directly to the neighbourhood, which historically drives substantial property value increases. Current pricing represents a significant discount to downtown Toronto, offering upside potential.',
      developer: 'Tridel brings its 85+ year track record to Scarborough with Park Place, demonstrating confidence in the area\'s growth trajectory. Tridel\'s reputation for quality construction and after-sales service provides buyers with security in an emerging market.',
    }),
    faqJson: JSON.stringify([
      { question: 'Is the Scarborough subway confirmed?', answer: 'Yes, the Scarborough Subway Extension is under construction and will extend Line 2 to Scarborough Centre.' },
    ]),
  },
  'novo-condos': {
    metaTitle: 'Novo Condos | Pre-Construction North York Toronto',
    metaDescription: 'Novo Condos at 260 Doris Ave — 28-storey tower in North York by Pinnacle International. Steps from North York Centre Station.',
    description: JSON.stringify({
      about: 'Novo Condos is a 28-storey residential tower at 260 Doris Avenue in the heart of North York Centre. Developed by Pinnacle International, the project offers modern suites with efficient layouts and a comprehensive amenity program including fitness centre, social lounge, and rooftop terrace with panoramic views.',
      location: 'Novo is steps from North York Centre TTC Station (Line 1 Yonge-University), providing direct subway access to downtown in under 20 minutes. The Yonge Street corridor offers extensive retail and dining options. Mel Lastman Square, the Toronto Centre for the Arts, and the North York Central Library are within walking distance. Finch Station and the future Yonge North Subway Extension are nearby.',
      investment: 'North York Centre is a designated urban growth centre with significant intensification plans. The Yonge North Subway Extension to Richmond Hill will further enhance transit accessibility. Condos near Line 1 stations consistently command strong rental demand from young professionals and newcomers to Canada.',
      developer: 'Pinnacle International is a Vancouver-based developer with a strong Toronto presence, including the landmark Pinnacle One Yonge and L Tower projects. Known for large-scale, transit-oriented developments.',
    }),
    faqJson: JSON.stringify([
      { question: 'What station is near Novo Condos?', answer: 'North York Centre Station (Line 1) is a 2-minute walk.' },
    ]),
  },
  'sky-condos': {
    metaTitle: 'Sky Condos | Pre-Construction North York Toronto',
    metaDescription: 'Sky Condos at 808 Empress Walk North York — 28-storey tower by Canderel near North York Centre Station.',
    description: JSON.stringify({
      about: 'Sky Condos is a 28-storey development at 808 Empress Walk in North York Centre by Canderel. The project offers contemporary suites with modern finishes in one of North York\'s most convenient locations, directly connected to the Empress Walk retail complex.',
      location: 'Sky Condos is adjacent to the Empress Walk shopping centre and steps from North York Centre TTC Station (Line 1). Residents have direct indoor access to shopping, dining, and transit. Mel Lastman Square and the Yonge Street corridor are at the doorstep. The neighbourhood offers an urban lifestyle with suburban convenience.',
      investment: 'North York Centre continues to densify around the Yonge subway corridor. Empress Walk\'s direct connection to transit and retail makes Sky Condos particularly attractive for rental investors. The upcoming Yonge North Subway Extension adds further long-term value to properties along the Line 1 corridor.',
      developer: 'Canderel is one of Canada\'s largest real estate companies with over 45 years of experience. Their diversified portfolio spans residential, commercial, and mixed-use developments across the country.',
    }),
    faqJson: JSON.stringify([
      { question: 'Is Sky Condos connected to transit?', answer: 'Yes, it connects to Empress Walk which provides covered access to North York Centre Station (Line 1).' },
    ]),
  },
  'galleria-on-the-park': {
    metaTitle: 'Galleria on the Park | Pre-Construction Dupont Toronto',
    metaDescription: 'Galleria on the Park at 1245 Dupont St — massive 8-tower master plan in Wallace Emerson by ELAD Canada. New park, community centre, and condos.',
    description: JSON.stringify({
      about: 'Galleria on the Park is one of Toronto\'s most ambitious master-planned communities, transforming the former Galleria Shopping Centre at 1245 Dupont Street into an 8-tower mixed-use neighbourhood. The project includes approximately 2,800 residential units, a new 1.5-acre public park, a community centre, a public library, and ground-floor retail. Designed by a team of architects, the development reimagines an entire city block.',
      location: 'Situated at Dupont and Dufferin, Galleria on the Park is in the Wallace Emerson neighbourhood. Dufferin Station (Line 2) is a 10-minute walk south, and the area is served by the Dufferin bus (29) and Dupont bus (26). The Dupont Street corridor is rapidly evolving with new restaurants, cafés, and creative businesses. Wallace-Emerson Community Centre and Bickford Park are nearby.',
      investment: 'Galleria on the Park represents a generational transformation of an underutilized site. The project\'s scale creates its own micro-neighbourhood, which historically drives strong appreciation as each phase completes. Early-phase buyers benefit from pre-construction pricing before the community\'s full amenities are realized.',
      developer: 'ELAD Canada is the developer behind Galleria on the Park. Part of the global ELAD Group, they specialize in large-scale urban regeneration projects.',
    }),
    faqJson: JSON.stringify([
      { question: 'How many towers will Galleria on the Park have?', answer: 'The master plan includes approximately 8 towers with around 2,800 residential units.' },
      { question: 'Will there be a park?', answer: 'Yes, a new 1.5-acre public park, community centre, and public library are included in the plan.' },
    ]),
  },
  'm-city-condos': {
    metaTitle: 'M City Condos | Pre-Construction Mississauga City Centre',
    metaDescription: 'M City at 3980 Confederation Pkwy Mississauga — 60-storey tower in Mississauga City Centre by Rogers Real Estate. Near Square One and future LRT.',
    description: JSON.stringify({
      about: 'M City is a multi-tower master-planned community at 3980 Confederation Parkway in Mississauga City Centre. The tallest tower rises 60 storeys, making it one of the tallest buildings outside Toronto. Designed by IBI Group, M City offers a range of suite types with modern finishes and expansive amenity spaces across multiple buildings.',
      location: 'M City is in Mississauga City Centre, steps from Square One Shopping Centre (one of Canada\'s largest malls) and Mississauga Celebration Square. The Mississauga Transitway provides rapid transit to the Cooksville GO Station and connecting bus routes. The future Hurontario LRT will enhance transit access. Highways 403 and QEW provide regional connections.',
      investment: 'Mississauga City Centre is the fastest-growing urban centre in Peel Region. The Hurontario LRT (under construction) will transform transit accessibility. Square One\'s ongoing expansion and the city\'s population growth support strong demand. Prices remain well below downtown Toronto, offering value-oriented investment.',
      developer: 'M City is developed by Rogers Real Estate Development Limited, building on the Rogers family\'s long history of Mississauga land holdings. The project represents one of the most significant private developments in Mississauga\'s history.',
    }),
    faqJson: JSON.stringify([
      { question: 'How tall is the tallest M City tower?', answer: 'The tallest tower is approximately 60 storeys.' },
      { question: 'Is there an LRT coming to the area?', answer: 'Yes, the Hurontario LRT is under construction and will serve the Mississauga City Centre area.' },
    ]),
  },
  'lakeside-residences': {
    metaTitle: 'Lakeside Residences | Pre-Construction Etobicoke Waterfront',
    metaDescription: 'Lakeside Residences at 215 Lake Shore Blvd W — waterfront living in Humber Bay by Greenland Group. Steps from Lake Ontario.',
    description: JSON.stringify({
      about: 'Lakeside Residences is a 48-storey waterfront condominium at 215 Lake Shore Blvd West in the Humber Bay Shores community. Developed by Greenland Group, the tower offers panoramic views of Lake Ontario and the Toronto skyline. Suites feature floor-to-ceiling windows and premium finishes, with amenities including a rooftop pool deck, fitness centre, and waterfront terrace.',
      location: 'Situated on Lake Shore Boulevard West, Lakeside Residences is steps from the Martin Goodman waterfront trail and Humber Bay Park. The neighbourhood is served by the 501 Queen and 504 King streetcars. Park Lawn GO Station (Lakeshore West line) provides direct service to Union Station. Highway 427 is nearby for regional access. The area offers a lakeside lifestyle minutes from downtown.',
      investment: 'Humber Bay Shores has transformed into one of Toronto\'s most active residential communities. Waterfront properties consistently command premium values. The neighbourhood benefits from excellent park access, views, and improving transit connections. The future Ontario Line connection and Lakeshore West GO service improvements will further enhance accessibility.',
      developer: 'Greenland Group is one of China\'s largest state-owned real estate developers, with projects spanning over 100 cities worldwide. Their Toronto portfolio includes the King Blue Hotel & Condos at King and Blue Jays Way.',
    }),
    faqJson: JSON.stringify([
      { question: 'Is Lakeside Residences on the waterfront?', answer: 'Yes, it is located on Lake Shore Blvd W with views of Lake Ontario and direct access to the waterfront trail.' },
    ]),
  },
  'e2-condos': {
    metaTitle: 'E2 Condos | Pre-Construction Yonge-Eglinton Toronto',
    metaDescription: 'E2 Condos at 2400 Yonge St — 56-storey tower in Yonge-Eglinton. Steps from Eglinton Station and the future Eglinton Crosstown LRT.',
    description: JSON.stringify({
      about: 'E2 Condos is a striking 56-storey tower at 2400 Yonge Street in the Yonge-Eglinton neighbourhood. The project offers modern suites with premium finishes in one of Toronto\'s most vibrant midtown locations. Amenities include a fitness centre, yoga studio, rooftop terrace, co-working spaces, and a party room.',
      location: 'E2 is in the heart of Yonge-Eglinton, steps from Eglinton TTC Station (Line 1) and the future Eglinton Crosstown LRT (Line 5). The neighbourhood\'s "Young and Eligible" reputation reflects its popularity with professionals. Yonge Street retail, Eglinton Park, and the Yonge-Eglinton Centre shopping complex are at the doorstep.',
      investment: 'Yonge-Eglinton is being transformed by the Eglinton Crosstown LRT, a $12.8-billion rapid transit project that will create a new east-west transit spine. Properties near the intersection of two rapid transit lines historically see the strongest appreciation. The neighbourhood already commands premium midtown pricing.',
      developer: 'Details to be announced. The project benefits from its prime location at one of Toronto\'s most important transit intersections.',
    }),
    faqJson: JSON.stringify([
      { question: 'What transit serves E2 Condos?', answer: 'Eglinton Station (Line 1) is steps away, plus the future Eglinton Crosstown LRT (Line 5) stop at the doorstep.' },
    ]),
  },
  '8-elm': {
    metaTitle: '8 Elm | Pre-Construction Downtown Toronto',
    metaDescription: '8 Elm at 8 Elm St — 56-storey tower in the heart of downtown Toronto. Steps from Dundas Station and the Eaton Centre.',
    description: JSON.stringify({
      about: '8 Elm is a 56-storey condominium at 8 Elm Street in downtown Toronto. Rising from the city\'s core, the tower offers modern suites with efficient layouts and views of the surrounding urban landscape. The building includes a comprehensive amenity package designed for urban professionals.',
      location: 'Located on Elm Street between Yonge and Bay, 8 Elm is steps from Dundas TTC Station (Line 1), the Toronto Eaton Centre, and Toronto Metropolitan University (formerly Ryerson). The neighbourhood is one of the most connected in the city — College, Dundas, and Queen stations are all within a 5-minute walk. Hospital Row (SickKids, Mount Sinai, Toronto General) is a short walk west.',
      investment: 'Downtown core condominiums near Yonge Street consistently outperform the broader market. The density of employment, entertainment, and transit in this location ensures strong and stable rental demand. Proximity to Toronto Metropolitan University provides additional demand from students and faculty.',
      developer: 'Details to be announced. The project\'s premium downtown location at Yonge and Elm makes it one of the most transit-accessible developments in the city.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is the nearest subway station?', answer: 'Dundas Station (Line 1) is a 1-minute walk. College and Queen stations are also within 5 minutes.' },
    ]),
  },
  '55-mercer': {
    metaTitle: '55 Mercer | Pre-Construction King West Toronto',
    metaDescription: '55 Mercer at 55 Mercer St — 48-storey tower in King West Toronto. Steps from St. Andrew Station and the Entertainment District.',
    description: JSON.stringify({
      about: '55 Mercer is a 48-storey residential tower at 55 Mercer Street in the King West neighbourhood. The building offers contemporary suites with open layouts and floor-to-ceiling windows, positioned in one of Toronto\'s most dynamic urban districts. Amenities are designed for the neighbourhood\'s active lifestyle.',
      location: '55 Mercer is in the heart of the Entertainment District, steps from Roy Thomson Hall, TIFF Bell Lightbox, and the King West restaurant row. St. Andrew TTC Station (Line 1) is a 5-minute walk. The King streetcar (504) runs directly on King Street, and Union Station is accessible within 10 minutes on foot. The Financial District is immediately east.',
      investment: 'King West is one of Toronto\'s most liquid real estate markets with consistently strong rental demand from entertainment and finance professionals. The neighbourhood commands some of the highest price-per-square-foot values in the city. Short-term rental demand from tourists and business travellers adds additional income potential.',
      developer: 'Details to be announced. 55 Mercer benefits from a premium Entertainment District location between King and Wellington Streets.',
    }),
    faqJson: JSON.stringify([
      { question: 'Where is 55 Mercer located?', answer: '55 Mercer Street in King West, steps from Roy Thomson Hall and TIFF Bell Lightbox.' },
    ]),
  },
  '308-queen': {
    metaTitle: '308 Queen | Pre-Construction Leslieville Toronto',
    metaDescription: '308 Queen at 308 Queen St E — 35-storey tower in Leslieville. Near Regent Park revitalization and the future Ontario Line.',
    description: JSON.stringify({
      about: '308 Queen is a 35-storey condominium at 308 Queen Street East in the evolving Leslieville-Regent Park corridor. The project brings modern urban living to one of Toronto\'s fastest-changing neighbourhoods, with suites designed for city living and amenities that cater to a diverse community.',
      location: '308 Queen is on the Queen streetcar (501) route, providing east-west transit across the city. The future Ontario Line will add rapid transit to the neighbourhood. The area is surrounded by the Regent Park revitalization, the Distillery District, Corktown, and the growing East Bayfront. Riverside farmers market and the Don River trail system are nearby.',
      investment: 'The Regent Park revitalization is one of Canada\'s largest urban renewal projects, driving significant property value appreciation in surrounding areas. The confirmed Ontario Line will add a new rapid transit connection. Current pricing reflects an opportunity to buy into a rapidly improving neighbourhood below peak values.',
      developer: 'Details to be announced.',
    }),
    faqJson: JSON.stringify([
      { question: 'What transit is near 308 Queen?', answer: 'The 501 Queen streetcar runs on the doorstep. The future Ontario Line will add rapid transit to the area.' },
    ]),
  },
  '36-birch': {
    metaTitle: '36 Birch | Pre-Construction Leslieville Toronto',
    metaDescription: '36 Birch at 36 Birch Ave Leslieville — boutique 10-storey building in Toronto\'s east-end creative district.',
    description: JSON.stringify({
      about: '36 Birch is a boutique 10-storey condominium at 36 Birch Avenue in Leslieville. The intimate scale respects the neighbourhood\'s low-rise character while offering modern urban living. The building is designed to complement Leslieville\'s creative, community-oriented atmosphere.',
      location: 'Leslieville is one of Toronto\'s most charming east-end neighbourhoods, known for its indie shops, restaurants, and family-friendly atmosphere along Queen Street East. The 501 Queen streetcar provides direct access across the city. Greenwood Park, Ashbridge\'s Bay, and the eastern beaches are nearby. The Distillery District is a short ride west.',
      investment: 'Leslieville has seen strong and sustained price appreciation over the past decade. Boutique buildings command a premium due to limited supply and the neighbourhood\'s strong community identity. The area\'s popularity with young families and creatives ensures diverse rental demand.',
      developer: 'Details to be announced.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is the character of Leslieville?', answer: 'Leslieville is a vibrant east-end neighbourhood known for indie shops, cafés, restaurants, and a creative community along Queen Street East.' },
    ]),
  },
  'artworks-tower': {
    metaTitle: 'Artworks Tower | Pre-Construction Regent Park Toronto',
    metaDescription: 'Artworks Tower at 75 Regent Park Blvd — 32 storeys in the revitalized Regent Park by Daniels Corporation.',
    description: JSON.stringify({
      about: 'Artworks Tower is a 32-storey condominium at 75 Regent Park Boulevard, part of the landmark Regent Park revitalization — one of the largest urban renewal projects in Canadian history. The development transforms former public housing into a vibrant mixed-income, mixed-use community with modern condos, townhomes, parks, and cultural facilities.',
      location: 'Regent Park is centrally located between the Distillery District, Corktown, and Cabbagetown. The neighbourhood is served by the Dundas streetcar (505) and is a 10-minute walk from Castle Frank Station (Line 2). The Regent Park Aquatic Centre and community facilities are steps away. The Daniels Spectrum cultural hub hosts art exhibitions and performances.',
      investment: 'Regent Park\'s revitalization has driven significant appreciation for early buyers. The community is being built in phases, with each phase adding amenities and infrastructure that increase the value of existing units. The central location and improving transit (future Ontario Line nearby) support long-term growth.',
      developer: 'Daniels Corporation is the master developer of the Regent Park revitalization, partnering with Toronto Community Housing Corporation. Daniels is known for their community-focused approach and have delivered over 35,000 homes across the GTA.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is the Regent Park revitalization?', answer: 'It\'s one of Canada\'s largest urban renewal projects, transforming former public housing into a mixed-income, mixed-use community with new parks, cultural facilities, and modern condos.' },
    ]),
  },
  'brightwater': {
    metaTitle: 'Brightwater | Pre-Construction Port Credit Mississauga',
    metaDescription: 'Brightwater at 70 Mississauga Rd S — waterfront community in Port Credit by Kilmer Group, Dream, and FRAM + Slokker.',
    description: JSON.stringify({
      about: 'Brightwater is a transformative 72-acre waterfront community on the former Imperial Oil lands in Port Credit, Mississauga. The master-planned development will include approximately 2,500 residential units across mid-rise and low-rise buildings, along with parks, retail, a cultural hub, and a revitalized waterfront promenade. The design emphasizes sustainable, connected living.',
      location: 'Brightwater is located on the Lake Ontario waterfront in Port Credit, one of Mississauga\'s most charming village-style communities. Port Credit GO Station (Lakeshore West line) provides direct service to Union Station in approximately 35 minutes. The area is known for its marina, restaurants along Lakeshore Road, and the Credit River trail system.',
      investment: 'Waterfront land in the GTA is increasingly scarce, making Brightwater a rare opportunity. Port Credit\'s village character and GO Transit access make it one of the most desirable communities in Mississauga. The project\'s scale and master-plan approach support long-term value creation as the community matures.',
      developer: 'Brightwater is a joint venture between Kilmer Group, Dream Unlimited, and FRAM + Slokker. This partnership brings together expertise in large-scale community building, sustainable development, and urban design.',
    }),
    faqJson: JSON.stringify([
      { question: 'Where is Brightwater?', answer: 'On the Lake Ontario waterfront in Port Credit, Mississauga — the former Imperial Oil lands at 70 Mississauga Road South.' },
      { question: 'How do you get to Toronto from Brightwater?', answer: 'Port Credit GO Station provides Lakeshore West GO service to Union Station in approximately 35 minutes.' },
    ]),
  },
  'line-5-condos': {
    metaTitle: 'Line 5 Condos | Pre-Construction Eglinton East Toronto',
    metaDescription: 'Line 5 Condos at 2175 Eglinton Ave E — 34-storey tower on the Eglinton Crosstown LRT. Named after the new Line 5.',
    description: JSON.stringify({
      about: 'Line 5 Condos is a 34-storey condominium at 2175 Eglinton Avenue East, named after the Eglinton Crosstown LRT (Line 5) — Toronto\'s newest rapid transit line. The project is designed to capitalize on the transformative transit investment along Eglinton Avenue, offering modern suites with convenient access to the new LRT.',
      location: 'Located on Eglinton Avenue East, the project is near a future Line 5 Eglinton Crosstown LRT stop. The LRT will provide rapid east-west transit across midtown Toronto, connecting to the Yonge-University subway (Line 1) at Eglinton Station. The neighbourhood is evolving with new development along the Eglinton corridor.',
      investment: 'The Eglinton Crosstown LRT represents a $12.8-billion transit investment that is reshaping property values along the entire corridor. Properties within walking distance of new LRT stations are expected to see above-average appreciation. Line 5 Condos is positioned to benefit directly from this infrastructure transformation.',
      developer: 'Details to be announced.',
    }),
    faqJson: JSON.stringify([
      { question: 'What is Line 5?', answer: 'Line 5 is the Eglinton Crosstown LRT — a 19-kilometre rapid transit line running along Eglinton Avenue, currently under construction.' },
    ]),
  },
  'oak-and-co-condos': {
    metaTitle: 'Oak & Co Condos | Pre-Construction Oakville',
    metaDescription: 'Oak & Co at 690 North Service Rd Oakville — 26-storey tower near Oakville GO Station. Modern living in Halton Region.',
    description: JSON.stringify({
      about: 'Oak & Co Condos is a 26-storey residential tower at 690 North Service Road in Oakville. The project offers modern suites with premium finishes and a comprehensive amenity package, bringing urban condominium living to one of the GTA\'s most prestigious suburban communities.',
      location: 'Oak & Co is near Oakville GO Station, providing Lakeshore West GO service to Union Station in approximately 40 minutes. The location offers easy access to the QEW for regional driving. Downtown Oakville\'s Lakeshore Road boutiques, restaurants, and waterfront are a short drive south. Sheridan College\'s Trafalgar Road campus is nearby.',
      investment: 'Oakville consistently ranks as one of Canada\'s most desirable communities. The town\'s excellent schools, green spaces, and proximity to Toronto attract families and professionals. Condo development in Oakville is relatively limited, which supports pricing and demand for well-located projects.',
      developer: 'Details to be announced.',
    }),
    faqJson: JSON.stringify([
      { question: 'How far is Oakville from Toronto?', answer: 'Oakville GO Station provides service to Union Station in approximately 40 minutes via Lakeshore West GO Transit.' },
    ]),
  },
  '65-new': {
    metaTitle: '65 New | Pre-Construction Vaughan by Concord',
    metaDescription: '65 New at 65 New Park Pl Vaughan — 73-storey tower by Concord Adex in the Vaughan Metropolitan Centre.',
    description: JSON.stringify({
      about: '65 New is a striking 73-storey tower at 65 New Park Place in the Vaughan Metropolitan Centre (VMC) by Concord Adex. As one of the tallest towers in York Region, it makes a bold architectural statement in the rapidly developing VMC district. The project offers a range of suites with modern finishes and premium amenities.',
      location: 'The Vaughan Metropolitan Centre is a new urban downtown anchored by the VMC subway station on Line 1 (Yonge-University extension). Residents have direct subway access to downtown Toronto. The IKEA-anchored retail district, SmartCentres Place, and the future Vaughan hospital are nearby. Highway 400 and Highway 7 provide regional road access.',
      investment: 'The VMC is York Region\'s most significant urban development area, centered on the Line 1 subway extension that opened in 2017. The area is still in its early growth phase, offering pricing well below downtown Toronto with direct subway access. Significant office, retail, and institutional development is planned, which will drive future demand and appreciation.',
      developer: 'Concord Adex is one of Canada\'s largest condo developers, known for the massive CityPlace community in downtown Toronto (over 30,000 units). Their investment in the VMC signals confidence in the area\'s long-term growth potential.',
    }),
    faqJson: JSON.stringify([
      { question: 'Does 65 New have subway access?', answer: 'Yes, Vaughan Metropolitan Centre (VMC) Station on Line 1 is steps away, providing direct subway service to downtown Toronto.' },
    ]),
  },
  '39-highway': {
    metaTitle: '39 Highway 7 | Pre-Construction Markham',
    metaDescription: '39 Highway 7 East Markham — a tall tower development on Highway 7 in Markham\'s growing urban corridor.',
    description: JSON.stringify({
      about: '39 Highway 7 is a significant high-rise development at 39 Highway 7 East in Markham. The project brings urban density to Markham\'s evolving Highway 7 corridor, which is being transformed from a suburban strip into a transit-oriented urban avenue. Details on unit types and pricing are to be announced.',
      location: 'Located on Highway 7 in Markham, the project is on the Viva BRT (Bus Rapid Transit) corridor, which provides frequent service across York Region. Highway 7 connects to the Unionville GO Station via local transit. The area is near Pacific Mall, Markham Civic Centre, and the growing Markham Centre district. Highway 404/DVP provides regional road access.',
      investment: 'Markham\'s Highway 7 corridor is designated as a regional intensification area with significant transit investment through Viva BRT. The city\'s growing tech sector (IBM, AMD, Huawei, Lenovo) drives strong employment-based demand. Markham Centre is planned as a new downtown for the city.',
      developer: 'Details to be announced.',
    }),
    faqJson: JSON.stringify([
      { question: 'What transit serves Highway 7 in Markham?', answer: 'York Region\'s Viva BRT provides frequent bus rapid transit service along the Highway 7 corridor.' },
    ]),
  },
};

async function main() {
  console.log('=== Batch 2: Content for 19 featured projects ===\n');
  let updated = 0;
  for (const [slug, content] of Object.entries(CONTENT)) {
    const { data, error } = await supabase.from('projects').update({
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      longDescription: content.description,
      faqJson: content.faqJson,
    }).eq('slug', slug).select('id, name');

    if (data?.length) { updated++; console.log('  ✓ ' + data[0].name); }
    else console.log('  ✗ ' + slug + ': ' + (error?.message || 'not found'));
  }
  console.log('\nUpdated ' + updated + '/' + Object.keys(CONTENT).length + ' projects');
}

main().catch(console.error);
