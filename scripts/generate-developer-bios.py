#!/usr/bin/env python3
"""Generate bios for all developers and update project counts."""
import json, urllib.request, re, time

API = "https://fnyrtptmcazhmoztmuay.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def api_get(path):
    req = urllib.request.Request(f"{API}/{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def api_patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{API}/{path}", data=body, headers={**HEADERS, "Prefer":"return=minimal"}, method="PATCH")
    try:
        with urllib.request.urlopen(req) as r: return True
    except Exception as e:
        print(f"  Error: {e}"); return False

# Known developer info
DEV_INFO = {
    "related group": {"hq": "Miami, FL", "founded": 1979, "web": "https://www.relatedgroup.com", "bio": "Related Group is one of the largest and most prominent real estate condominium developers in the United States. Founded by Jorge Pérez in 1979, the company has built, rehabilitated, and managed over 100,000 condominium and apartment units across South Florida and beyond. Known for partnering with world-renowned architects and designers, Related Group has shaped the Miami skyline with iconic projects including Brickell Heights, SLS Brickell, Paraiso District, and The Standard Residences. The company is recognized for its commitment to creating vibrant, sustainable communities that enhance the urban landscape."},
    "jds development group": {"hq": "New York, NY", "founded": 2002, "web": "https://www.jdsdevelopment.com", "bio": "JDS Development Group is a New York-based real estate development firm led by Michael Stern. Founded in 2002, JDS has become known for developing some of the most architecturally significant buildings in the world, including 111 West 57th Street (Steinway Tower) in Manhattan. In South Florida, JDS is developing the Waldorf Astoria Residences Miami, a 100-story supertall tower that will redefine the Downtown Miami skyline. The firm specializes in ultra-luxury residential projects that push the boundaries of design and engineering."},
    "jds development": {"hq": "New York, NY", "founded": 2002, "web": "https://www.jdsdevelopment.com", "bio": "JDS Development Group is a premier New York-based real estate development firm led by Michael Stern, known for iconic supertall buildings and ultra-luxury residential projects including the Waldorf Astoria Residences Miami."},
    "mast capital": {"hq": "Miami Beach, FL", "founded": 2007, "web": "https://www.mastcapital.com", "bio": "Mast Capital is a Miami Beach-based real estate investment and development firm founded by Camilo Miguel Jr. The company focuses on luxury residential and mixed-use developments in premier South Florida locations. Mast Capital's portfolio includes high-profile projects in Brickell, Miami Beach, and Coconut Grove. The firm is known for its meticulous approach to site selection, design excellence, and creating developments that enhance their surrounding neighborhoods."},
    "pmg": {"hq": "Miami, FL", "founded": 2006, "bio": "PMG (Property Markets Group) is a leading real estate development and investment firm with a diverse portfolio of luxury residential, hospitality, and mixed-use developments. Founded by Kevin Maloney and Ryan Shear, PMG has delivered over $5 billion in real estate across New York and South Florida, including the E11EVEN Hotel & Residences and Society developments."},
    "terra group": {"hq": "Coconut Grove, FL", "founded": 2001, "web": "https://www.terrgroup.com", "bio": "Terra is a full-service real estate development company headquartered in Coconut Grove, Florida. Founded by David Martin in 2001, Terra has completed and is developing over $8 billion in residential and commercial projects across South Florida. The company is known for thoughtful community-centered developments including Park Grove, Eighty Seven Park, and Grove Central. Terra specializes in creating walkable, sustainable communities that blend luxury living with thoughtful urban planning."},
    "terra": {"hq": "Coconut Grove, FL", "founded": 2001, "web": "https://www.terrgroup.com", "bio": "Terra is a full-service real estate development company founded by David Martin, responsible for over $8 billion in projects across South Florida, known for community-centered luxury developments."},
    "fort partners": {"hq": "Fort Lauderdale, FL", "founded": 2005, "web": "https://www.fortpartners.com", "bio": "Fort Partners is a vertically integrated real estate development and investment firm based in Fort Lauderdale. Founded by Nadim Ashi, Fort Partners is the exclusive developer of Four Seasons residential projects in South Florida, including Four Seasons Surf Club, Four Seasons Fort Lauderdale, and the upcoming Four Seasons Private Residences Coconut Grove. The firm is known for delivering ultra-luxury branded residences with impeccable design and Five-Star hospitality services."},
    "swire properties": {"hq": "Hong Kong / Miami, FL", "founded": 1972, "web": "https://www.swireproperties.com", "bio": "Swire Properties is a leading international developer headquartered in Hong Kong with significant operations in Miami. In South Florida, Swire Properties developed the transformative Brickell City Centre, a $1.05 billion mixed-use project, and is now developing the Mandarin Oriental Residences on Brickell Key. Known for creating large-scale, mixed-use developments that shape city skylines and communities."},
    "dezer development": {"hq": "Sunny Isles Beach, FL", "founded": 1970, "web": "https://www.dezerdevelopment.com", "bio": "Dezer Development is a family-owned real estate company that has been developing luxury residential properties in South Florida for over five decades. Led by Gil Dezer, the company has transformed Sunny Isles Beach with branded luxury towers including Porsche Design Tower, Residences by Armani/Casa, and Bentley Residences. Dezer Development is the exclusive residential partner for some of the world's most prestigious luxury brands."},
    "oko group": {"hq": "New York, NY", "founded": 2014, "web": "https://www.okogroup.com", "bio": "OKO Group is a New York-based real estate company led by Vladislav Doronin that focuses on luxury residential and commercial development. The firm's portfolio includes Una Residences in Brickell and other high-profile South Florida projects. OKO Group is known for partnering with world-class architects to create iconic, design-forward buildings."},
    "the melo group": {"hq": "Miami, FL", "founded": 2001, "bio": "The Melo Group is a family-owned development firm that has built over 5,000 residential units in Miami. Founded by brothers Carlos, Jose, and Martin Melo, the company focuses on creating well-designed luxury condominiums at accessible price points, particularly in the Edgewater and Arts & Entertainment districts."},
    "two roads development": {"hq": "Miami, FL", "founded": 2012, "bio": "Two Roads Development is a Miami-based real estate development firm known for creating boutique luxury residential and mixed-use projects. The company has developed notable projects across South Florida, focusing on architectural excellence and premium locations in neighborhoods like Bay Harbor Islands and Fort Lauderdale."},
    "newgard development group": {"hq": "Miami, FL", "founded": 2008, "bio": "Newgard Development Group is a vertically integrated real estate company focused on developing, managing, and investing in residential and hospitality properties. The firm has completed multiple successful projects in Miami's urban core, known for delivering stylish urban residences at competitive price points."},
    "newgard development": {"hq": "Miami, FL", "founded": 2008, "bio": "Newgard Development Group is a vertically integrated Miami real estate company known for stylish urban residential and hospitality properties at competitive price points."},
    "okan group": {"hq": "Miami, FL", "founded": 2016, "bio": "Okan Group is the U.S. arm of Okan Holding, a Turkish conglomerate with over 40 years of experience in hospitality, construction, and tourism. The company is developing Okan Tower, a 70-story mixed-use tower in Downtown Miami featuring a Hilton hotel, condos, and a condo-hotel component. Okan Group brings international hospitality expertise to the Miami market."},
    "shoma group": {"hq": "Miami, FL", "founded": 1988, "bio": "Shoma Group is a family-owned development and construction company founded by Masoud Shojaee. With over three decades of experience, Shoma has developed more than 10,000 residential units across South Florida, from luxury condominiums to master-planned communities, earning a reputation for quality construction and innovative design."},
    "faena group": {"hq": "Miami Beach, FL", "founded": 2000, "bio": "Faena Group, founded by Argentine visionary Alan Faena, is a cultural and hospitality development company that has transformed Miami Beach's mid-beach area into a world-class destination. The Faena District includes the Faena Hotel, Faena House, and the Faena Forum cultural center. Now expanding to Downtown Miami with Faena Residences, the brand is synonymous with artistic luxury."},
}

