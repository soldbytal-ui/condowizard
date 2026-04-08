#!/usr/bin/env python3
"""
Comprehensive SEO content update for all neighborhood pages.
- Updates existing 16 neighborhoods with rich SEO content
- Adds 8 new South Florida neighborhoods
- Sets metaTitle, metaDescription, description, lifestyleDescription for all
"""
import json
from urllib.request import Request, urlopen

SUPABASE_URL = "https://fnyrtptmcazhmoztmuay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"

# ============================================================
# EXISTING NEIGHBORHOODS — Full SEO Content Updates
# ============================================================
EXISTING_UPDATES = {
    "brickell": {
        "metaTitle": "New Pre-Construction Condos in Brickell 2025-2028 | Prices & Floor Plans",
        "metaDescription": "Browse 24+ new pre-construction condos in Brickell, Miami. Compare prices from $500K to $50M+, view floor plans, and explore luxury developments by top developers. Updated weekly.",
        "description": """Brickell is Miami's premier financial district and the epicenter of South Florida's luxury pre-construction condo market. Known as the "Manhattan of the South," this high-rise neighborhood stretches along Biscayne Bay from the Miami River south to Rickenbacker Causeway, offering residents a walkable urban lifestyle surrounded by world-class dining, shopping, and nightlife.

The Brickell pre-construction market is among the most active in the nation, with over 24 new condo developments launching between 2025 and 2028. Landmark projects include the 888 Brickell by Dolce & Gabbana, St. Regis Residences, Cipriani Residences, and the Mercedes-Benz Places — each redefining ultra-luxury living in South Florida.

Brickell's appeal to investors and end-users alike stems from its unmatched walkability, proximity to the Brickell City Centre, Mary Brickell Village, and direct Metrorail access. The neighborhood consistently commands the highest price-per-square-foot for new construction in Miami-Dade County, making it a cornerstone of any South Florida real estate portfolio.

Average pre-construction prices in Brickell range from approximately $800 per square foot for premium developments to over $2,500 per square foot for ultra-luxury branded residences. Most new towers offer one- to four-bedroom layouts, penthouses, and select townhome configurations with private pool decks and panoramic bay views.""",
        "lifestyleDescription": """Living in Brickell means having everything within walking distance. The neighborhood is home to Brickell City Centre — a $1.05 billion mixed-use development with Saks Fifth Avenue, high-end restaurants, and a climate-controlled open-air mall. Mary Brickell Village offers a more local vibe with boutiques and craft cocktail bars.

For outdoor enthusiasts, Simpson Park Hammock and the Underline linear park provide green escapes, while the Brickell Bay waterfront promenade is perfect for morning jogs with skyline views. Dining options range from Michelin-level restaurants like Fiola Miami and Zuma to authentic Latin American cuisine on every block.

Brickell's central location provides quick access to Miami Beach (15 min), Miami International Airport (20 min), Wynwood Arts District (10 min), and Coconut Grove (10 min). The Metrorail and Metromover stations connect Brickell to downtown Miami and beyond without needing a car.""",
    },
    "miami-beach": {
        "metaTitle": "New Pre-Construction Condos in Miami Beach 2025-2028 | Luxury Beachfront",
        "metaDescription": "Discover 20+ new pre-construction condos in Miami Beach. Oceanfront luxury from $1M to $100M+. The Perigon, Aman, Five Park, Shore Club & more. Floor plans available.",
        "description": """Miami Beach is one of the most coveted real estate markets in the world, spanning a 7-mile barrier island between Biscayne Bay and the Atlantic Ocean. From the Art Deco historic district of South Beach to the tranquil residential streets of North Beach, Miami Beach offers an extraordinary range of pre-construction condo opportunities for buyers seeking beachfront luxury.

The current development cycle has attracted the world's most prestigious hospitality brands to Miami Beach, including Aman, The Perigon by OMA/Rem Koolhaas, Ritz-Carlton Residences South Beach, Shore Club Private Collection, and Five Park by Terra Group. These projects represent a generational shift toward ultra-private, amenity-rich oceanfront living.

Miami Beach pre-construction pricing reflects its global appeal: entry-level units in mid-beach towers start around $1.5 million, while premium oceanfront residences in South Beach and Bal Harbour regularly exceed $5,000 per square foot. Penthouse collections at projects like The Perigon and Shore Club are commanding $25M to $100M+.

The island's strict building height restrictions (generally 200 feet or less) ensure low-density living and unobstructed views — a major differentiator from mainland Miami's supertall towers. This scarcity of developable oceanfront land continues to drive strong appreciation for new construction on the beach.""",
        "lifestyleDescription": """Miami Beach living combines year-round outdoor recreation with a world-class cultural scene. Residents enjoy 9 miles of pristine Atlantic beaches, the Miami Beach Boardwalk, Lummus Park, and the oceanfront running/cycling path that stretches from South Pointe to Surfside.

Cultural attractions include the Bass Museum of Art, the Wolfsonian-FIU, the New World Symphony designed by Frank Gehry, and Art Basel Miami Beach — the Western Hemisphere's premier art fair. Lincoln Road Mall offers an open-air pedestrian promenade with dining, galleries, and boutiques.

The island is home to world-renowned restaurants including Joe's Stone Crab, Carbone, and Major Food Group's Contessa. Nightlife ranges from the legendary clubs of South Beach to intimate wine bars on Sunset Harbour. Miami Beach also offers excellent public and private schools, including Miami Beach Senior High and the MAST Academy on Virginia Key.""",
    },
    "downtown-miami": {
        "metaTitle": "New Pre-Construction Condos in Downtown Miami 2025-2028 | Miami Worldcenter",
        "metaDescription": "Explore 15+ new pre-construction condos in Downtown Miami. From Waldorf Astoria's 100-story supertall to E11EVEN Residences. Starting from $400K. Updated pricing.",
        "description": """Downtown Miami is undergoing a historic transformation into a world-class urban center, anchored by the $4 billion Miami Worldcenter — the largest private mixed-use development in the United States outside of Hudson Yards. This 27-acre megaproject is creating an entirely new neighborhood of luxury residences, retail, and entertainment.

The downtown pre-construction pipeline features some of Miami's most ambitious projects. The Waldorf Astoria Residences, designed by Carlos Ott, will rise 100 stories to become Miami's tallest building and the tallest residential tower south of New York City. E11EVEN Hotel & Residences and E11EVEN Residences Beyond bring 24/7 lifestyle living to the Worldcenter district. Legacy Miami Worldcenter, 600 Miami Worldcenter, and Okan Tower add further density and luxury to this rapidly evolving skyline.

Pre-construction prices in Downtown Miami offer exceptional value compared to Brickell and Miami Beach, with entry points starting around $400,000 for studios and one-bedrooms. The area appeals to a younger demographic and international investors seeking strong rental yields, as well as the proximity to the Kaseya Center (Miami Heat), Adrienne Arsht Center for the Performing Arts, and the Pérez Art Museum Miami (PAMM).

Downtown Miami's ongoing infrastructure investments — including the Brightline high-speed rail station connecting to Fort Lauderdale and West Palm Beach — position the neighborhood for significant long-term appreciation.""",
        "lifestyleDescription": """Downtown Miami offers an increasingly vibrant urban lifestyle centered around arts, culture, and entertainment. The Adrienne Arsht Center hosts Broadway shows, the Miami City Ballet, and world-class concerts. Museum Park is home to PAMM and the Phillip and Patricia Frost Museum of Science, both overlooking Biscayne Bay.

The Miami Worldcenter retail promenade is bringing street-level shops and restaurants to what was formerly a car-centric district. Bayfront Park hosts major events including Ultra Music Festival and New Year's Eve celebrations on the waterfront.

Transportation connectivity is a major advantage: the Brightline station provides 30-minute service to Fort Lauderdale and 60-minute service to West Palm Beach, while the Metromover provides free connections throughout downtown, Brickell, and the Arts District. Miami International Airport is a 15-minute drive.""",
    },
    "edgewater": {
        "metaTitle": "New Pre-Construction Condos in Edgewater Miami 2025-2028 | Bayfront Living",
        "metaDescription": "Browse new pre-construction condos in Edgewater, Miami. Bayfront towers from EDITION, Aria Reserve, Villa Miami & more. Prices from $600K. Bay views guaranteed.",
        "description": """Edgewater is Miami's fastest-growing bayfront neighborhood, stretching along the western shore of Biscayne Bay between Downtown Miami and the Design District. Once a quiet residential enclave, Edgewater has emerged as one of South Florida's hottest pre-construction markets, attracting major developers and internationally branded residences.

The neighborhood's transformation is driven by projects like EDITION Residences Edgewater, Aria Reserve (the tallest twin-tower residential development on the East Coast), Villa Miami by Major Food Group, and Cove Miami. These developments capitalize on Edgewater's greatest asset: uninterrupted bay views stretching from the Julia Tuttle Causeway to Key Biscayne.

Edgewater offers a compelling value proposition compared to neighboring Brickell and Miami Beach. Pre-construction prices typically range from $600 to $1,200 per square foot — roughly 30-40% below comparable bayfront product in Brickell. For investors and end-users seeking waterfront living without the ultra-luxury price tag, Edgewater represents one of the best opportunities in the current cycle.

The neighborhood benefits from its central location: equidistant from Wynwood's galleries, the Design District's luxury retail, Brickell's financial hub, and the beaches of Miami Beach via the Julia Tuttle and Venetian Causeways. Margaret Pace Park provides waterfront green space, kayak launches, and tennis courts.""",
        "lifestyleDescription": """Edgewater's lifestyle revolves around bay views and proximity to Miami's most dynamic neighborhoods. Margaret Pace Park anchors the community with waterfront jogging trails, volleyball courts, and stunning sunset views. The neighborhood's flat terrain and Biscayne Boulevard bike lanes make it one of Miami's most bikeable areas.

A growing restaurant scene includes standout spots along the bay, while a short drive or bike ride connects residents to Wynwood's galleries and breweries, the Design District's luxury boutiques (Louis Vuitton, Dior, Prada), and Midtown's casual dining. The weekly Edgewater Farmer's Market brings local produce and artisanal goods.

For families, proximity to the MAST Academy, Design and Architecture Senior High (DASH), and private schools like Cushman School makes Edgewater increasingly attractive beyond the investor crowd.""",
    },
    "sunny-isles-beach": {
        "metaTitle": "New Pre-Construction Condos in Sunny Isles Beach 2025-2028 | Oceanfront Luxury",
        "metaDescription": "Discover luxury pre-construction condos in Sunny Isles Beach. Bentley Residences, St. Regis, and more. Oceanfront towers from $1M. Floor plans & pricing available.",
        "description": """Sunny Isles Beach has earned the nickname "Little Moscow" for its international appeal, but the 2.5-mile barrier island between Golden Beach and Bal Harbour has evolved into one of South Florida's most exclusive pre-construction markets. Today, it attracts a global clientele seeking oceanfront luxury from the world's most prestigious brands.

Current headline projects include Bentley Residences — the world's first Bentley-branded residential tower, featuring a revolutionary car elevator that delivers vehicles directly to each unit's private sky garage. The St. Regis Residences Sunny Isles Beach will bring two soaring 63-story oceanfront towers to the neighborhood, designed by Arquitectonica with interiors by Patricia Anastassiadis.

Pre-construction prices in Sunny Isles Beach generally range from $1 million to $15 million+, with price per square foot between $900 and $2,500 for oceanfront product. The relatively large unit sizes (most 2-4 bedrooms, 1,500-4,500+ sq ft) cater to families and second-home buyers seeking spacious beachfront living.

Sunny Isles offers 435 feet of pristine Atlantic Ocean beach, a family-friendly atmosphere, and proximity to Aventura Mall (10 minutes) and Bal Harbour Shops (5 minutes). The neighborhood's residential character — with minimal commercial development — appeals to buyers seeking tranquility over nightlife.""",
        "lifestyleDescription": """Sunny Isles Beach offers a resort-like lifestyle with a quieter, family-oriented atmosphere compared to Miami Beach. The wide, uncrowded beaches are the neighborhood's greatest asset, complemented by the Newport Fishing Pier and Samson Oceanfront Park.

Dining options include Timo Restaurant, Epicure Gourmet Market, and numerous international cuisines reflecting the neighborhood's diverse community. For shopping, Aventura Mall (one of the largest malls in the U.S.) is a 10-minute drive, while the ultra-luxury Bal Harbour Shops are just 5 minutes south.

The neighborhood provides excellent schools through the Aventura/Sunny Isles educational corridor. Gateway Park and Heritage Park offer playgrounds, basketball courts, and community programming. The Intracoastal Waterway side of the island provides marina access and kayaking opportunities.""",
    },
    "coconut-grove": {
        "metaTitle": "New Pre-Construction Condos in Coconut Grove 2025-2028 | Lush Waterfront Living",
        "metaDescription": "Explore new pre-construction condos in Coconut Grove. Four Seasons, Vita at Grove Isle, OPUS & more. Miami's most charming neighborhood. Prices from $1M.",
        "description": """Coconut Grove is Miami's oldest continuously inhabited neighborhood and arguably its most charming, where canopied banyan trees, waterfront parks, and a bohemian-meets-luxury atmosphere create a residential experience unlike anywhere else in South Florida. The Grove's pre-construction market reflects this uniqueness, with developers favoring boutique, low-rise projects that complement the neighborhood's lush, tropical character.

Headline developments include Four Seasons Private Residences Coconut Grove, Vita at Grove Isle (on the exclusive island enclave), OPUS Coconut Grove, THE WELL Coconut Grove, The Lincoln Coconut Grove, and Arbor Residences. These projects emphasize wellness, green space, and integration with the Grove's natural environment — a stark contrast to the glass-tower density of Brickell and Downtown.

Pre-construction pricing in Coconut Grove ranges from approximately $1 million for two-bedroom units to $10M+ for waterfront penthouses. The average price per square foot for new construction typically falls between $900 and $1,800, reflecting the neighborhood's prestigious address and limited development capacity.

Coconut Grove's appeal extends beyond real estate: the neighborhood offers some of Miami's top-rated public and private schools, including Ransom Everglades, Carrollton School of the Sacred Heart, and Coconut Grove Elementary. For families with children, the Grove is often the first choice among Miami's luxury neighborhoods.""",
        "lifestyleDescription": """Coconut Grove's lifestyle is defined by nature, culture, and community. The neighborhood is anchored by Vizcaya Museum and Gardens — a National Historic Landmark featuring a stunning Italian Renaissance-style villa. Kennedy Park and the David T. Kennedy Park waterfront trail offer bayfront green space, while Barnacle Historic State Park preserves old Florida history.

CocoWalk, recently reimagined as an open-air retail and dining destination, serves as the neighborhood's social hub with restaurants like Brasserie Brickell and Panorama, alongside boutique shopping. The Saturday Coconut Grove Organic Market is a beloved community tradition.

Sailing and boating are integral to Grove life: Dinner Key Marina is one of the largest marinas on the East Coast, and the annual Coconut Grove Sailing Club regattas draw participants from around the world. The Grove also hosts the Coconut Grove Arts Festival, one of the nation's top-ranked outdoor art festivals.""",
    },
    "surfside": {
        "metaTitle": "New Pre-Construction Condos in Surfside 2025-2028 | Boutique Beachfront",
        "metaDescription": "Browse new pre-construction condos in Surfside, FL. Ocean House, Arte, The Surf Club & more. Exclusive boutique beachfront residences from $2M. Limited inventory.",
        "description": """Surfside is a small, exclusive beachfront town sandwiched between Miami Beach and Bal Harbour, known for its village-like atmosphere and some of South Florida's most prestigious new construction. With just 0.44 square miles of land area, Surfside's scarcity of developable parcels makes every new project a rare opportunity.

The Surfside pre-construction market is defined by ultra-luxury boutique developments, including Ocean House Surfside, Arte Surfside (by Alex Sapir, with just 16 residences designed by Antonio Citterio), Surf House at The Surf Club (by the Four Seasons), and The Delmore Surfside. These projects share a common thread: low unit counts, premium materials, and direct oceanfront positioning.

Pricing in Surfside reflects its exclusivity: most pre-construction units start at $2 million and range to $30M+ for penthouses. Price per square foot typically exceeds $1,500 for oceanfront product, comparable to prime Miami Beach locations.

Surfside's transformation was accelerated by the rebuilding efforts following the 2021 Champlain Towers tragedy, which led to significant infrastructure improvements and a renewed focus on building safety standards throughout the community.""",
        "lifestyleDescription": """Surfside offers a rare combination of beachfront living with small-town charm. The town's walkable Harding Avenue corridor features local restaurants, cafes, and shops — a refreshing contrast to the commercial intensity of nearby Miami Beach. The Surfside Community Center hosts events, classes, and an outdoor pool complex.

The beach is wide, uncrowded, and family-friendly, with lifeguard stations and a dedicated turtle nesting program. The Surfside Skatepark and 93rd Street Park provide recreation for families. Bal Harbour Shops — featuring Chanel, Valentino, and top-tier restaurants — is a 5-minute walk north.

Surfside is within the highly-rated Bal Harbour/Surfside K-8 school zone, making it popular with families. The town's strict development standards ensure a residential character, with height restrictions maintaining the beachside village feel.""",
    },
    "hollywood": {
        "metaTitle": "New Pre-Construction Condos in Hollywood FL 2025-2028 | Beach & Boardwalk",
        "metaDescription": "Discover new pre-construction condos in Hollywood, Florida. Oceanfront towers along the iconic Broadwalk. Starting from $500K. Beachfront living at value prices.",
        "description": """Hollywood, Florida sits at the nexus of Miami-Dade and Broward counties, offering 7 miles of pristine Atlantic coastline and one of South Florida's best values in pre-construction beachfront real estate. The city's iconic Hollywood Beach Broadwalk — a 2.5-mile oceanfront promenade — anchors a community that blends resort-style living with authentic neighborhood character.

The Hollywood pre-construction market appeals to buyers seeking beachfront access at prices significantly below Miami Beach and Fort Lauderdale. New developments along the oceanfront and Intracoastal Waterway are delivering modern luxury at entry points starting around $500,000, with premium oceanfront units ranging from $1M to $5M+.

Hollywood's strategic location between Miami and Fort Lauderdale puts residents within 20 minutes of both downtowns, Fort Lauderdale-Hollywood International Airport (10 minutes), and the Aventura Mall (15 minutes). The emerging Hallandale Beach corridor immediately to the south adds complementary dining and entertainment options.

The city has invested heavily in infrastructure improvements including the Hollywood Downtown Master Plan, new public spaces, and enhanced transit connections, positioning Hollywood as one of South Florida's most improving neighborhoods for long-term real estate appreciation.""",
        "lifestyleDescription": """Hollywood's lifestyle centers on its legendary Broadwalk — the 2.5-mile paved promenade along the Atlantic Ocean, perfect for biking, jogging, rollerblading, and people-watching. The wide, sandy beach is one of the most family-friendly in South Florida.

Downtown Hollywood's arts and entertainment district offers a mix of restaurants, galleries, and live music venues along Harrison Street and Hollywood Boulevard. The ArtsPark at Young Circle hosts outdoor concerts, films, and a Saturday Green Market.

For nature lovers, the Anne Kolb Nature Center preserves 1,501 acres of coastal mangrove wetlands with kayak trails and a 4-story observation tower. Hollywood also provides convenient access to the Seminole Hard Rock Hotel & Casino, South Florida's largest entertainment complex.""",
    },
    "aventura": {
        "metaTitle": "New Pre-Construction Condos in Aventura 2025-2028 | Mall-Adjacent Luxury",
        "metaDescription": "Browse new pre-construction condos in Aventura, FL. Avenia by Fendi Casa, Viceroy & more near Aventura Mall. Family-friendly luxury from $600K.",
        "description": """Aventura is an affluent planned city in northeast Miami-Dade County, best known as the home of Aventura Mall — the fifth-largest shopping center in the United States. Beyond its retail fame, Aventura has emerged as a premier destination for luxury pre-construction condos, offering families a suburban feel with urban amenities.

Current pre-construction highlights include Avenia Aventura by Fendi Casa (bringing Italian luxury fashion branding to residential living), Viceroy Residences Aventura, and several boutique waterfront projects along the Intracoastal Waterway. These developments cater to Aventura's core demographic: affluent families seeking space, excellent schools, and resort-style amenities.

Pre-construction pricing in Aventura typically ranges from $600,000 to $3 million+, with per-square-foot prices between $500 and $1,200. Units tend to be larger than comparable Brickell or Downtown products, reflecting the family-oriented market.

Aventura's Don Soffer Exercise Trail — a 3-mile loop around the Turnberry Isle Resort — is one of South Florida's most popular fitness paths. The city's Aventura Arts & Cultural Center, Founders Park, and Waterways Dog Park add community amenities that justify the premium over neighboring North Miami Beach.""",
        "lifestyleDescription": """Aventura living revolves around convenience and family lifestyle. Aventura Mall features 300+ stores including Nordstrom, Bloomingdale's, and a stunning new wing with Givenchy and Balenciaga, plus a food hall and the Aventura Mall Slide Tower sculpture.

The Don Soffer Exercise Trail connects the Turnberry Isle resort to community parks, creating a scenic loop popular with joggers, cyclists, and families. Founders Park offers waterfront access, playgrounds, and the Aventura Waterways Marina.

Aventura's schools are among the best in Miami-Dade County, with Aventura City of Excellence School consistently ranked in the top tier. The city is also home to several houses of worship and cultural organizations serving its diverse international community. Fort Lauderdale-Hollywood International Airport is just 15 minutes away.""",
    },
    "midtown-wynwood": {
        "metaTitle": "New Pre-Construction Condos in Wynwood & Midtown Miami 2025-2028 | Arts District",
        "metaDescription": "Explore new condos in Wynwood & Midtown Miami. NoMad, Frida Kahlo Residences, The Standard & more. Miami's art scene meets luxury living. From $400K.",
        "description": """Midtown and Wynwood together form Miami's creative epicenter — a rapidly evolving district where world-class street art, cutting-edge galleries, and innovative restaurants create one of the most dynamic urban neighborhoods in the United States. The pre-construction market here reflects the area's creative energy, with architecturally distinctive projects targeting a younger, design-savvy demographic.

Notable pre-construction projects include NoMad Wynwood (bringing the celebrated NoMad hospitality brand south), Frida Kahlo Wynwood Residences (a culturally inspired development), The Standard Residences Midtown (lifestyle brand meets residential), Midtown Park Residences by Proper, and Twenty Sixth & 2nd Wynwood. These projects offer an alternative to the corporate glass towers of Brickell, emphasizing character, community, and walkability.

Pre-construction prices in Midtown/Wynwood are among the most accessible in central Miami, with studios starting around $400,000 and two-bedrooms from $600,000 to $1.2 million. Price per square foot ranges from $600 to $1,100, making it attractive for first-time buyers, creative professionals, and investors targeting short-term rental income.

The neighborhood's ongoing maturation from arts district to mixed-use urban village — with new retail, office, and hotel projects complementing residential towers — suggests significant upside for early investors in the current pre-construction cycle.""",
        "lifestyleDescription": """Wynwood is defined by its street art: the Wynwood Walls feature large-scale murals by international artists, and every building facade doubles as a canvas. The monthly Wynwood Art Walk draws thousands of visitors to galleries, pop-up exhibitions, and outdoor installations.

The food and beverage scene is exceptional: Wynwood Marketplace hosts rotating vendors, while standout restaurants include KYU, Alter, and Cvi.che 105. The neighborhood's brewery scene — led by Wynwood Brewing Company and J. Wakefield — has become a destination in itself.

Midtown adds a complementary urban lifestyle with Midtown Miami's mixed-use complex, Target, Publix, and casual dining. The neighborhoods are highly bikeable, with dedicated lanes connecting to the Design District, Edgewater, and downtown. Second Saturday art walks, live music at Oasis Wynwood, and the constant rotation of cultural programming make this one of Miami's most energetic places to call home.""",
    },
    "coral-gables": {
        "metaTitle": "New Pre-Construction Condos in Coral Gables 2025-2028 | The City Beautiful",
        "metaDescription": "Discover new pre-construction condos in Coral Gables, FL. The Village, Alhambra Parc, Ponce Park & more. Mediterranean elegance meets modern luxury. From $800K.",
        "description": """Coral Gables — dubbed "The City Beautiful" — is one of America's first planned communities, founded in the 1920s by George Merrick with Mediterranean Revival architecture, tree-lined boulevards, and lush tropical landscaping. Today, the city's pre-construction market blends this historic character with contemporary luxury, attracting buyers who value elegance, culture, and some of South Florida's strongest public services.

Current developments include The Village at Coral Gables, Alhambra Parc, Ponce Park, CORA at Merrick Park, The Avenue Coral Gables, and Seventeen Gables. These projects honor the city's strict architectural guidelines while delivering modern amenities, with many clustered around the Miracle Mile retail corridor and Shops at Merrick Park.

Pre-construction pricing in Coral Gables ranges from approximately $800,000 for two-bedroom units to $5M+ for premium penthouses. Price per square foot typically falls between $700 and $1,500. The city commands a premium over neighboring areas due to its excellent schools, low crime rates, and protected neighborhood character.

Coral Gables is home to the University of Miami, providing a cultural and economic anchor, along with the Biltmore Hotel — a National Historic Landmark — and the Venetian Pool, a spring-fed swimming hole carved from coral rock in the 1920s.""",
        "lifestyleDescription": """Coral Gables offers a sophisticated, culturally rich lifestyle rooted in its Mediterranean heritage. Miracle Mile and Giralda Avenue form the city's dining and retail heart, with restaurants like Christy's, Seasons 52, and Ortanique on the Mile drawing foodies from across Miami.

The Shops at Merrick Park provide luxury retail (Nordstrom, Neiman Marcus, Gucci) in a beautifully landscaped outdoor setting. Cultural attractions include the Coral Gables Museum, Lowe Art Museum at UM, and year-round festivals including Carnaval on the Mile.

For families, Coral Gables offers top-rated schools including Coral Gables Senior High (an IB World School) and numerous private options. The city maintains 42 parks, the Granada Golf Course, and the historic Venetian Pool. The Riviera Country Club and Coral Gables Country Club provide private club amenities for residents.""",
    },
    "fort-lauderdale": {
        "metaTitle": "New Pre-Construction Condos in Fort Lauderdale 2025-2028 | Venice of America",
        "metaDescription": "Browse new pre-construction condos in Fort Lauderdale. Four Seasons, Pier 66, EDITION & more. Oceanfront and Intracoastal living. Starting from $800K.",
        "description": """Fort Lauderdale — the "Venice of America" for its 165 miles of navigable waterways — has emerged as one of South Florida's most dynamic pre-construction markets. The city's transformation from spring break destination to sophisticated global city is reflected in a wave of luxury developments by world-class operators and architects.

Headline projects include Four Seasons Fort Lauderdale, Pier Sixty-Six Residences (a historic marina resort reimagined), The EDITION Residences Fort Lauderdale, Gale Fort Lauderdale, Riva Fort Lauderdale, and Sixth & Rio. These developments span the oceanfront strip, the Intracoastal corridor, and the revitalized Las Olas/Rio Vista neighborhoods.

Pre-construction pricing in Fort Lauderdale typically ranges from $800,000 to $10M+, offering significant value compared to Miami Beach for comparable beachfront product. Price per square foot ranges from $700 to $1,800 depending on waterfront positioning and brand premium.

Fort Lauderdale's growth is supported by major infrastructure investments including the new Brightline station (providing 30-minute service to Miami), the expanding Fort Lauderdale-Hollywood International Airport, and the ongoing Las Olas Boulevard revitalization. The city's business-friendly environment and lack of state income tax continue to attract Northeast transplants and international buyers.""",
        "lifestyleDescription": """Fort Lauderdale offers a laid-back yet sophisticated waterfront lifestyle. Las Olas Boulevard is the city's crown jewel — a tree-lined corridor of galleries, restaurants, boutiques, and sidewalk cafes stretching from downtown to the beach. Fort Lauderdale Beach Park and the wave wall promenade provide a stunning oceanfront setting.

Boating is central to Fort Lauderdale life: the city hosts the Fort Lauderdale International Boat Show — the world's largest — and offers more marinas per capita than almost any city in the U.S. The Riverwalk Arts & Entertainment District along the New River features the NSU Art Museum, Broward Center for the Performing Arts, and Huizenga Park.

The dining scene has exploded with spots like Louie Bossi's, Timpano, and Yolo. Hugh Taylor Birch State Park provides 180 acres of nature in the heart of the beach district. Fort Lauderdale's public school system includes highly rated magnet programs, and the city is home to Nova Southeastern University.""",
    },
    "bal-harbour": {
        "metaTitle": "New Pre-Construction Condos in Bal Harbour 2025-2028 | Ultra-Luxury Oceanfront",
        "metaDescription": "Explore ultra-luxury pre-construction condos in Bal Harbour, FL. Rivage Bal Harbour and exclusive developments. Oceanfront living from $3M. Adjacent to Bal Harbour Shops.",
        "description": """Bal Harbour is a tiny, ultra-exclusive village of just 0.27 square miles on the northern tip of Miami Beach's barrier island, renowned worldwide for the Bal Harbour Shops — an open-air luxury retail destination featuring Chanel, Valentino, Gucci, and the finest restaurants in South Florida.

The village's pre-construction market is extremely limited by design. Bal Harbour's strict development controls and minuscule land area mean that new projects like Rivage Bal Harbour represent once-in-a-generation opportunities. When new product does come to market, it commands the highest per-square-foot prices in all of South Florida — routinely exceeding $2,000 to $3,500 per square foot.

Bal Harbour's appeal is its exclusivity: pristine, uncrowded beaches, 24/7 police presence, immaculate public spaces, and a residential population of just 3,000. The village has no nightclubs, no spring breakers, and no commercial intrusion beyond the Shops and a handful of premier hotels including The Ritz-Carlton and St. Regis.

For ultra-high-net-worth buyers seeking the quietest, most exclusive oceanfront address in the greater Miami area, Bal Harbour is the undisputed pinnacle.""",
        "lifestyleDescription": """Bal Harbour living is defined by understated luxury. The Bal Harbour Shops are the centerpiece — not just a shopping destination but a lifestyle hub with Makoto, Carpaccio, and Le Zoo among its dining options. The shops' annual sales per square foot are among the highest in the world.

The beach is impeccably maintained, with dedicated lifeguard service and a quieter atmosphere than neighboring Miami Beach. Haulover Beach Park, immediately north, offers additional recreation including a marina, kite-surfing, and the popular Haulover Park Food Trucks.

Bal Harbour Village is pedestrian-friendly, with most residents walking to the Shops, beach, and restaurants. The village maintains its own police force, ensuring safety and a sense of community. Proximity to Surfside and Miami Beach means additional dining, cultural, and entertainment options are just minutes away.""",
    },
    "key-biscayne": {
        "metaTitle": "New Pre-Construction Condos in Key Biscayne 2025-2028 | Island Paradise",
        "metaDescription": "Browse exclusive pre-construction condos on Key Biscayne. Island living minutes from downtown Miami. Limited new construction on this prestigious barrier island.",
        "description": """Key Biscayne is a prestigious barrier island community accessible via the Rickenbacker Causeway from Brickell, offering an island lifestyle just 15 minutes from downtown Miami. The village's strict development limitations and geographic isolation create a uniquely tranquil residential environment with some of the highest property values in Miami-Dade County.

New construction on Key Biscayne is exceptionally rare due to the island's limited land area and restrictive zoning. When pre-construction opportunities emerge, they command premium pricing — typically $1,500 to $3,000+ per square foot — reflecting the scarcity and desirability of the address.

Key Biscayne's real estate market is dominated by families, often Latin American, drawn to the island's excellent schools (Mast Academy, Key Biscayne K-8 Center), safe streets, and resort-like amenities. The community is home to approximately 14,000 residents who enjoy two world-class state parks, pristine beaches, and a village center with shops and restaurants.

The island offers a unique combination: total residential seclusion with Brickell and Miami Beach easily accessible via the causeway. This "best of both worlds" positioning underpins Key Biscayne's enduring appeal and strong appreciation history.""",
        "lifestyleDescription": """Key Biscayne offers an unmatched island lifestyle within a major metropolitan area. Bill Baggs Cape Florida State Park, at the island's southern tip, features a historic lighthouse, pristine beaches, and some of the best snorkeling in Miami-Dade. Crandon Park Beach — regularly ranked among America's top beaches — offers a mile and a half of wide, palm-lined sand.

The Crandon Park Tennis Center hosts the Miami Open (formerly the Sony Ericsson Open), one of the premier tennis tournaments in the world. The Crandon Park Golf Course provides a championship links-style layout with bay views.

Village Green and the Mashta neighborhood offer a walkable downtown core with restaurants like Rusty Pelican, Lightkeepers at the Ritz-Carlton, and local favorites. The island's bike paths connect parks, schools, and the village center, making it one of the most family-friendly communities in South Florida.""",
    },
    "bay-harbor-islands": {
        "metaTitle": "New Pre-Construction Condos in Bay Harbor Islands 2025-2028 | Hidden Gem",
        "metaDescription": "Discover new pre-construction condos in Bay Harbor Islands. THE WELL, Solina, La Baia & more. South Florida's best-kept secret. Waterfront luxury from $700K.",
        "description": """Bay Harbor Islands is a pair of small residential islands in Biscayne Bay, tucked between Bal Harbour and Surfside, that has quietly become one of South Florida's most active pre-construction markets. This "hidden gem" of 5,600 residents offers waterfront living at prices significantly below neighboring communities.

The development boom in Bay Harbor Islands includes THE WELL Bay Harbor Islands, Solina Bay Harbor, La Baia Bay Harbor, La Mare Bay Harbor Islands, and Bay Harbor Towers. This concentration of new construction is transforming the islands from a sleepy residential community into a boutique luxury destination.

Pre-construction pricing in Bay Harbor Islands typically ranges from $700,000 to $3 million, with per-square-foot prices between $700 and $1,500. This represents a meaningful discount to adjacent Bal Harbour and Surfside, making Bay Harbor one of the best value plays in the greater Miami Beach market.

The islands' walkability is a major draw: residents can walk to Bal Harbour Shops (5 minutes), the beach (10 minutes), and numerous restaurants along Kane Concourse — the islands' main commercial strip. For buyers priced out of Surfside or Bal Harbour who want the same geography and school zones, Bay Harbor Islands offers a compelling alternative.""",
        "lifestyleDescription": """Bay Harbor Islands offers an intimate, community-oriented lifestyle. Kane Concourse serves as the main street, lined with restaurants, cafes, and boutiques. The islands are flat and walkable, making them popular with families and seniors who enjoy a car-optional lifestyle.

The beach is accessible via a short walk through Surfside, and the Indian Creek waterway provides kayaking and paddleboard opportunities. Community parks on both islands offer playgrounds, picnic areas, and a community pool.

Bay Harbor's location is exceptional: Bal Harbour Shops is a 5-minute walk, Aventura Mall is 10 minutes by car, and Miami Beach's restaurants and cultural venues are 15 minutes away. The Ruth K. Broad Bay Harbor K-8 Center is a top-rated school, and the community maintains its own police force.""",
    },
    "palm-beach": {
        "metaTitle": "New Pre-Construction Condos in Palm Beach County 2025-2028 | Gold Coast Luxury",
        "metaDescription": "Explore new pre-construction condos in Palm Beach. Alba Palm Beach and luxury developments on Florida's Gold Coast. Ultra-exclusive living from $2M.",
        "description": """Palm Beach County represents the northern anchor of South Florida's luxury real estate corridor, encompassing the legendary town of Palm Beach, West Palm Beach's revitalized downtown, and surrounding communities like Boca Raton and Jupiter. The area has experienced explosive growth since 2020 as finance, tech, and family office relocations have transformed the market.

Pre-construction projects in Palm Beach County include Alba Palm Beach and several ultra-luxury developments catering to the influx of wealth from the Northeast. The county's development pipeline spans oceanfront mansions, boutique condo towers, and mixed-use urban projects in West Palm Beach's evolving downtown.

Pricing in Palm Beach County varies dramatically by submarket: oceanfront Palm Beach commands $3,000 to $5,000+ per square foot, while West Palm Beach downtown offers entry points around $800 to $1,500 per square foot. Boca Raton and Delray Beach fall somewhere in between, offering beachfront luxury with a more relaxed coastal atmosphere.

The region's appeal is driven by Florida's tax advantages (no state income tax), excellent infrastructure (Palm Beach International Airport, Brightline service to Miami), and a cultural scene that includes the Norton Museum of Art, Kravis Center, and the renowned Worth Avenue shopping district.""",
        "lifestyleDescription": """Palm Beach County living ranges from the old-money elegance of Palm Beach island to the vibrant urbanity of West Palm Beach's Clematis Street. Worth Avenue — Palm Beach's legendary shopping corridor — features international luxury brands in Mediterranean-style courtyards. The Breakers Hotel anchors the island's social scene.

West Palm Beach has undergone a dramatic renaissance: the waterfront district now features the $500 million One West Palm development, Rosemary Square entertainment complex, and a rapidly expanding culinary scene. The Brightline station provides direct service to Miami in 60 minutes.

Outdoor recreation abounds: Palm Beach County offers over 47 miles of coastline, numerous golf courses (including Seminole Golf Club and The Bear's Club), and the Loxahatchee National Wildlife Refuge. The school system includes some of Florida's top-rated public and private institutions.""",
    },
}

