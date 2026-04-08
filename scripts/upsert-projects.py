#!/usr/bin/env python3
"""
Upsert new pre-construction projects to Supabase.
Sources: miamicondoinvestments.com, condoblackbook.com, manhattanmiami.com, web search.
Generates cuid-like IDs, geocodes with Mapbox, creates footprints.
"""
import json, os, re, time, urllib.request, urllib.parse, random, string

API = "https://fnyrtptmcazhmoztmuay.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"
MAPBOX = os.environ["NEXT_PUBLIC_MAPBOX_TOKEN"]
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def cuid():
    chars = string.ascii_lowercase + string.digits
    return 'c' + ''.join(random.choices(chars, k=24))

def now_iso():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()

def slugify(text):
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', text.lower()))

def api_get(path):
    req = urllib.request.Request(f"{API}/{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def api_post(path, data, extra=None):
    h = {**HEADERS}
    if extra: h.update(extra)
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API}/{path}", data=body, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  API Error {e.code}: {err_body[:200]}")
        return None

def geocode(address):
    enc = urllib.parse.quote(address)
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{enc}.json?access_token={MAPBOX}&limit=1"
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
    if data.get("features"):
        lng, lat = data["features"][0]["center"]
        return lat, lng
    return None, None

def gen_footprint(lat, lng, floors):
    size = min(0.0003, 0.0001 + floors * 0.000003)
    hw, hh = size/2, size/2.5
    return {"type":"Polygon","coordinates":[[[lng-hw,lat-hh],[lng+hw,lat-hh],[lng+hw,lat+hh],[lng-hw,lat+hh],[lng-hw,lat-hh]]]}

HOOD_MAP = {
    'brickell':'brickell','downtown miami':'downtown-miami','edgewater':'edgewater',
    'miami beach':'miami-beach','south beach':'south-beach','coconut grove':'coconut-grove',
    'coral gables':'coral-gables','sunny isles beach':'sunny-isles-beach','surfside':'surfside',
    'bal harbour':'bal-harbour','bay harbor islands':'bay-harbor-islands',
    'key biscayne':'key-biscayne','wynwood':'midtown-wynwood','midtown':'midtown-wynwood',
    'design district':'design-district','aventura':'aventura','north bay village':'north-bay-village',
    'north miami beach':'north-miami-beach','fort lauderdale':'fort-lauderdale',
    'hollywood':'hollywood','hallandale beach':'hallandale-beach','pompano beach':'pompano-beach',
    'palm beach':'palm-beach','west palm beach':'west-palm-beach','boca raton':'boca-raton',
}