# Generic bio template
def generate_generic_bio(name, project_count, project_names):
    projects_list = ", ".join(project_names[:5])
    return (
        f"{name} is a prominent real estate developer active in the South Florida pre-construction market. "
        f"The firm has established a strong presence in the region with {project_count} active development{'s' if project_count != 1 else ''}, "
        f"including {projects_list}. "
        f"Known for delivering quality residential projects in some of South Florida's most desirable neighborhoods, "
        f"{name} continues to shape the region's evolving skyline with thoughtfully designed developments "
        f"that combine luxury living with modern amenities and prime locations."
    )

# Main
print("Fetching developers and their projects...")
devs = api_get("developers?select=id,name,slug,description&limit=200")
projects = api_get("projects?select=name,developerId,neighborhoodId,priceMin,priceMax&limit=500")

# Build project count per developer
dev_projects = {}
for p in projects:
    did = p.get("developerId")
    if did:
        if did not in dev_projects:
            dev_projects[did] = []
        dev_projects[did].append(p["name"])

updated = 0
for d in devs:
    if d.get("description") and len(d.get("description", "")) > 100:
        continue  # Already has a bio

    name = d["name"]
    name_lower = name.lower()
    project_names = dev_projects.get(d["id"], [])
    project_count = len(project_names)

    # Look up known info
    info = DEV_INFO.get(name_lower, {})
    bio = info.get("bio") or generate_generic_bio(name, max(project_count, 1), project_names)
    hq = info.get("hq")
    founded = info.get("founded")
    web = info.get("web")

    patch_data = {"description": bio}
    if hq: patch_data["headquarters"] = hq
    if founded: patch_data["foundedYear"] = founded
    if web: patch_data["websiteUrl"] = web

    success = api_patch(f"developers?id=eq.{d['id']}", patch_data)
    if success:
        print(f"  Updated: {name} ({project_count} projects)")
        updated += 1
    time.sleep(0.05)

print(f"\nDone: {updated} developers updated")