# ============================================================
# NEW NEIGHBORHOODS TO ADD
# ============================================================
NEW_NEIGHBORHOODS = [
    {
        "name": "North Bay Village",
        "slug": "north-bay-village",
        "region": "Miami-Dade",
        "displayOrder": 16,
        "metaTitle": "New Pre-Construction Condos in North Bay Village 2025-2028 | Bay Views & Value",
        "metaDescription": "Browse new pre-construction condos in North Bay Village, FL. Emerging waterfront neighborhood between Miami & Miami Beach. Bayfront towers from $500K.",
        "description": """North Bay Village is an emerging pre-construction hotspot situated on a chain of islands in Biscayne Bay, strategically positioned between Miami and Miami Beach via the 79th Street Causeway. This compact community of three islands is undergoing a dramatic transformation from a quiet, under-the-radar enclave into one of South Florida's most exciting new development corridors.

Major developers including Related Group and Shoma Group have identified North Bay Village as the next frontier for bayfront luxury living. The Ritz-Carlton Residences North Bay Village and Continuum Club & Residences represent the neighborhood's evolution toward branded, resort-style residential towers.

Pre-construction prices in North Bay Village offer exceptional value: units start around $500,000 — roughly 40-50% below comparable bayfront product in Miami Beach or Edgewater. This value gap, combined with panoramic bay views and direct causeway access to both Miami and Miami Beach, positions North Bay Village as one of the strongest appreciation plays in the current market cycle.

The neighborhood benefits from its centrality: South Beach is 10 minutes east, Downtown Miami 10 minutes west, and the Design District 10 minutes north. As the development pipeline delivers new retail and restaurant amenities, North Bay Village is expected to establish itself as a distinct lifestyle destination rather than a pass-through.""",
        "lifestyleDescription": """North Bay Village offers a unique island lifestyle with 360-degree bay and skyline views. The community's compact size makes it walkable, and the 79th Street Causeway provides direct access to both Miami and Miami Beach. Pelican Island Park and the community marina offer waterfront recreation.

The neighborhood is home to a growing roster of waterfront restaurants, and the adjacent Upper East Side/MiMo Historic District (on the mainland) adds additional dining, galleries, and boutiques along Biscayne Boulevard.

For boaters, North Bay Village's marina access and proximity to Biscayne Bay, the Intracoastal Waterway, and the Atlantic Ocean make it an ideal home port. The village maintains its own parks, community events, and public safety services.""",
    },
    {
        "name": "Hallandale Beach",
        "slug": "hallandale-beach",
        "region": "Broward",
        "displayOrder": 17,
        "metaTitle": "New Pre-Construction Condos in Hallandale Beach 2025-2028 | Beachfront Value",
        "metaDescription": "Discover new pre-construction condos in Hallandale Beach, FL. Oceanfront luxury at South Florida's best value. Beach living from $400K near Aventura Mall.",
        "description": """Hallandale Beach sits at the Broward-Miami-Dade county line, offering oceanfront living with direct beach access at prices significantly below neighboring Sunny Isles Beach and Hollywood. This emerging market is attracting developers and buyers who recognize the value arbitrage between Hallandale's beachfront product and its pricier neighbors.

Current pre-construction developments include Oasis Hallandale and several oceanfront projects delivering modern luxury residences. The city's 2.4-mile stretch of Atlantic coastline provides ample beachfront for new development, while the western Intracoastal corridor offers additional waterfront opportunities.

Pre-construction prices in Hallandale Beach start around $400,000 — representing one of the lowest entry points for beachfront living in South Florida. Premium oceanfront units range from $800K to $3M+, still at a meaningful discount to comparable product in Sunny Isles (5 minutes north) or Hollywood Beach (5 minutes south).

Hallandale Beach's location provides exceptional access to both Miami-Dade and Broward amenities: Aventura Mall is 10 minutes north, Gulfstream Park (racing and casino) is adjacent, and Fort Lauderdale-Hollywood International Airport is 15 minutes away.""",
        "lifestyleDescription": """Hallandale Beach offers an affordable beachfront lifestyle with proximity to premium amenities. The wide, clean beach is the neighborhood's primary attraction, complemented by the Joseph Scavo Park and community recreation center.

Gulfstream Park Racing & Casino — a world-class entertainment complex — anchors the city's western district with dining, shopping, a bowling alley, and year-round horse racing. The Village at Gulfstream Park adds outdoor retail and restaurant options.

The Hallandale Beach Cultural Community Center hosts art exhibitions and community programming. The city's location at the county line means residents can access both Miami-Dade and Broward county services, parks, and school options.""",
    },
    {
        "name": "Pompano Beach",
        "slug": "pompano-beach",
        "region": "Broward",
        "displayOrder": 18,
        "metaTitle": "New Pre-Construction Condos in Pompano Beach 2025-2028 | Oceanfront Revival",
        "metaDescription": "Explore new pre-construction condos in Pompano Beach, FL. Waldorf Astoria, oceanfront towers & more. The next Fort Lauderdale? Beach living from $500K.",
        "description": """Pompano Beach is experiencing a dramatic oceanfront renaissance, led by marquee projects like Waldorf Astoria Pompano Beach — the first Waldorf-branded residential project in Broward County. The city's strategic position between Fort Lauderdale Beach and Boca Raton, combined with a major municipal reinvestment in its beachfront district, is attracting luxury developers for the first time.

The Pompano Beach pre-construction pipeline includes Solemar Residences, Waldorf Astoria Pompano Beach, and several boutique oceanfront projects. The city's Fisher Family Pier renovation and Atlantic Boulevard streetscape improvements have transformed the beachfront from dated to destination-worthy.

Pre-construction pricing in Pompano Beach starts around $500,000 for ocean-adjacent units and ranges to $3M+ for direct oceanfront product. These prices represent a 30-50% discount compared to Fort Lauderdale Beach, making Pompano one of the last truly affordable beachfront markets in South Florida.

Market watchers frequently cite Pompano Beach as "the next Fort Lauderdale" — a reference to Fort Lauderdale's own transformation from spring break haven to luxury destination over the past two decades. Buyers entering the Pompano market today may benefit from a similar appreciation trajectory.""",
        "lifestyleDescription": """Pompano Beach offers an authentic, unpretentious beach lifestyle. The renovated Fisher Family Pier is the centerpiece of the new beachfront, surrounded by restaurants, outdoor bars, and a public plaza. The Pompano Beach Amphitheater hosts concerts and events year-round.

The city's Intracoastal Waterway district provides marina access and waterfront dining. Isle Casino Pompano Park offers gaming and entertainment. The Pompano Beach Airpark, one of the busiest general aviation airports in Florida, serves private aviation needs.

For outdoor enthusiasts, the Sample-McDougald House museum and Butterfly World at Tradewinds Park add cultural and nature experiences. The city's improving restaurant scene includes Oceano Kitchen, Lucky Fish, and Alchemist Coffee Project.""",
    },
    {
        "name": "North Miami Beach",
        "slug": "north-miami-beach",
        "region": "Miami-Dade",
        "displayOrder": 19,
        "metaTitle": "New Pre-Construction Condos in North Miami Beach 2025-2028 | Affordable Luxury",
        "metaDescription": "Browse new pre-construction condos in North Miami Beach, FL. Affordable luxury near Aventura & Sunny Isles. Waterfront living from $350K.",
        "description": """North Miami Beach (not to be confused with neighboring North Miami) is a rapidly developing city positioned between Aventura and Sunny Isles Beach, offering some of South Florida's most accessible pricing for new-construction luxury. The city's eastern corridors along the Intracoastal Waterway are seeing increased developer interest as land prices in neighboring communities push buyers to explore adjacent markets.

The NMB pre-construction market caters to value-conscious buyers who want proximity to premium neighborhoods without the premium price tag. New developments along NE 163rd Street and the eastern waterfront corridors deliver modern amenities and finishes at entry points starting around $350,000.

North Miami Beach's value proposition is straightforward: located between Aventura Mall (5 minutes), Sunny Isles Beach (10 minutes), and Bal Harbour Shops (10 minutes), residents enjoy access to South Florida's finest amenities at a fraction of the cost of living in those communities directly.

The city's Eastside Improvement District is driving new investment in streetscaping, public spaces, and mixed-use development, signaling the early stages of a transformation similar to what Edgewater experienced a decade ago.""",
        "lifestyleDescription": """North Miami Beach offers a diverse, multicultural community with growing amenities. Oleta River State Park — Florida's largest urban park at 1,043 acres — provides mountain biking, kayaking, and mangrove trails just minutes from the ocean.

The Intracoastal Mall and SoLe Mia development are bringing new retail and entertainment options. Eastern Shores, the city's waterfront neighborhood, offers quiet residential streets with canal access and bay views.

Greynolds Park provides additional green space with a golf course, bird-watching trails, and the historic Castle structure. The city's proximity to Aventura and Sunny Isles means world-class dining and shopping are always minutes away.""",
    },
    {
        "name": "Boca Raton",
        "slug": "boca-raton",
        "region": "Palm Beach",
        "displayOrder": 20,
        "metaTitle": "New Pre-Construction Condos in Boca Raton 2025-2028 | Gold Coast Living",
        "metaDescription": "Discover new pre-construction condos in Boca Raton, FL. Alina Residences and luxury developments on the Gold Coast. Upscale beach living from $800K.",
        "description": """Boca Raton is Palm Beach County's premier planned city, offering a sophisticated blend of beachfront luxury, championship golf, top-tier education, and a thriving downtown district. Known for its manicured landscapes and Mediterranean-inspired architecture, Boca Raton has become one of South Florida's most sought-after addresses for affluent families and retirees.

The pre-construction market in Boca Raton features developments like Alina Residences — a landmark downtown project bringing ultra-luxury condo living to the heart of the city. The limited supply of oceanfront parcels and strict development standards ensure that new construction commands premium pricing.

Pre-construction pricing in Boca Raton ranges from approximately $800,000 for downtown two-bedrooms to $10M+ for oceanfront penthouses. The market attracts buyers from across the Northeast who are drawn by Florida's tax advantages, Boca's excellent schools, and a lifestyle that rivals the best resort communities in the world.

Boca Raton's economic base extends beyond real estate: the city is a growing tech hub with companies including IBM, Siemens, and numerous hedge funds establishing offices. Florida Atlantic University provides a major educational and economic anchor.""",
        "lifestyleDescription": """Boca Raton living combines beach culture with country club elegance. Mizner Park — the city's cultural and dining centerpiece — features the Boca Raton Museum of Art, an amphitheater for concerts, and a restaurant row with Truluck's, Max's Grille, and Kapow Noodle Bar.

The city's beach parks are exceptional: Red Reef Park, South Beach Park, and Spanish River Park offer pristine sand, snorkeling, and nature trails. The Boca Raton Resort & Club (a Waldorf Astoria property) has been a social institution since 1926.

Golf is integral to Boca life, with the Royal Palm Yacht & Country Club, Boca West Country Club, and St. Andrews Country Club among dozens of private clubs. Town Center at Boca Raton provides upscale shopping. The school system, including Boca Raton Community High and numerous A-rated elementary schools, is among the best in Florida.""",
    },
    {
        "name": "Design District",
        "slug": "design-district",
        "region": "Miami-Dade",
        "displayOrder": 21,
        "metaTitle": "New Pre-Construction Condos in Miami Design District 2025-2028 | Luxury & Art",
        "metaDescription": "Browse new pre-construction condos in Miami's Design District. Where Louis Vuitton meets luxury living. Art-forward residences near Wynwood. From $600K.",
        "description": """Miami's Design District is a 18-block creative neighborhood that has been transformed from a forgotten warehouse district into one of the world's premier luxury retail and art destinations, featuring flagship stores for Louis Vuitton, Dior, Prada, Hermès, and Cartier alongside museums, galleries, and Michelin-starred restaurants.

The residential development in and around the Design District is a natural extension of its commercial success. Projects like Kempinski Residences Miami and Miami Design Residences bring luxury branded living to a neighborhood where the average visitor spends more per capita than almost any retail district in the Western Hemisphere.

Pre-construction prices in the Design District range from approximately $600,000 to $5M+, reflecting the neighborhood's premium positioning and limited residential inventory. The area attracts design professionals, art collectors, fashion industry executives, and lifestyle-oriented buyers who value walkability to world-class retail and culture.

The Design District's continued evolution — with new gallery spaces, public art installations, and restaurant openings — ensures the neighborhood remains at the cutting edge of Miami's cultural landscape, supporting strong long-term demand for residential product.""",
        "lifestyleDescription": """The Design District lifestyle is curated and cosmopolitan. The neighborhood's pedestrian-friendly streets feature rotating public art installations by international artists, creating an outdoor museum experience. Institute of Contemporary Art (ICA) Miami provides a free museum with world-class exhibitions.

Dining is exceptional: Michael's Genuine, MC Kitchen, and Mandolin Aegean Bistro anchor a restaurant scene that draws from across Miami. The district's luxury retail — spanning an entire block of LVMH brands, plus Bulgari, Fendi, and Tom Ford — makes it a shopping destination without rival in South Florida.

The monthly Design District Art + Design Night and seasonal events like Design Miami/ bring the global creative community to the neighborhood. Living here means immersion in art, architecture, fashion, and culinary excellence — a lifestyle that simply doesn't exist in Miami's more conventional residential neighborhoods.""",
    },
    {
        "name": "South Beach",
        "slug": "south-beach",
        "region": "Miami-Dade",
        "displayOrder": 22,
        "metaTitle": "New Pre-Construction Condos in South Beach 2025-2028 | Iconic Miami Living",
        "metaDescription": "Explore new pre-construction condos in South Beach, Miami. Iconic oceanfront living in the Art Deco district. Where culture meets the beach. From $1M.",
        "description": """South Beach is the most globally recognized neighborhood in Miami — a cultural phenomenon that spans world-famous beaches, the Art Deco Historic District, celebrity nightlife, and an international lifestyle that has defined Miami's image for decades. For pre-construction buyers, South Beach offers something no other neighborhood can: a globally branded address.

Pre-construction opportunities in South Beach are increasingly rare and ultra-premium, as the historic district's strict preservation codes limit new development. When projects do emerge — such as the Shore Club Private Collection and Ritz-Carlton Residences South Beach — they command extraordinary prices and sell through to a global clientele of collectors, celebrities, and ultra-high-net-worth families.

Pricing in South Beach reflects its iconic status: expect $1,500 to $4,000+ per square foot for new construction, with penthouse collections reaching $25M to over $100M. The limited development pipeline ensures continued scarcity and strong value retention.

South Beach's transformation from a party destination to a luxury residential address was catalyzed by the COVID-era migration of finance and tech wealth. Today, the neighborhood's buyers are as likely to be hedge fund managers as hospitality moguls, creating a more sophisticated residential community than the neighborhood's nightlife reputation might suggest.""",
        "lifestyleDescription": """South Beach living is an immersive experience in global culture. Ocean Drive, Lincoln Road, and Española Way provide distinct vibes: Ocean Drive for celebrity-spotting and sunset cocktails, Lincoln Road for outdoor dining and gallery walks, and Española Way for its European village charm.

The beach itself is magnificent — wide, clean, and stretching from South Pointe Park to mid-beach with iconic lifeguard towers and Art Deco architecture as the backdrop. South Pointe Park Pier offers some of Miami's best sunset views and cruise ship watching.

Cultural attractions include the Jewish Museum of Florida-FIU, the World Erotic Art Museum, the Art Deco Welcome Center, and the New World Symphony. The dining scene features Joe's Stone Crab, Prime 112, Juvia, Carbone, and dozens of internationally acclaimed restaurants. South Beach is also home to the annual Art Basel Miami Beach, the South Beach Wine & Food Festival, and Swim Week.""",
    },
    {
        "name": "West Palm Beach",
        "slug": "west-palm-beach",
        "region": "Palm Beach",
        "displayOrder": 23,
        "metaTitle": "New Pre-Construction Condos in West Palm Beach 2025-2028 | Wall Street South",
        "metaDescription": "Browse new pre-construction condos in West Palm Beach. Florida's fastest-growing luxury market. Finance & tech hub with waterfront living. From $700K.",
        "description": """West Palm Beach has emerged as one of the most dynamic real estate markets in the United States, earning the moniker "Wall Street South" as Goldman Sachs, Citadel, Elliott Management, and dozens of hedge funds and financial firms have established offices in the city's downtown and along the waterfront.

This influx of corporate wealth has ignited a pre-construction boom in West Palm Beach, with luxury residential towers, boutique condos, and mixed-use developments reshaping the city's skyline. The Brightline high-speed rail station provides 60-minute service to Miami, making West Palm an increasingly viable option for South Florida professionals who want space, value, and quality of life without sacrificing connectivity.

Pre-construction pricing in West Palm Beach ranges from approximately $700,000 for downtown condos to $5M+ for waterfront penthouses. The market has seen rapid price appreciation since 2020, driven by corporate relocations and the associated demand for luxury housing.

West Palm Beach's long-term trajectory is supported by continued corporate relocation interest, major infrastructure investments including the Flagler Drive waterfront redevelopment, and a cultural renaissance that includes the Norton Museum of Art, Kravis Center, and a rapidly expanding culinary scene.""",
        "lifestyleDescription": """West Palm Beach offers a rapidly maturing urban lifestyle centered around its waterfront and Clematis Street district. The revitalized downtown features Rosemary Square (formerly CityPlace) with restaurants, a movie theater, and live entertainment. The Flagler Drive waterfront provides stunning Intracoastal views and hosts events year-round.

The cultural scene punches well above its weight: the Norton Museum of Art houses an internationally significant collection, while the Ann Norton Sculpture Gardens, Society of the Four Arts, and Kravis Center provide year-round cultural programming.

Dining has exploded with spots like Grato, Elisabetta's, Sant Ambroeus, and The Regional. The Brightline station provides car-free access to Fort Lauderdale (15 min) and Miami (60 min). Palm Beach Island — with Worth Avenue, The Breakers, and pristine beaches — is a 5-minute drive across the Intracoastal.""",
    },
]

