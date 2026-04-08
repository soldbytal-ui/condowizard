#!/usr/bin/env python3
"""
Generate SEO content for all projects in the database.
Generates longDescription, metaTitle, metaDescription, and FAQ JSON.
"""
import json, urllib.request, urllib.parse, time, re

API = "https://fnyrtptmcazhmoztmuay.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def api_get(path):
    req = urllib.request.Request(f"{API}/{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def api_patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API}/{path}", data=body, headers={**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except Exception as e:
        print(f"  PATCH Error: {e}")
        return False

def slugify(text):
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', text.lower()))

def fmt_price(n):
    if not n: return None
    if n >= 1000000: return f"${n/1000000:.1f}M"
    return f"${n/1000}K"

def generate_content(p, hood_name, dev_name, related):
    """Generate SEO-rich long description for a project."""
    name = p["name"]
    area = hood_name or "Miami"
    area_slug = slugify(area) if hood_name else "brickell"
    dev = dev_name or "a leading South Florida developer"
    dev_slug = slugify(dev) if dev_name else None
    price_from = fmt_price(p.get("priceMin"))
    price_to = fmt_price(p.get("priceMax"))
    units = p.get("totalUnits")
    floors = p.get("floors")
    completion = p.get("estCompletion", "TBD")
    status = (p.get("status") or "").replace("_", " ").title()
    architect = p.get("architect")
    amenities = p.get("amenities") or []
    unit_types = p.get("unitTypes") or ""
    address = p.get("address") or ""
    desc = p.get("description") or ""
    category = (p.get("category") or "PREMIUM").replace("_", " ").title()

    # Price range text
    price_text = ""
    if price_from and price_to:
        price_text = f"Prices range from {price_from} to {price_to}"
    elif price_from:
        price_text = f"Prices starting from {price_from}"

    # Building overview paragraph
    paras = []
    intro = f"{name} is "
    if category in ("Ultra Luxury", "Luxury Branded"):
        intro += f"one of the most anticipated ultra-luxury pre-construction developments in {area}. "
    else:
        intro += f"an exciting new pre-construction development in the heart of {area}. "

    if floors and units:
        intro += f"Rising {floors} stories with {units} residences, "
    elif units:
        intro += f"Featuring {units} residences, "

    intro += f"this {area} new condo project "
    if completion and completion != "TBD":
        intro += f"is anticipated for completion in {completion}. "
    else:
        intro += "is currently in the planning stages. "

    if dev_name:
        intro += f"Developed by [{dev}](/developers/{dev_slug}), "
        if architect:
            intro += f"with architecture by {architect}, "
        intro += f"{name} represents a new standard for luxury living in South Florida."
    paras.append(intro)

    # Location paragraph
    loc = f"### Prime {area} Location\n\n"
    loc += f"Situated "
    if address:
        loc += f"at {address}, "
    loc += f"{name} enjoys an exceptional position in [{area}](/areas/{area_slug}), "
    loc += f"one of South Florida's most sought-after neighborhoods. "

    area_lower = area.lower()
    if "brickell" in area_lower:
        loc += "Brickell is Miami's financial district and a global hub for luxury living, offering world-class dining, high-end retail at Brickell City Centre, and seamless connectivity via the Metromover. "
    elif "downtown" in area_lower:
        loc += "Downtown Miami is experiencing a renaissance with the Miami Worldcenter mega-development, a thriving arts scene, and a growing roster of Fortune 500 companies establishing their headquarters. "
    elif "edgewater" in area_lower:
        loc += "Edgewater has emerged as one of Miami's hottest neighborhoods, offering stunning Biscayne Bay views, proximity to the Design District and Wynwood, and a more relaxed urban lifestyle. "
    elif "miami beach" in area_lower or "south beach" in area_lower:
        loc += "Miami Beach offers an unparalleled combination of oceanfront living, Art Deco charm, world-renowned dining, and a vibrant cultural scene that attracts residents from around the globe. "
    elif "coconut grove" in area_lower:
        loc += "Coconut Grove is Miami's oldest neighborhood, known for its lush tree canopy, waterfront parks, charming village center, and a sophisticated yet relaxed lifestyle. "
    elif "coral gables" in area_lower:
        loc += "Coral Gables, the 'City Beautiful,' offers Mediterranean-inspired architecture, tree-lined boulevards, top-rated schools, and a walkable downtown with upscale dining and retail. "
    elif "sunny isles" in area_lower:
        loc += "Sunny Isles Beach is known as 'Little Moscow' and 'Florida's Riviera,' offering pristine beaches, luxury high-rise living, and a cosmopolitan atmosphere. "
    elif "bay harbor" in area_lower:
        loc += "Bay Harbor Islands offers a serene island lifestyle with waterfront living, excellent schools, and convenient access to the shops and restaurants of Bal Harbour and Surfside. "
    elif "surfside" in area_lower:
        loc += "Surfside is a charming beachfront town known for its small-town feel, pristine beaches, and an increasingly sophisticated culinary and shopping scene. "
    elif "fort lauderdale" in area_lower:
        loc += "Fort Lauderdale, the 'Venice of America,' is renowned for its extensive canal system, beautiful beaches, vibrant Las Olas Boulevard, and a booming luxury condo market. "
    elif "hollywood" in area_lower:
        loc += "Hollywood Beach offers a laid-back coastal lifestyle with its iconic Broadwalk, beautiful beaches, and a growing luxury residential market between Miami and Fort Lauderdale. "
    elif "west palm beach" in area_lower:
        loc += "West Palm Beach has become one of Florida's most dynamic cities, attracting major financial firms, world-class cultural institutions, and a wave of luxury residential development. "
    elif "boca raton" in area_lower:
        loc += "Boca Raton offers a refined coastal lifestyle with pristine beaches, championship golf courses, upscale shopping at Town Center, and some of South Florida's best schools. "
    elif "aventura" in area_lower:
        loc += "Aventura is a family-friendly city known for Aventura Mall (one of the largest in the US), excellent schools, and a growing number of luxury residential towers. "
    elif "wynwood" in area_lower or "midtown" in area_lower:
        loc += "Wynwood and Midtown have transformed from industrial neighborhoods into Miami's creative epicenter, known for world-famous street art, cutting-edge galleries, and a vibrant dining scene. "
    elif "hallandale" in area_lower:
        loc += "Hallandale Beach offers an excellent value proposition between Miami and Fort Lauderdale, with beautiful beaches, the Gulfstream Park entertainment complex, and growing luxury development. "
    elif "bal harbour" in area_lower:
        loc += "Bal Harbour is one of South Florida's most exclusive enclaves, home to the legendary Bal Harbour Shops and some of the area's most prestigious oceanfront residences. "
    else:
        loc += f"This prime location offers residents easy access to South Florida's best dining, shopping, beaches, and cultural attractions. "

    loc += f"Residents of {name} will enjoy convenient access to Miami International Airport, major highways, and the best that South Florida has to offer."
    paras.append(loc)

    # Amenities paragraph
    if amenities:
        am = f"### World-Class Amenities & Lifestyle\n\n"
        am += f"{name} offers an exceptional amenity package designed for the modern luxury lifestyle. "
        if len(amenities) > 5:
            am += f"Highlights include {', '.join(amenities[:5])}, and {', '.join(amenities[5:])}. "
        else:
            am += f"Residents will enjoy {', '.join(amenities)}. "
        am += f"Every detail has been thoughtfully curated to deliver a resort-caliber living experience."
        paras.append(am)

    # Unit types paragraph
    if unit_types or price_text:
        ut = f"### Residences & Pricing\n\n"
        if unit_types:
            ut += f"{name} offers a range of floor plans including {unit_types}. "
        if price_text:
            ut += f"{price_text}, "
            ut += f"making {name} "
            if p.get("priceMin") and p["priceMin"] >= 3000000:
                ut += "an ultra-luxury opportunity for discerning buyers. "
            elif p.get("priceMin") and p["priceMin"] >= 1000000:
                ut += "an excellent luxury investment opportunity. "
            else:
                ut += "an accessible entry point into luxury pre-construction living. "
        ut += f"Each residence features premium finishes, expansive layouts, and thoughtful design."
        paras.append(ut)

    # Investment paragraph
    inv = f"### Investment Potential\n\n"
    inv += f"Miami's pre-construction condo market continues to attract global investors, and {name} represents a compelling opportunity. "
    if completion and completion != "TBD":
        inv += f"With an estimated completion in {completion}, buyers who secure units now can benefit from pre-construction pricing before values appreciate. "
    inv += f"The {area} market has shown strong appreciation trends, driven by population growth, corporate relocations, and sustained international demand. "
    inv += f"{name} pre-construction condos in {area} offer both a luxury lifestyle and a strategic investment in one of the most dynamic real estate markets in the United States."
    paras.append(inv)

    # Developer track record
    if dev_name:
        dv = f"### About the Developer\n\n"
        dv += f"[{dev}](/developers/{dev_slug}) "
        dv += f"brings significant experience and a proven track record to {name}. "
        dv += f"Known for delivering high-quality residential developments across South Florida, {dev} has established a reputation for excellence in design, construction quality, and resident satisfaction."
        paras.append(dv)

    # Related projects links
    if related:
        rel = f"### Explore More {area} Pre-Construction\n\n"
        rel += f"Interested in other new developments in {area}? Explore these nearby projects:\n\n"
        for r in related[:3]:
            rslug = r["slug"]
            rname = r["name"]
            rel += f"- [{rname}](/properties/{rslug})\n"
        rel += f"\nView all [new condos in {area}](/areas/{area_slug}) for a complete overview of pre-construction opportunities."
        paras.append(rel)

    return "\n\n".join(paras)

def generate_meta(p, hood_name):
    name = p["name"]
    area = hood_name or "Miami"
    price_from = fmt_price(p.get("priceMin"))
    completion = p.get("estCompletion", "")

    # Meta title (under 60 chars)
    title = f"{name} | Pre-Construction {area}"
    if len(title) > 60:
        title = f"{name} | {area} Condos"
    if len(title) > 60:
        title = name[:57] + "..."

    # Meta description (under 160 chars)
    desc_parts = [f"{name} pre-construction condos in {area}."]
    if price_from:
        desc_parts.append(f"From {price_from}.")
    if p.get("totalUnits"):
        desc_parts.append(f"{p['totalUnits']} residences.")
    if completion and completion != "TBD":
        desc_parts.append(f"Est. completion {completion}.")
    desc_parts.append("Floor plans, pricing & availability.")
    desc = " ".join(desc_parts)
    if len(desc) > 160:
        desc = desc[:157] + "..."

    return title, desc

def generate_faq(p, hood_name, dev_name):
    name = p["name"]
    area = hood_name or "Miami"
    price_from = fmt_price(p.get("priceMin"))
    completion = p.get("estCompletion", "TBD")
    units = p.get("totalUnits")
    floors = p.get("floors")

    faqs = []

    # Q1: Price
    if price_from:
        faqs.append({
            "question": f"What are the prices at {name}?",
            "answer": f"Prices at {name} start from {price_from}. " +
                      (f"The development offers {p.get('unitTypes', 'various unit types')}. " if p.get("unitTypes") else "") +
                      "Contact us for current availability and pricing details."
        })

    # Q2: Completion
    faqs.append({
        "question": f"When will {name} be completed?",
        "answer": f"{name} has an estimated completion date of {completion}. " +
                  f"The project is currently {(p.get('status') or '').replace('_', ' ').lower()}. " +
                  "Completion dates may be subject to change."
    })

    # Q3: Location
    faqs.append({
        "question": f"Where is {name} located?",
        "answer": f"{name} is located in {area}" +
                  (f" at {p['address']}" if p.get("address") else "") +
                  f". {area} is one of South Florida's premier neighborhoods, offering exceptional dining, shopping, and lifestyle amenities."
    })

    # Q4: Developer
    if dev_name:
        faqs.append({
            "question": f"Who is the developer of {name}?",
            "answer": f"{name} is being developed by {dev_name}. " +
                      f"The developer has a strong track record of delivering quality residential projects in South Florida."
        })

    # Q5: Building specs
    if units or floors:
        specs = f"{name} "
        parts = []
        if floors: parts.append(f"rises {floors} stories")
        if units: parts.append(f"features {units} residences")
        specs += " and ".join(parts) + ". "
        if p.get("unitTypes"):
            specs += f"Available unit types include {p['unitTypes']}."

        faqs.append({
            "question": f"How many units does {name} have?",
            "answer": specs
        })

    return faqs

# ── Main ──
print("Fetching all projects...")
projects = api_get("projects?select=*,neighborhood:neighborhoods(name,slug),developer:developers(name,slug)&limit=500")
print(f"  {len(projects)} projects to process")

updated = 0
skipped = 0

for p in projects:
    # Skip if already has SEO content
    if p.get("longDescription") and len(p.get("longDescription", "")) > 200:
        skipped += 1
        continue

    hood_name = p.get("neighborhood", {}).get("name") if p.get("neighborhood") else None
    dev_name = p.get("developer", {}).get("name") if p.get("developer") else None
    hood_slug = p.get("neighborhood", {}).get("slug") if p.get("neighborhood") else None

    # Get related projects (same neighborhood)
    related = []
    if p.get("neighborhoodId"):
        try:
            rel = api_get(f"projects?neighborhoodId=eq.{p['neighborhoodId']}&id=neq.{p['id']}&select=name,slug&limit=3")
            related = rel
        except:
            pass

    # Generate content
    long_desc = generate_content(p, hood_name, dev_name, related)
    meta_title, meta_desc = generate_meta(p, hood_name)
    faq = generate_faq(p, hood_name, dev_name)

    # Update
    pid = p["id"]
    success = api_patch(f"projects?id=eq.{pid}", {
        "longDescription": long_desc,
        "metaTitle": meta_title,
        "metaDescription": meta_desc,
        "faqJson": faq,
    })

    if success:
        print(f"  Updated: {p['name']}")
        updated += 1
    else:
        print(f"  ERROR: {p['name']}")

    time.sleep(0.1)

print(f"\nDone: {updated} updated, {skipped} skipped (already had content)")