PROJECTS = [
    {"name":"501 First Residences","address":"501 NE 1st Ave, Miami, FL 33132","neighborhood":"downtown miami","developer":"Aria Development Group","architect":"Arquitectonica","floors":40,"totalUnits":448,"priceMin":400000,"priceMax":1200000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"501 First Residences is a 40-story luxury condominium tower rising in the heart of Downtown Miami. Developed by Aria Development Group with architecture by Arquitectonica, this project brings 448 residences to one of Miami's most dynamic neighborhoods near the Arts & Entertainment District.","amenities":["Resort-style pool deck","Fitness center","Co-working spaces","Yoga studio","BBQ area","Children's play area","Pet spa","24-hour concierge","Valet parking"],"unitTypes":"Studios, 1-3 Bedrooms"},
    {"name":"The Crosby Miami Worldcenter","address":"640 N Miami Ave, Miami, FL 33136","neighborhood":"downtown miami","developer":"Related Group, Merrimac Ventures","architect":"Arquitectonica","floors":31,"totalUnits":450,"priceMin":450000,"priceMax":1500000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"The Crosby at Miami Worldcenter is a 31-story residential tower offering 450 luxury residences in Downtown Miami's transformative Miami Worldcenter district.","amenities":["Rooftop pool and lounge","Fitness center","Co-working lounge","Theater room","Social club","Dog park","Smart home technology"],"unitTypes":"Studios, 1-3 Bedrooms"},
    {"name":"Una Residences","address":"175 SE 25th Rd, Miami, FL 33129","neighborhood":"brickell","developer":"OKO Group, Cain International","architect":"Adrian Smith + Gordon Gill","floors":47,"totalUnits":135,"priceMin":2900000,"priceMax":21000000,"estCompletion":"2026","status":"NEAR_COMPLETION","category":"ULTRA_LUXURY","description":"Una Residences is a 47-story waterfront tower on Biscayne Bay in Brickell designed by Adrian Smith + Gordon Gill Architecture with 135 expansive residences featuring floor-to-ceiling windows and private elevator access.","amenities":["Bayfront infinity pool","Private marina","Spa and wellness center","Fitness center","Wine cellar","Children's playroom","Theater","Business center","Sunset lounge"],"unitTypes":"2-5 Bedrooms, Penthouses"},
    {"name":"Visions at Brickell Station","address":"1136 SW 3rd Ave, Miami, FL 33130","neighborhood":"brickell","developer":"Newgard Development Group","floors":8,"totalUnits":111,"priceMin":350000,"priceMax":750000,"estCompletion":"2027","status":"PRE_CONSTRUCTION","category":"AFFORDABLE_LUXURY","description":"Visions at Brickell Station offers an accessible entry into the Brickell neighborhood with 111 residences steps from Brickell City Centre Metromover.","amenities":["Rooftop pool","Fitness center","Co-working space","Package room","Bicycle storage"],"unitTypes":"Studios, 1-2 Bedrooms"},
    {"name":"Onda Residences","address":"1135 103rd Street, Bay Harbor Islands, FL 33154","neighborhood":"bay harbor islands","developer":"Verzasca Group","architect":"Kobi Karp","floors":8,"totalUnits":41,"priceMin":1400000,"priceMax":4500000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Onda Residences is a boutique waterfront condominium in Bay Harbor Islands with 41 luxury residences and wave-inspired architecture by Kobi Karp.","amenities":["Waterfront pool","Private boat slips","Fitness center","Rooftop terrace","Summer kitchen","Concierge"],"unitTypes":"2-4 Bedrooms"},
    {"name":"Alana Bay Harbor Islands","address":"1030 93rd St, Bay Harbor Islands, FL 33154","neighborhood":"bay harbor islands","developer":"Two Roads Development","floors":8,"totalUnits":32,"priceMin":1350000,"priceMax":3500000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Alana Bay Harbor Islands is an intimate waterfront condominium offering 32 luxury residences.","amenities":["Bayfront pool","Wellness center","Yoga deck","Private boat dock","Rooftop lounge","EV charging"],"unitTypes":"2-3 Bedrooms"},
    {"name":"Villa17","address":"1709 Jefferson Ave, Miami Beach, FL 33139","neighborhood":"south beach","developer":"Vertical Developments","floors":5,"totalUnits":10,"priceMin":1800000,"priceMax":3200000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Villa17 is an ultra-exclusive boutique condominium in the heart of South Beach with only 10 residences.","amenities":["Rooftop pool","Private terraces","Concierge","Secure parking","Smart home technology"],"unitTypes":"2-3 Bedrooms"},
    {"name":"Sage Intracoastal Residences","address":"2893 E Sunrise Blvd, Fort Lauderdale, FL 33304","neighborhood":"fort lauderdale","developer":"Property Markets Group (PMG)","floors":28,"totalUnits":44,"priceMin":2000000,"priceMax":3500000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Sage Intracoastal Residences is a 28-story boutique tower by PMG on the Intracoastal Waterway in Fort Lauderdale.","amenities":["Infinity pool","Private marina","Spa","Fitness center","Social lounge","Wine storage","Concierge","Valet"],"unitTypes":"2-4 Bedrooms"},
    {"name":"Andare Residences by Pininfarina","address":"551 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304","neighborhood":"fort lauderdale","developer":"Kolter Urban","architect":"Pininfarina","floors":45,"totalUnits":163,"priceMin":2150000,"priceMax":8000000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"LUXURY","description":"Andare Residences by Pininfarina is a 45-story oceanfront tower designed by the legendary Italian design house on Fort Lauderdale Beach.","amenities":["Oceanfront pool deck","Spa by Pininfarina","Fitness center","Social club","Private dining","Wine vault","Pet spa","EV charging","Beach services"],"unitTypes":"2-4 Bedrooms, Penthouses"},
    {"name":"Ombelle Residences","address":"525 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304","neighborhood":"fort lauderdale","developer":"Dependable Equities","floors":44,"totalUnits":775,"priceMin":400000,"priceMax":2500000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"Ombelle is Fort Lauderdale's largest new oceanfront condominium with 775 residences across 44 stories.","amenities":["Oceanfront pool","Spa","Fitness studios","Co-working spaces","Theater","Children's playroom","Dog park","Tennis courts","Beach club"],"unitTypes":"Studios, 1-4 Bedrooms"},
    {"name":"Sereno Fort Lauderdale","address":"2900 Riomar St, Fort Lauderdale, FL 33304","neighborhood":"fort lauderdale","developer":"Kolter Urban","floors":14,"totalUnits":76,"priceMin":1800000,"priceMax":5000000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"LUXURY","description":"Sereno is a 14-story boutique waterfront condominium on the Intracoastal Waterway in Fort Lauderdale.","amenities":["Waterfront pool","Fitness center","Yoga studio","Kayak launch","Social lounge","EV charging"],"unitTypes":"2-3 Bedrooms, Penthouses"},
    {"name":"Viceroy Residences Fort Lauderdale","address":"3101 Bayshore Dr, Fort Lauderdale, FL 33304","neighborhood":"fort lauderdale","developer":"Related Group, BH Group","floors":45,"totalUnits":370,"priceMin":600000,"priceMax":3000000,"estCompletion":"2029","status":"PRE_CONSTRUCTION","category":"LUXURY","description":"Viceroy Residences Fort Lauderdale is a 45-story waterfront tower bringing the Viceroy hospitality brand to Fort Lauderdale.","amenities":["Waterfront pool","Viceroy spa","Fitness center","Marina","Restaurant","Rooftop bar","Business center","Concierge","Kids club"],"unitTypes":"Studios, 1-4 Bedrooms"},
    {"name":"South Flagler House","address":"1160 S Flagler Dr, West Palm Beach, FL 33401","neighborhood":"west palm beach","developer":"Related Companies","architect":"Robert A.M. Stern Architects","floors":28,"totalUnits":105,"priceMin":6000000,"priceMax":35000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"ULTRA_LUXURY","description":"South Flagler House is an ultra-luxury waterfront development designed by Robert A.M. Stern Architects in West Palm Beach.","amenities":["Waterfront infinity pool","Full-service spa","Private dining by Jean-Georges","Fitness by Anatomy","Marina","Wine vault","Private gardens","Concierge","Valet"],"unitTypes":"2-5 Bedrooms, Penthouses"},
    {"name":"The Berkeley West Palm Beach","address":"300 Banyan Blvd, West Palm Beach, FL 33401","neighborhood":"west palm beach","developer":"Savanna","floors":28,"totalUnits":193,"priceMin":1200000,"priceMax":6000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"The Berkeley is a 28-story luxury condominium in downtown West Palm Beach with 193 residences.","amenities":["Pool deck with cabanas","Fitness center","Social lounge","Co-working space","Dog spa","Wine room","Private dining","EV charging","Concierge"],"unitTypes":"1-4 Bedrooms"},
    {"name":"Shorecrest West Palm Beach","address":"1000 S Flagler Dr, West Palm Beach, FL 33401","neighborhood":"west palm beach","developer":"Rabina Properties","architect":"OMA","floors":27,"totalUnits":100,"priceMin":3500000,"priceMax":20000000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"ULTRA_LUXURY","description":"Shorecrest is a landmark 27-story tower designed by OMA (Rem Koolhaas) with a distinctive curvilinear facade.","amenities":["Infinity pool","Spa and wellness center","Beach club","Marina access","Fine dining restaurant","Library lounge","Fitness center","24-hour concierge"],"unitTypes":"2-5 Bedrooms, Penthouses"},
    {"name":"Icon Beach Residences","address":"1301 S Ocean Dr, Hollywood, FL 33019","neighborhood":"hollywood","developer":"Related Group, BH Group","floors":37,"totalUnits":350,"priceMin":825000,"priceMax":2600000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"Icon Beach Residences is a 37-story oceanfront condominium on Hollywood Beach with 350 residences.","amenities":["Oceanfront pool deck","Spa","Fitness center","Beach club","Social lounge","Children's room","Business center","Concierge","Valet"],"unitTypes":"1-3 Bedrooms"},
    {"name":"Glass House Boca Raton","address":"298 SE Mizner Blvd, Boca Raton, FL 33432","neighborhood":"boca raton","developer":"Elad National Properties","architect":"Garcia Stromberg","floors":10,"totalUnits":28,"priceMin":3000000,"priceMax":8000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Glass House is the first modern glass condominium in downtown Boca Raton with 28 luxury residences.","amenities":["Rooftop pool and sky lounge","Fitness center","Wine room","Private storage","EV charging","Concierge"],"unitTypes":"2-4 Bedrooms"},
    {"name":"Boca Beach House","address":"2150 N Ocean Blvd, Boca Raton, FL 33431","neighborhood":"boca raton","developer":"Penn-Florida Companies","floors":5,"totalUnits":32,"priceMin":2500000,"priceMax":7000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Boca Beach House features 32 flow-through residences on 3.2 acres overlooking Lake Boca Raton.","amenities":["Oceanfront pool","Private beach access","Fitness center","Social room","Landscaped gardens","Secure parking"],"unitTypes":"2-3 Bedrooms"},
    {"name":"Onix Delray Beach","address":"105 SE 1st Ave, Delray Beach, FL 33444","neighborhood":"boca raton","developer":"Savanna Fund","floors":4,"totalUnits":26,"priceMin":1569000,"priceMax":3200000,"estCompletion":"2028","status":"PRE_CONSTRUCTION","category":"LUXURY","description":"Onix is a boutique 4-story condominium with 26 luxury residences in downtown Delray Beach.","amenities":["Rooftop pool","Fitness center","Social lounge","Private storage","Secure parking"],"unitTypes":"2-3 Bedrooms"},
    {"name":"Alchemy Wynwood Residences","address":"18 NW 23rd St, Miami, FL 33127","neighborhood":"wynwood","developer":"Alchemy-ABR Investment Partners","architect":"Arquitectonica","floors":12,"totalUnits":186,"priceMin":500000,"priceMax":1500000,"estCompletion":"2029","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"Alchemy Wynwood brings 186 luxury residences to the Wynwood Arts District designed by Arquitectonica.","amenities":["Rooftop pool","Fitness center","Coworking spaces","Art gallery","Retail promenade","Dog park","Bicycle storage"],"unitTypes":"Studios, 1-3 Bedrooms"},
    {"name":"Edgewater 36","address":"2600 NE 2nd Ave, Miami, FL 33137","neighborhood":"edgewater","developer":"Black Salmon, TSG","architect":"Arquitectonica","floors":36,"totalUnits":229,"priceMin":700000,"priceMax":2500000,"estCompletion":"2029","status":"PRE_CONSTRUCTION","category":"PREMIUM","description":"Edgewater 36 is a 36-story tower with a unique diagrid design by Arquitectonica and Biscayne Bay views.","amenities":["Pool deck with bay views","Fitness center","Spa","Social lounge","Co-working space","Dog park","EV charging"],"unitTypes":"1-3 Bedrooms"},
    {"name":"Riva Residenze","address":"1110 SE 3rd Ave, Fort Lauderdale, FL 33316","neighborhood":"fort lauderdale","developer":"Riva Development","floors":7,"totalUnits":36,"priceMin":3000000,"priceMax":9000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Riva Residenze is a yacht-inspired luxury development with 36 home-sized residences on the New River.","amenities":["Waterfront pool","Private boat slips","Fitness center","Social club","Private storage","Concierge"],"unitTypes":"3-4 Bedrooms"},
    {"name":"Bungalow East Residences","address":"2500 E Las Olas Blvd, Fort Lauderdale, FL 33301","neighborhood":"fort lauderdale","developer":"Stiles Corporation","floors":5,"totalUnits":24,"priceMin":2000000,"priceMax":5000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"Bungalow East is a boutique condominium on East Las Olas Boulevard with 24 luxury residences.","amenities":["Rooftop pool","Fitness center","Social room","Secure parking","Bicycle storage"],"unitTypes":"2-3 Bedrooms"},
    {"name":"La Baia North","address":"9201 E Bay Harbor Dr, Bay Harbor Islands, FL 33154","neighborhood":"bay harbor islands","developer":"Chateau Group","floors":8,"totalUnits":57,"priceMin":1500000,"priceMax":5000000,"estCompletion":"2027","status":"UNDER_CONSTRUCTION","category":"LUXURY","description":"La Baia North is the newest phase of the La Baia waterfront community with 57 ultra-luxury residences.","amenities":["Waterfront pool","Private marina","Spa","Fitness center","Club room","Children's area","Concierge"],"unitTypes":"2-4 Bedrooms"},
]

# Fetch existing data
print("Fetching existing data...")
existing = api_get("projects?select=slug&limit=500")
existing_slugs = {p["slug"] for p in existing}
print(f"  {len(existing_slugs)} existing projects")

hoods = api_get("neighborhoods?select=id,slug")
hood_map = {h["slug"]: h["id"] for h in hoods}

devs = api_get("developers?select=id,name,slug")
dev_map = {d["slug"]: d["id"] for d in devs}

added = 0
skipped = 0

for p in PROJECTS:
    slug = slugify(p["name"])
    if slug in existing_slugs:
        print(f"Skip: {p['name']}")
        skipped += 1
        continue

    hood_slug = HOOD_MAP.get(p["neighborhood"].lower(), "")
    neighborhood_id = hood_map.get(hood_slug)

    # Developer
    dev_slug = slugify(p["developer"])
    developer_id = dev_map.get(dev_slug)
    if not developer_id:
        print(f"  Creating developer: {p['developer']}")
        dev_id = cuid()
        dev_data = api_post("developers", {"id": dev_id, "name": p["developer"], "slug": dev_slug, "createdAt": now_iso(), "updatedAt": now_iso()},
                           {"Prefer": "return=representation,resolution=merge-duplicates"})
        if dev_data and isinstance(dev_data, list):
            developer_id = dev_data[0]["id"]
            dev_map[dev_slug] = developer_id
        else:
            # Try fetching
            try:
                existing_dev = api_get(f"developers?slug=eq.{dev_slug}&select=id")
                if existing_dev:
                    developer_id = existing_dev[0]["id"]
                    dev_map[dev_slug] = developer_id
            except:
                pass

    # Geocode
    print(f"Geocoding: {p['name']}...")
    lat, lng = geocode(p["address"])
    if not lat:
        print(f"  SKIP - no geocode result")
        continue

    footprint = gen_footprint(lat, lng, p["floors"])

    row = {
        "id": cuid(),
        "name": p["name"], "slug": slug, "address": p["address"],
        "neighborhoodId": neighborhood_id, "developerId": developer_id,
        "architect": p.get("architect"), "status": p["status"],
        "estCompletion": p["estCompletion"], "totalUnits": p["totalUnits"],
        "floors": p["floors"], "priceMin": p.get("priceMin"),
        "priceMax": p.get("priceMax"), "description": p["description"],
        "amenities": p["amenities"], "category": p["category"],
        "unitTypes": p.get("unitTypes"), "latitude": lat, "longitude": lng,
        "footprint": footprint, "featured": False,
        "createdAt": now_iso(), "updatedAt": now_iso(),
    }

    result = api_post("projects", row,
                      {"Prefer": "return=representation,resolution=merge-duplicates"})
    if result and isinstance(result, list):
        print(f"  Added: {p['name']} ({lat:.4f}, {lng:.4f})")
        added += 1
        existing_slugs.add(slug)
    else:
        print(f"  ERROR adding: {p['name']}")

    time.sleep(0.3)

print(f"\nDone: {added} added, {skipped} skipped")
print(f"Total projects now: {len(existing_slugs)}")