def supabase_request(method, endpoint, data=None):
    """Make a Supabase REST API request."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" if method in ("PATCH", "POST") else "",
    }
    if method == "POST":
        headers["Prefer"] = "return=representation"

    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        resp = urlopen(req)
        if method == "POST":
            return json.loads(resp.read())
        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def main():
    # ========================================
    # STEP 1: Update existing neighborhoods
    # ========================================
    print("=" * 60)
    print("STEP 1: Updating 16 existing neighborhoods with SEO content")
    print("=" * 60)

    updated = 0
    for slug, content in EXISTING_UPDATES.items():
        print(f"\nUpdating: {slug}")
        result = supabase_request(
            "PATCH",
            f"neighborhoods?slug=eq.{slug}",
            content,
        )
        if result:
            updated += 1
            print(f"  -> Updated (metaTitle, metaDesc, description, lifestyle)")
        else:
            print(f"  -> FAILED")

    print(f"\nExisting neighborhoods updated: {updated}/16")

    # ========================================
    # STEP 2: Add new neighborhoods
    # ========================================
    print("\n" + "=" * 60)
    print("STEP 2: Adding 8 new South Florida neighborhoods")
    print("=" * 60)

    added = 0
    for n in NEW_NEIGHBORHOODS:
        print(f"\nAdding: {n['name']}")
        # Check if already exists
        try:
            check_url = f"{SUPABASE_URL}/rest/v1/neighborhoods?slug=eq.{n['slug']}&select=id"
            check_req = Request(check_url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
            check_resp = json.loads(urlopen(check_req).read())
            if check_resp:
                print(f"  -> Already exists, updating instead")
                result = supabase_request("PATCH", f"neighborhoods?slug=eq.{n['slug']}", n)
                if result:
                    added += 1
                continue
        except:
            pass

        result = supabase_request("POST", "neighborhoods", n)
        if result:
            added += 1
            print(f"  -> Added")
        else:
            print(f"  -> FAILED")

    print(f"\nNew neighborhoods added: {added}/8")
    print(f"\n{'=' * 60}")
    print(f"TOTAL: {updated + added} neighborhoods with full SEO content")

if __name__ == "__main__":
    main()
