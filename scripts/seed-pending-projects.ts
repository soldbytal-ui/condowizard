/**
 * Seed all pending Toronto pre-construction projects from Livabl
 * Clears existing placeholder/dummy projects, geocodes every address via Mapbox,
 * creates deduplicated developer profiles, and inserts all projects.
 *
 * Run: npx tsx scripts/seed-pending-projects.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^=\s#]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Types ──────────────────────────────────────────────────────────────────
interface ProjectData {
  name: string;
  developerStr: string; // raw, may contain " / " for joint ventures
  address: string;
}

// ─── All pending projects ────────────────────────────────────────────────────
const PROJECTS: ProjectData[] = [
  { name: '3091 Lawrence Avenue East Condos', developerStr: 'Infrastructure Ontario', address: '3091 Lawrence Avenue East, Toronto ON' },
  { name: 'The Georgian', developerStr: 'Gryphon Development', address: '2223 Gerrard Street East, Toronto ON' },
  { name: '123 Wynford Drive Condos', developerStr: 'Originate Developments / Westdale Properties / Cameron Stephens', address: '123 Wynford Drive, Toronto ON' },
  { name: '6125 Yonge Street Condos', developerStr: 'Arkfield', address: '6125 Yonge Street, Toronto ON' },
  { name: '33-37 Maitland Street Condos', developerStr: 'Carlyle Communities', address: '33 Maitland Street, Toronto ON' },
  { name: '1306-1310 The Queensway Condos', developerStr: 'Kingsett Capital', address: '1306 The Queensway, Toronto ON' },
  { name: '2026-2040 Queen Street East', developerStr: 'Crombie REIT', address: '2026 Queen Street East, Toronto ON' },
  { name: '895 Lawrence Avenue East Condos', developerStr: 'First Capital', address: '895 Lawrence Avenue East, Toronto ON' },
  { name: '1012-1018 Gerrard Street East', developerStr: 'Unknown', address: '1012 Gerrard Street East, Toronto ON' },
  { name: 'Addington Park', developerStr: 'Addington Developments', address: '268 Sheppard Avenue West, Toronto ON' },
  { name: '2654-2668 Bayview Avenue Condos', developerStr: 'Unknown', address: '2654 Bayview Avenue, Toronto ON' },
  { name: 'Centre on the Park', developerStr: 'Trolleybus Urban Development / BV Realty Partners', address: '16 Centre Avenue, Toronto ON' },
  { name: '3005 Sheppard Avenue East Condos', developerStr: 'Laurier Homes / Freshway Developments', address: '3005 Sheppard Avenue East, Toronto ON' },
  { name: 'Maxium 2257 Kingston Road', developerStr: 'Equiton Developments', address: '2257 Kingston Road, Toronto ON' },
  { name: '119-127 Church Street & 89 Queen Street East', developerStr: 'Spotlight Development / CentreCourt', address: '89 Queen Street East, Toronto ON' },
  { name: '147-151 Liberty Street Condos', developerStr: 'Intentional Capital', address: '147 Liberty Street, Toronto ON' },
  { name: '21-31 Windsor Street / 18 Buckingham / 60 Newcastle', developerStr: 'Diamante Development', address: '21 Windsor Street, Toronto ON' },
  { name: '503-511 Oakwood Avenue Condos', developerStr: 'Unknown', address: '503 Oakwood Avenue, Toronto ON' },
  { name: 'Cambridge Suites Redevelopment', developerStr: 'Centennial Hotels Limited', address: '15 Richmond Street East, Toronto ON' },
  { name: '191 Highbourne Road Condos', developerStr: 'Unknown', address: '191 Highbourne Road, Toronto ON' },
  { name: '124-136 Broadway Avenue Condos', developerStr: 'Reserve Properties / Westdale Properties', address: '124 Broadway Avenue, Toronto ON' },
  { name: '295 Jarvis Street Condos', developerStr: 'CentreCourt', address: '295 Jarvis Street, Toronto ON' },
  { name: 'Yonge & Churchill', developerStr: 'Arkfield', address: '5320 Yonge Street, Toronto ON' },
  { name: 'East Harbour Residential', developerStr: 'Cadillac Fairview', address: '21 Don Valley Parkway, Toronto ON' },
  { name: '438-440 Avenue Road Condos', developerStr: 'GALA Developments', address: '438 Avenue Road, Toronto ON' },
  { name: '10-18 Zorra Street Condos', developerStr: 'Altree Developments', address: '10 Zorra Street, Toronto ON' },
  { name: 'Arcadia District Tower C', developerStr: 'EllisDon', address: '60 Fieldway Road, Toronto ON' },
  { name: '5-15 Denarda Street Condos', developerStr: 'Kingsett Capital', address: '5 Denarda Street, Toronto ON' },
  { name: '372 Yonge Street Condos', developerStr: 'Yonge & Gerrard Partners / Trimed / Turbo-Mac', address: '372 Yonge Street, Toronto ON' },
  { name: '1260 Kennedy Road Condos', developerStr: 'Unknown', address: '1260 Kennedy Road, Scarborough ON' },
  { name: '130-134 Parliament Street Condos', developerStr: 'Lamb Development Corp', address: '134 Parliament Street, Toronto ON' },
  { name: '4181 Sheppard Avenue East Condos', developerStr: 'Unknown', address: '4181 Sheppard Avenue East, Toronto ON' },
  { name: '3431-3449 St Clair Ave East & 67 Elfreda Blvd', developerStr: 'Atria Development', address: '3431 Saint Clair Avenue East, Toronto ON' },
  { name: '5-43 Junction Road Condos', developerStr: 'DiamondCorp', address: '43 Junction Road, Toronto ON' },
  { name: '16-26 Cosburn Avenue Condos', developerStr: 'Kingsett Capital', address: '16 Cosburn Avenue, Toronto ON' },
  { name: '2128 Yonge Street Condos', developerStr: 'Reserve Properties', address: '2128 Yonge Street, Toronto ON' },
  { name: '26 Laing Street Condos', developerStr: 'Sud Group', address: '26 Laing Street, Toronto ON' },
  { name: '6150-6160 Yonge Street / 18 Goulding / 9-11 Pleasant', developerStr: 'Sorbara Group', address: '6150 Yonge Street, Toronto ON' },
  { name: '145 Wellington West & 53-55 Simcoe Street', developerStr: 'H&R REIT', address: '145 Wellington Street West, Toronto ON' },
  { name: '54-70 Brownlow Avenue Condos', developerStr: 'The Benvenuto Group', address: '54 Brownlow Avenue, Toronto ON' },
  { name: '120 Eglinton Avenue East Condos', developerStr: 'Unknown', address: '120 Eglinton Avenue East, Toronto ON' },
  { name: '906 Yonge Street / 25 McMurrich Street', developerStr: 'The Gupta Group / Eastons Group', address: '906 Yonge Street, Toronto ON' },
  { name: '239-255 Dundas Street East Condos', developerStr: 'Metropia / Greybrook Realty Partners', address: '239 Dundas Street East, Toronto ON' },
  { name: 'Jane and Finch Mall Redevelopment Phase 1', developerStr: 'Unknown', address: '1911 Finch Avenue West, Toronto ON' },
  { name: 'The Bridleton', developerStr: '95 Developments', address: '3268 Finch Avenue East, Toronto ON' },
  { name: 'Aspen at Pinnacle Etobicoke', developerStr: 'Pinnacle International', address: '65 Thomas Riley Road, Toronto ON' },
  { name: '660 Eglinton Avenue East Condos', developerStr: 'Concert Properties', address: '660 Eglinton Avenue East, Toronto ON' },
  { name: '10 Lower Spadina Avenue Condos', developerStr: 'Arkfield', address: '10 Lower Spadina Avenue, Toronto ON' },
  { name: '1744 Dundas Street West Condos', developerStr: 'Unknown', address: '1744 Dundas Street West, Toronto ON' },
  { name: '245-255 Morningside Avenue Condos', developerStr: 'First Capital', address: '255 Morningside Avenue, Toronto ON' },
  { name: '3174 Eglinton Avenue East Condos', developerStr: 'NJS Capital', address: '3174 Eglinton Avenue East, Toronto ON' },
  { name: '415 Broadview Avenue', developerStr: 'LCH Developments', address: '415 Broadview Avenue, Toronto ON' },
  { name: '100-114 Finch Avenue East Condos', developerStr: 'Regency Development', address: '104 Finch Avenue East, Toronto ON' },
  { name: 'Lawrence Plaza Redevelopment', developerStr: 'RioCan Living', address: '490 Lawrence Avenue West, Toronto ON' },
  { name: 'Ava Luxury Residence', developerStr: 'NVSBLE Development', address: '50 Finch Avenue East, Toronto ON' },
  { name: 'Sugar Wharf Condominiums Phase 2', developerStr: 'Menkes Developments', address: '55 Lake Shore Boulevard East, Toronto ON' },
  { name: 'Maison Wellesley', developerStr: 'Graywood Developments', address: '506 Church Street, Toronto ON' },
  { name: '9 Benlamond Avenue Condos', developerStr: 'Unknown', address: '9 Benlamond Avenue, Toronto ON' },
  { name: '5-19 Cosburn Avenue / 8-40 Gowan Avenue', developerStr: 'Marlin Spring / Greybrook Realty Partners', address: '5 Cosburn Avenue, Toronto ON' },
  { name: '4926 Bathurst Street Condos', developerStr: 'Portal Developments', address: '4926 Bathurst Street, Toronto ON' },
  { name: 'Angular (former)', developerStr: 'Daffodil Developments', address: '1001 Broadview Avenue, Toronto ON' },
  { name: '15 Charles Street East Condos', developerStr: 'Republic Developments', address: '15 Charles Street East, Toronto ON' },
  { name: '2451-2495 Danforth Avenue Condos', developerStr: 'First Capital', address: '2451 Danforth Avenue, Toronto ON' },
  { name: '8-26 Jopling Avenue South Condos', developerStr: 'Tribute Communities / Greybrook Realty Partners', address: '8 Jopling Avenue South, Toronto ON' },
  { name: '172-186 Finch Avenue West Condos', developerStr: 'Trulife Developments', address: '172 Finch Avenue West, Toronto ON' },
  { name: '543-555 Yonge Street Condos', developerStr: 'CentreCourt / Fitzrovia / Choice Properties', address: '543 Yonge Street, Toronto ON' },
  { name: '12-20 Bentworth Avenue Condos', developerStr: 'Dawson Wales Global', address: '12 Bentworth Avenue, Toronto ON' },
  { name: '11-23 Hollis Street Condos', developerStr: 'Gairloch Developments', address: '15 Hollis Street, Toronto ON' },
  { name: '5400 Yonge Street & 15 Horsham Avenue', developerStr: 'Fieldgate Urban', address: '5400 Yonge Street, Toronto ON' },
  { name: '1745-1753 St Clair Avenue West Condos', developerStr: 'Kultura', address: '1745 Saint Clair Avenue West, Toronto ON' },
  { name: 'Kingston Road & Danforth Avenue Condos', developerStr: 'Lev Living', address: 'Kingston Road & Danforth Avenue, Toronto ON' },
  { name: '1423-1437 Bloor Street West / 278 Sterling Road', developerStr: 'Kingsett Capital', address: '1423 Bloor Street West, Toronto ON' },
  { name: '2499-2525 Victoria Park Avenue Condos', developerStr: 'SmartLiving', address: '2499 Victoria Park Avenue, Toronto ON' },
  { name: '98-100 Bond Street Condos', developerStr: 'BAZIS', address: '98 Bond Street, Toronto ON' },
  { name: 'The Sterling Automotive', developerStr: 'Lamb Development Corp', address: '1405 Bloor Street West, Toronto ON' },
  { name: '466-468 Dovercourt Road Condos', developerStr: 'KamMor Developments', address: '466 Dovercourt Road, Toronto ON' },
  { name: '290 Old Weston Road Condos', developerStr: 'i-Squared Developments', address: '290 Old Weston Road, Toronto ON' },
  { name: 'Westside Mall Redevelopment Phase 1', developerStr: 'SmartLiving', address: '2400 Eglinton Avenue West, Toronto ON' },
  { name: 'The Clair', developerStr: 'Great Gulf / Terracap', address: '1421 Yonge Street, Toronto ON' },
  { name: '20 Broadoaks Drive & 11 Catford Road', developerStr: 'Sorbara Group', address: '11 Catford Road, Toronto ON' },
  { name: 'Sequence Condos', developerStr: 'LeBANC Development', address: '1221 Markham Road, Toronto ON' },
  { name: '1400-1411 Victoria Park Avenue Condos', developerStr: 'Leader Lane Developments', address: '1400 Victoria Park Avenue, Toronto ON' },
  { name: '710 Progress Avenue Condos', developerStr: 'Unknown', address: '710 Progress Avenue, Toronto ON' },
  { name: '6167 Yonge Street Condos', developerStr: 'Republic Developments', address: '6167 Yonge Street, Toronto ON' },
  { name: '245 Queen Street East Condos', developerStr: 'ONE Properties', address: '245 Queen Street East, Toronto ON' },
  { name: 'One Bloor West', developerStr: 'Tridel', address: '1 Bloor Street West, Toronto ON' },
  { name: 'K2 Residences', developerStr: 'Unknown', address: '1552 Kingston Road, Toronto ON' },
  { name: '4195-4221 Dundas Street West', developerStr: 'Dunpar Homes', address: '4195 Dundas Street West, Toronto ON' },
  { name: '3175-3181 Sheppard Avenue East Condos', developerStr: 'Doran Homes', address: '3175 Sheppard Avenue East, Toronto ON' },
  { name: '135 Isabella Street Condos', developerStr: 'Kingsett Capital', address: '135 Isabella Street, Toronto ON' },
  { name: 'Liberty Yard', developerStr: 'First Capital', address: '61 Hanna Avenue, Toronto ON' },
  { name: '48 Grenoble Drive Condos', developerStr: 'Tenblock', address: '48 Grenoble Drive, Toronto ON' },
  { name: '3585 Lawrence Avenue East Condos', developerStr: 'Unknown', address: '3585 Lawrence Avenue East, Toronto ON' },
  { name: 'M2M Squared South Tower', developerStr: 'Aoyuan International', address: '5915 Yonge Street, Toronto ON' },
  { name: '53-55 Yonge Street Condos', developerStr: 'H&R REIT', address: '53 Yonge Street, Toronto ON' },
  { name: '170 Spadina Avenue Condos', developerStr: 'Plaza', address: '170 Spadina Avenue, Toronto ON' },
  { name: '2402-2418 Dufferin Street & 4-10 Ramsden Road', developerStr: 'Lindvest', address: '2402 Dufferin Street, Toronto ON' },
  { name: '680 Sheppard Avenue East Condos', developerStr: 'Tribute Communities / Greybrook Realty Partners', address: '680 Sheppard Avenue East, Toronto ON' },
  { name: 'The Leaside', developerStr: 'Emblem Developments / Core Development Group', address: '126 Laird Drive, Toronto ON' },
  { name: '611-623 Keele Street Condos', developerStr: 'DiamondCorp', address: '611 Keele Street, Toronto ON' },
  { name: '141 Roehampton Avenue Condos', developerStr: 'Lifetime Developments', address: '141 Roehampton Avenue, Toronto ON' },
  { name: '126 Union Street Condos', developerStr: 'Unknown', address: '126 Union Street, Toronto ON' },
  { name: '350 Bloor Street East Condos', developerStr: 'Osmington Gerofsky Development', address: '350 Bloor Street East, Toronto ON' },
  { name: '2908 Yonge Street Condos', developerStr: 'Latch Developments / First Avenue', address: '2908 Yonge Street, Toronto ON' },
  { name: '375 Kennedy Road Condos', developerStr: 'Laurier Homes / Paradise Developments', address: '375 Kennedy Road, Toronto ON' },
  { name: '3195 Sheppard Avenue East Condos', developerStr: 'Unknown', address: '3195 Sheppard Avenue East, Toronto ON' },
  { name: '20 Brentcliffe Road Condos', developerStr: 'DiamondCorp', address: '20 Brentcliffe Road, Toronto ON' },
  { name: 'Long Branch Tower', developerStr: 'Unknown', address: '3807 Lake Shore Boulevard West, Toronto ON' },
  { name: 'Grain Lofts', developerStr: 'Gairloch Developments', address: '1650 Dupont Street, Toronto ON' },
  { name: '1 Deauville Lane Condos', developerStr: 'Stanford Homes', address: '1 Deauville Lane, Toronto ON' },
  { name: '3326 Bloor Street West Building B', developerStr: 'CreateTO', address: '3326 Bloor Street West, Toronto ON' },
  { name: '150 Bronoco Avenue Condos', developerStr: 'i-Squared Developments', address: '150 Bronoco Avenue, Toronto ON' },
  { name: '4174 Dundas Street West Condos', developerStr: 'Dunpar Homes', address: '4174 Dundas Street West, Toronto ON' },
  { name: '20-22 Metropolitan Road Condos', developerStr: 'Sunray Group', address: '22 Metropolitan Road, Toronto ON' },
  { name: '77 Roehampton Avenue Condos', developerStr: 'Westdale Properties / Reserve Properties', address: '77 Roehampton Avenue, Toronto ON' },
  { name: '40-48 Hendon Avenue Condos', developerStr: 'Matrix Development Group', address: '40 Hendon Avenue, Toronto ON' },
  { name: 'The Hill', developerStr: 'Metropia', address: '1406 Yonge Street, Toronto ON' },
  { name: 'Theo Condos', developerStr: 'Condoman Developments / Grove Inc', address: '1030 Danforth Avenue, Toronto ON' },
  { name: 'Spadina Adelaide Square', developerStr: 'Fengate', address: '46 Charlotte Street, Toronto ON' },
  { name: '211 Symington Avenue Condos', developerStr: 'Oikoi Living', address: '211 Symington Avenue, Toronto ON' },
  { name: '1285-1325 Finch Avenue West / 30 Tangiers Road', developerStr: 'CTN Developments', address: '1315 Finch Avenue West, Toronto ON' },
  { name: '1956-1986 Weston Road Condos', developerStr: 'Weston Asset Management', address: '1956 Weston Road, Toronto ON' },
  { name: '1304-1318 King Street West & 143-145 Cowan Avenue', developerStr: 'Kingsett Capital', address: '1304 King Street West, Toronto ON' },
  { name: '21-53 Broadview Avenue Condos', developerStr: 'Streetcar Developments / Dream', address: '21 Broadview Avenue, Toronto ON' },
  { name: '2500 Don Mills Road Condos and Townhomes', developerStr: 'Marlin Spring Developments', address: '2500 Don Mills Road, Toronto ON' },
  { name: '5203-5215 Yonge Street Condos', developerStr: 'Inmino Developments', address: '5205 Yonge Street, Toronto ON' },
  { name: 'Birchaus Residences', developerStr: 'Altree Developments', address: '1615 Kingston Road, Toronto ON' },
  { name: '1779-1787 Bayview Avenue Condos', developerStr: 'CountryWide Homes / Condor Properties', address: '1779 Bayview Avenue, Toronto ON' },
  { name: '536-538 St Clair Avenue West Condos', developerStr: 'DiamondCorp', address: '536 Saint Clair Avenue West, Toronto ON' },
  { name: '467 Wellington Street West Condos', developerStr: 'SmartLiving', address: '467 Wellington Street West, Toronto ON' },
  { name: '6200 Yonge Street Condos', developerStr: 'Trulife Developments / Arkfield', address: '6200 Yonge Street, Toronto ON' },
  { name: 'Yonge and Birch Residences', developerStr: 'Woodcliffe Landmark Properties', address: '1196 Yonge Street, Toronto ON' },
  { name: '73-83 Woodbine Avenue Condos', developerStr: 'Beachwood Realty', address: '73 Woodbine Avenue, Toronto ON' },
  { name: 'Valhalla Village Phase 2', developerStr: 'Unknown', address: '300 The East Mall, Toronto ON' },
  { name: 'The Garden Series on Finch', developerStr: '95 Developments', address: '2930 Finch Avenue East, Toronto ON' },
  { name: '8-18 Camden Street Condos', developerStr: 'Lamb Development Corp', address: '8 Camden Street, Toronto ON' },
  { name: 'Shoppes on Steeles Phase 3', developerStr: 'Streamliner Properties / Minett Capital', address: '2880 Steeles Avenue East, Markham ON' },
  { name: '1175-1181 Weston Road / 7-17 Locust Street', developerStr: 'Kingsett Capital', address: '7 Locust Street, Toronto ON' },
  { name: 'Upper Junction II', developerStr: 'Marlin Spring / Greybrook Realty Partners', address: '2231 Saint Clair Avenue West, Toronto ON' },
  { name: 'Main Square Condo', developerStr: 'Tri-Metro Investments', address: '2721 Danforth Avenue, Toronto ON' },
  { name: '1-20 Adriatic Road Condos', developerStr: 'Trolleybus Urban Development', address: '1 Adriatic Road, Toronto ON' },
  { name: '789-793 Don Mills Road / 10 Ferrand Drive Phase 1', developerStr: 'Menkes Developments', address: '793 Don Mills Road, Toronto ON' },
  { name: '68 Wellesley Street East Condos', developerStr: 'Kingsett Capital', address: '68 Wellesley Street East, Toronto ON' },
  { name: 'The Leaside I', developerStr: 'Core Development Group / Emblem Developments / Fiera Real Estate', address: '138 Laird Drive, Toronto ON' },
  { name: '21-25 Imperial Street Condos', developerStr: 'Resident / Dream', address: '25 Imperial Street, Toronto ON' },
  { name: '1125 Markham Road Condos', developerStr: 'Arya Corporation / Venetian Development', address: '1125 Markham Road, Toronto ON' },
  { name: '2256 Lake Shore Boulevard West Condos', developerStr: 'Unknown', address: '2256 Lake Shore Boulevard West, Toronto ON' },
  { name: '2956-2990 Eglinton Avenue East Condos', developerStr: 'RioCan Living', address: '2956 Eglinton Avenue East, Toronto ON' },
  { name: 'The Bayview', developerStr: 'Dormer Homes / Osmington Gerofsky', address: '2810 Bayview Avenue, Toronto ON' },
  { name: '2 Tippett Road Condos', developerStr: 'Urban Capital', address: '2 Tippett Road, Toronto ON' },
  { name: '17-25 Toronto Street & 55-57 Adelaide East', developerStr: 'Goband Development', address: '23 Toronto Street, Toronto ON' },
  { name: '799 Brimley Road Condos', developerStr: 'Accurate Designs', address: '799 Brimley Road, Toronto ON' },
  { name: '38 Walmer Road Condos', developerStr: 'TAS', address: '38 Walmer Road, Toronto ON' },
  { name: '1978-2002 Lake Shore Boulevard West', developerStr: 'Marlin Spring / Greybrook Realty Partners', address: '1978 Lake Shore Boulevard West, Toronto ON' },
  { name: 'Pier 27 Phase 3 Bldg F', developerStr: 'Cityzen', address: '25 Queens Quay East, Toronto ON' },
  { name: '2189 Lake Shore Boulevard West Condos', developerStr: 'Marlin Spring Developments', address: '2189 Lake Shore Boulevard West, Toronto ON' },
  { name: '922 Millwood Road Condos', developerStr: 'Hamar Millwood Investments', address: '922 Millwood Road, Toronto ON' },
  { name: '383-387 Sherbourne Street Condos', developerStr: 'NJS Capital', address: '383 Sherbourne Street, Toronto ON' },
  { name: '3291 Kingston Road Condos & Townhomes', developerStr: 'LCH Developments', address: '3291 Kingston Road, Toronto ON' },
  { name: 'Valhalla Town Square Tower E', developerStr: 'Edilcan Development Corporation', address: '2 Gibbs Road, Toronto ON' },
  { name: '1911-1921 Eglinton Avenue Condos', developerStr: 'Unknown', address: '1911 Eglinton Avenue East, Toronto ON' },
  { name: 'Chelsea Green Delta Chelsea Bldgs B&C', developerStr: 'Great Eagle Holdings', address: '33 Gerrard Street West, Toronto ON' },
  { name: '5-15 Tangreen Court Condos', developerStr: 'CentreCourt', address: '5 Tangreen Court, Toronto ON' },
  { name: '250-258 Viewmount Avenue Condos', developerStr: 'Chestnut Hill Developments', address: '250 Viewmount Avenue, Toronto ON' },
  { name: 'Wynford Gardens', developerStr: 'Freed Developments / Fengate', address: '175 Wynford Drive, Toronto ON' },
  { name: 'Six Points Plaza Phase 1', developerStr: 'Liberty Development Corporation', address: '3825 Bloor Street West, Toronto ON' },
  { name: '672-676 Birchmount Road Condos', developerStr: 'Insoho Developments', address: '672 Birchmount Road, Toronto ON' },
  { name: '239-247 Yonge Street Condos', developerStr: 'Angel Developments', address: '239 Yonge Street, Toronto ON' },
  { name: '262-266 St George Street Condos', developerStr: 'Unknown', address: '262 Saint George Street, Toronto ON' },
  { name: '1233 Yonge Street & 9 Woodlawn Avenue East', developerStr: 'Plaza', address: '1233 Yonge Street, Toronto ON' },
  { name: '1050 Markham Road Condos', developerStr: 'Unknown', address: '1050 Markham Road, Toronto ON' },
  { name: '307 Lake Shore Boulevard East Condos', developerStr: 'Resident', address: '307 Lake Shore Boulevard East, Toronto ON' },
  { name: '1053 Don Mills Road / 2-6 The Donway East', developerStr: 'Resident', address: '1053 Don Mills Road, Toronto ON' },
  { name: 'Dragon Centre Condominiums', developerStr: 'Shiu Pong Group', address: '23 Glen Watford Drive, Toronto ON' },
  { name: 'Spirits Residences', developerStr: 'Lanterra Developments / Cadillac Fairview', address: '169 The Donway West, Toronto ON' },
  { name: '120 Bouchette Street Condos', developerStr: 'Unknown', address: '120 Bouchette Street, Toronto ON' },
  { name: 'East Beach Condos', developerStr: 'Feeley Group', address: '1111 Kingston Road, Toronto ON' },
  { name: 'United Kingsway', developerStr: 'Fieldgate Urban / Sevoy Developments', address: '2915 Bloor Street West, Toronto ON' },
  { name: '120-128 Sheppard Avenue West Condos', developerStr: 'Hub Development Group', address: '120 Sheppard Avenue West, Toronto ON' },
  { name: '477 Mount Pleasant Road Condos', developerStr: 'The Muzzo Group', address: '477 Mount Pleasant Road, Toronto ON' },
  { name: '95 Saint Joseph Street Condos', developerStr: 'The Daniels Corporation / Amica Senior Lifestyles', address: '95 Saint Joseph Street, Toronto ON' },
  { name: '245-255 Sheppard Avenue West Condos and Townhomes', developerStr: 'PineLake Group / JFJ Development', address: '245 Sheppard Avenue West, Toronto ON' },
  { name: '685 Warden Avenue Condos', developerStr: 'Choice Properties', address: '685 Warden Avenue, Toronto ON' },
  { name: '190 Sterling Road Block 3B', developerStr: 'Marlin Spring Developments', address: '150 Sterling Road, Toronto ON' },
  { name: '4949 Bathurst Avenue Condos', developerStr: 'Unknown', address: '4949 Bathurst Street, Toronto ON' },
  { name: '1875 Steeles Avenue West Condos', developerStr: 'Tenblock', address: '1875 Steeles Avenue West, Toronto ON' },
  { name: '1675-1685 Eglinton Avenue West Condos', developerStr: 'Unknown', address: '1675 Eglinton Avenue West, Toronto ON' },
  { name: '5051-5061 Yonge Street Condos', developerStr: 'Sevoy Developments', address: '5051 Yonge Street, Toronto ON' },
  { name: '2350-2352 Yonge Street Condos', developerStr: 'BAZIS', address: '2350 Yonge Street, Toronto ON' },
  { name: '2453-2469 Bloor Street West Condos', developerStr: 'Leader Lane Developments / Windmill Developments', address: '2453 Bloor Street West, Toronto ON' },
  { name: '321-355 Symington Avenue Condos', developerStr: 'European Bakery Supply', address: '339 Symington Avenue, Toronto ON' },
  { name: '475 Yonge Street Condos', developerStr: 'Kingsett Capital', address: '475 Yonge Street, Toronto ON' },
  { name: 'Cumberland Square Phase 2', developerStr: 'Kingsett Capital', address: '2 Bloor Street West, Toronto ON' },
  { name: 'Woodside Square Redevelopment', developerStr: '95 Developments', address: '1571 Sandhurst Circle, Toronto ON' },
  { name: '23-27 Poyntz Avenue Condos', developerStr: 'Central Capital Realty', address: '23 Poyntz Avenue, Toronto ON' },
  { name: '1134 Queen Street East Condos', developerStr: 'Lamb Development Corp', address: '1134 Queen Street East, Toronto ON' },
  { name: 'Bella Condominiums', developerStr: 'Mirabella Development Corporation', address: '5300 Yonge Street, Toronto ON' },
  { name: '2451 Dufferin Street Condos', developerStr: 'Republic Developments', address: '2451 Dufferin Street, Toronto ON' },
  { name: 'Camden House', developerStr: 'Lamb Development Corp', address: '39 Camden Street, Toronto ON' },
  { name: '1235-1255 Bay Street Condos', developerStr: 'Kingsett Capital', address: '1255 Bay Street, Toronto ON' },
  { name: '2636-2564 Eglinton Avenue West Condos', developerStr: 'Fora Developments', address: '2636 Eglinton Avenue West, Toronto ON' },
  { name: '1798-1812 Weston Road Condos', developerStr: 'Castlepoint Numa', address: '1800 Weston Road, Toronto ON' },
  { name: 'Lawrence Parktown Residences', developerStr: 'Lawrence Parktown Residences', address: '49 Lawrence Avenue East, Toronto ON' },
  { name: '25 Photography Drive Condos', developerStr: 'Choice Properties', address: '25 Photography Drive, Toronto ON' },
  { name: '1543-1551 The Queensway Condos', developerStr: 'Unknown', address: '1543 The Queensway, Toronto ON' },
  { name: '5576 Yonge Street Condos', developerStr: 'Golfour Property Services', address: '5576 Yonge Street, Toronto ON' },
  { name: '3374 Keele Street Condos', developerStr: 'Unknown', address: '3374 Keele Street, Toronto ON' },
  { name: 'Bay and Edward Condos', developerStr: 'The Conservatory Group', address: '100 Edward Street, Toronto ON' },
  { name: '158 Sterling Road Block 5B&C', developerStr: 'Marlin Spring Developments', address: '158 Sterling Road, Toronto ON' },
  { name: 'Radiator', developerStr: 'Hullmark', address: '340 Dufferin Street, Toronto ON' },
  { name: '3309-3317 Dufferin Street Condos', developerStr: 'Dash Developments', address: '3309 Dufferin Street, Toronto ON' },
  { name: '545 Lake Shore Boulevard West Block B', developerStr: 'Canderel Residential', address: '545 Lake Shore Boulevard West, Toronto ON' },
  { name: 'Malvern Mall Redevelopment Phase 1', developerStr: 'Davpart', address: '31 Tapscott Road, Toronto ON' },
  { name: '309 Cherry Street Condos', developerStr: 'Castlepoint Numa / Cityzen', address: '309 Cherry Street, Toronto ON' },
  { name: '327 Royal York Road Condos', developerStr: 'Vandyk Properties / Kingsett Capital', address: '315 Royal York Road, Toronto ON' },
  { name: '180 Dundas Street West / 123 Edward Street', developerStr: 'Crown Realty Partners', address: '180 Dundas Street West, Toronto ON' },
  { name: '5800 Yonge Street West Parcel', developerStr: 'Times Group Corporation', address: '5800 Yonge Street, Toronto ON' },
  { name: '189-195 Old Weston Road Condos', developerStr: 'Limen', address: '189 Old Weston Road, Toronto ON' },
  { name: 'Crosstown Remaining Blocks', developerStr: 'Aspen Ridge Homes', address: '844 Don Mills Road, Toronto ON' },
  { name: 'Clubhouse Condominiums', developerStr: 'Atria Development', address: '1376 Kingston Road, Toronto ON' },
  { name: '44-46 Romfield Drive Condos', developerStr: 'The Muzzo Group', address: '44 Romfield Drive, Toronto ON' },
  { name: '5 Huntley Street & 2-8 Earl Street Condos', developerStr: 'Unknown', address: '5 Huntley Street, Toronto ON' },
  { name: 'Don Valley Reconnects', developerStr: 'Cityzen / Tercot Communities / Greybrook Realty Partners', address: '155 Saint Dennis Drive, Toronto ON' },
  { name: '34 King Street East', developerStr: 'Larco Investments', address: '34 King Street East, Toronto ON' },
  { name: 'Warden & Finch', developerStr: 'DBS Developments', address: 'Warden Avenue & Finch Avenue East, Toronto ON' },
  { name: 'Beltline Yards', developerStr: 'Hullmark', address: '250 Bowie Avenue, Toronto ON' },
  { name: '2630 Kipling Avenue Condos', developerStr: 'Petrogold', address: '2630 Kipling Avenue, Toronto ON' },
  { name: 'The Inclusive Condo', developerStr: 'Spotlight Development', address: '1635 Lawrence Avenue West, Toronto ON' },
  { name: 'Revel Condos', developerStr: 'Eden Oak', address: '3418 Lake Shore Boulevard West, Toronto ON' },
  { name: '505 University Avenue Condos', developerStr: 'Cartareal Corporation', address: '505 University Avenue, Toronto ON' },
  { name: '3406-3434 Weston Road Condos', developerStr: 'Pinemount Developments / Elysium Investments', address: '3406 Weston Road, Toronto ON' },
  { name: '2600 Don Mills Road Condos', developerStr: 'Unknown', address: '2600 Don Mills Road, Toronto ON' },
  { name: '1650 Military Trail Condos', developerStr: 'Altree Developments', address: '1650 Military Trail, Toronto ON' },
  { name: '5359 Dundas Street West Condos', developerStr: 'CentreCourt', address: '5359 Dundas Street West, Toronto ON' },
  { name: '1410-1416 Eglinton Avenue West Condos', developerStr: 'Starbank Development Group', address: '1410 Eglinton Avenue West, Toronto ON' },
  { name: '1 Greenbriar Road / 635 Sheppard Avenue East', developerStr: 'AC Development', address: '1 Greenbriar Road, Toronto ON' },
  { name: 'Estonian House Redevelopment', developerStr: 'Diamond Kilmer Developments', address: '954 Broadview Avenue, Toronto ON' },
  { name: 'Quayside Block 2', developerStr: 'Great Gulf / Dream', address: '259 Lake Shore Boulevard East, Toronto ON' },
  { name: '2079-2111 Yonge Street / Hillsdale / Manor Road East', developerStr: 'Glen Corporation', address: '2111 Yonge Street, Toronto ON' },
  { name: '1575 Lawrence Avenue West Condos', developerStr: 'Courage Investment', address: '1575 Lawrence Avenue West, Toronto ON' },
  { name: '334-350 Bloor Street West / 2-6 Spadina Road', developerStr: 'The Brown Group / Andrin Homes / Lakeview Homes / Streetwise Capital', address: '350 Bloor Street West, Toronto ON' },
  { name: '155 Wychwood Avenue Condos', developerStr: 'Sinocoin Capital', address: '155 Wychwood Avenue, Toronto ON' },
  { name: '931 Yonge Street Condos', developerStr: 'CreateTO', address: '931 Yonge Street, Toronto ON' },
  { name: '15 Toronto Street Condos', developerStr: 'Madison Group', address: '15 Toronto Street, Toronto ON' },
  { name: 'The Rays', developerStr: 'Atria Development', address: '395 Leslie Street, Toronto ON' },
  { name: '266-288 Royal York Road Condos', developerStr: 'Sevoy Developments', address: '266 Royal York Road, Toronto ON' },
  { name: '247-251 Roehampton Avenue Condos', developerStr: 'Westdale Properties / Reserve Properties', address: '247 Roehampton Avenue, Toronto ON' },
  { name: '646-664 Yonge Street Condos', developerStr: 'Kingsett Capital', address: '646 Yonge Street, Toronto ON' },
  { name: '2313-2323 Lake Shore Boulevard West Condos', developerStr: 'Unknown', address: '2313 Lake Shore Boulevard West, Toronto ON' },
  { name: '250 Bowie Avenue Condos', developerStr: 'Hullmark', address: '250 Bowie Avenue, Toronto ON' },
  { name: '2801 Keele Street & 6 Paxtonia Boulevard', developerStr: 'Trinity Point Developments', address: '2801 Keele Street, Toronto ON' },
  { name: 'Southport in Swansea Phase 2', developerStr: 'State Building Group', address: '34 Southport Street, Toronto ON' },
  { name: 'Grand Park Village Phase 1', developerStr: 'Minto Group / Trolleybus Urban Development', address: '10 Audley Street, Toronto ON' },
  { name: '425 Bloor Street West Condos', developerStr: 'The Brown Group / Andrin Homes / Streetwise Capital / Lakeview Homes', address: '425 Bloor Street West, Toronto ON' },
  { name: '985 Woodbine Avenue and 2078-2106 Danforth Avenue', developerStr: 'Choice Properties', address: '985 Woodbine Avenue, Toronto ON' },
  { name: 'Burbank Heights', developerStr: 'Sky Property Group', address: '720 Sheppard Avenue East, Toronto ON' },
  { name: '8-14 Brock Avenue / 1354-1360 Queen Street West', developerStr: 'Kingsett Capital', address: '1354 Queen Street West, Toronto ON' },
  { name: 'Agincourt Mall Block 7', developerStr: 'North American Development Group', address: '3850 Sheppard Avenue East, Toronto ON' },
  { name: 'The BrickHouse on Gladstone', developerStr: 'Condoman Developments', address: '37 Gladstone Avenue, Toronto ON' },
  { name: '150 Clonmore Drive Condos', developerStr: 'Core Development Group', address: '150 Clonmore Drive, Toronto ON' },
  { name: '50-52 Neptune Drive Condos', developerStr: 'Dash Developments', address: '50 Neptune Drive, Toronto ON' },
  { name: '7 St Dennis Drive & 10 Grenoble Drive', developerStr: 'Osmington Gerofsky / WJ Properties', address: '10 Grenoble Drive, Toronto ON' },
  { name: '4665 Steeles Avenue East Condos', developerStr: 'LeBANC Development', address: '4665 Steeles Avenue East, Toronto ON' },
  { name: '1251-1303 Yonge Street Condos', developerStr: 'Aspen Ridge Homes', address: '1303 Yonge Street, Toronto ON' },
  { name: '849 Eglinton Avenue East Condos', developerStr: 'The Muzzo Group / Pemberton Group', address: '849 Eglinton Avenue East, Toronto ON' },
  { name: '1802 Bayview Avenue Condos', developerStr: 'Gairloch Developments / Harlo Capital', address: '1802 Bayview Avenue, Toronto ON' },
  { name: '145 St George Street Condos', developerStr: 'Tenblock', address: '145 Saint George Street, Toronto ON' },
  { name: '3100-3200 Bloor Street West / 4-8 Montgomery Road', developerStr: 'Tridel', address: '3100 Bloor Street West, Toronto ON' },
  { name: '461 Sheppard Avenue East Condos', developerStr: 'Canderel Residential / Haven Developments', address: '461 Sheppard Avenue East, Toronto ON' },
  { name: '3095 Eglinton Avenue East Condos', developerStr: 'Artlife Developments', address: '3095 Eglinton Avenue East, Toronto ON' },
  { name: '1837-1845 Bayview Avenue Condos', developerStr: 'The Gupta Group / Eastons Group', address: '1837 Bayview Avenue, Toronto ON' },
  { name: '3 Swift Drive Condos', developerStr: 'Republic Developments', address: '3 Swift Drive, Toronto ON' },
  { name: '2346 Yonge Street Condos', developerStr: 'DiamondCorp / Fineway Properties', address: '2346 Yonge Street, Toronto ON' },
  { name: '509 Parliament Street Condos', developerStr: 'Streetwise Capital Partners', address: '505 Parliament Street, Toronto ON' },
  { name: '3400 Dufferin Street Condos', developerStr: 'Collecdev-Markee', address: '3400 Dufferin Street, Toronto ON' },
  { name: '75-81 Billy Bishop Way Condos', developerStr: 'Unknown', address: '75 Billy Bishop Way, Toronto ON' },
  { name: '900 Middlefield Road Condos', developerStr: 'Unknown', address: '900 Middlefield Road, Toronto ON' },
  { name: '2075 Kennedy Road Condos Phase 2', developerStr: 'Landa Global Properties', address: '2075 Kennedy Road, Toronto ON' },
  { name: '139-149 Church Street / 18-20 Dalhousie', developerStr: 'Pemberton Group', address: '139 Church Street, Toronto ON' },
  { name: '59-81 Lawton Boulevard Condos', developerStr: 'Gairloch Developments / Fairway Developments', address: '59 Lawton Boulevard, Toronto ON' },
  { name: 'Landa 2075 Kennedy', developerStr: 'Landa Global Properties', address: '2075 Kennedy Road, Toronto ON' },
  { name: '210 Markland Drive Condos', developerStr: 'Hazelview Investments', address: '210 Markland Drive, Toronto ON' },
  { name: 'East Richmond', developerStr: 'Lamb Development Corp', address: '75 Ontario Street, Toronto ON' },
  { name: '243-247 Davenport Road Condos', developerStr: 'DC Development Corp', address: '247 Davenport Road, Toronto ON' },
  { name: '7509-7529 Yonge Street Condos', developerStr: 'Grmada Holdings', address: '7509 Yonge Street, Toronto ON' },
  { name: '4875 Dundas Street West Condos', developerStr: 'Forest Gate Group', address: '4875 Dundas Street West, Toronto ON' },
  { name: '220-240 Lake Promenade & 21-31 Park Boulevard', developerStr: 'Unknown', address: '220 Lake Promenade, Toronto ON' },
  { name: '419-425 Woodbine Avenue Condos', developerStr: 'Artlife Developments', address: '419 Woodbine Avenue, Toronto ON' },
  { name: '70 St Mary Street Condos', developerStr: 'Unknown', address: '70 Saint Mary Street, Toronto ON' },
  { name: 'Inez Court', developerStr: 'The Conservatory Group', address: '51 Drewry Avenue, Toronto ON' },
  { name: '6355 Yonge Street Condos', developerStr: 'Osmington Gerofsky Development', address: '6355 Yonge Street, Toronto ON' },
  { name: '185 King Street East Condos', developerStr: 'The Gupta Group', address: '185 King Street East, Toronto ON' },
  { name: '906 Yonge Road & 25 McMurrich Street', developerStr: 'The Gupta Group', address: '25 McMurrich Street, Toronto ON' },
  { name: '40 Raglan Avenue Condos', developerStr: 'Hazelview Investments', address: '40 Raglan Avenue, Toronto ON' },
  { name: '141 Davisville Avenue Condos', developerStr: 'Osmington Gerofsky Development', address: '141 Davisville Avenue, Toronto ON' },
  { name: 'Shoppes on Steeles Phase 1 Retail', developerStr: 'Minett Capital / Streamliner Properties', address: '2880 Steeles Avenue East, Markham ON' },
  { name: '4001 Steeles Avenue West Condos', developerStr: 'Sorbara Group', address: '4001 Steeles Avenue West, Toronto ON' },
  { name: '2237-2283 St Clair Avenue West Condos', developerStr: 'Marlin Spring / Greybrook Realty Partners', address: '2255 Saint Clair Avenue West, Toronto ON' },
  { name: '699-707 Yonge Street / 1-17 Hayden / 8 Charles East', developerStr: 'Concord Adex', address: '699 Yonge Street, Toronto ON' },
  { name: 'Eglinton Square', developerStr: 'Kingsett Capital', address: '1 Eglinton Square, Toronto ON' },
  { name: '83-95 Bloor Street West Condos', developerStr: 'Parallax / RioCan Living / Westdale Properties', address: '83 Bloor Street West, Toronto ON' },
  { name: '1256 Markham Road Phase 1', developerStr: 'Nahid Corp', address: '1256 Markham Road, Toronto ON' },
  { name: 'The Kip District Phase 3 Condo', developerStr: 'Concert Properties', address: '5365 Dundas Street West, Toronto ON' },
  { name: '5-15 Raglan Avenue Condos', developerStr: 'The Goldman Group / Stafford Homes', address: '5 Raglan Avenue, Toronto ON' },
  { name: '1801-1807 Eglinton Avenue West Condos', developerStr: 'Kingsett Capital', address: '1801 Eglinton Avenue West, Toronto ON' },
  { name: 'Sherway Gardens Phase 1', developerStr: 'Cadillac Fairview / DiamondCorp', address: '25 The West Mall, Toronto ON' },
  { name: '609 Roehampton Avenue Condos', developerStr: 'Starbank Development Group', address: '609 Roehampton Avenue, Toronto ON' },
  { name: '161-167 Parliament Street Condos', developerStr: 'ONE Properties', address: '351 Queen Street East, Toronto ON' },
  { name: '45 The Esplanade Condos', developerStr: 'Republic Developments', address: '45 The Esplanade, Toronto ON' },
  { name: '18-28 Athabaska Avenue Condos', developerStr: 'Delmar Group', address: '18 Athabaska Avenue, Toronto ON' },
  { name: '36-40 Avondale Avenue Condos', developerStr: 'Unknown', address: '36 Avondale Avenue, Toronto ON' },
  { name: '1861 O\'Connor Drive Condos', developerStr: 'Artlife Developments', address: '1861 O\'Connor Drive, Toronto ON' },
  { name: '1728 Bloor Street West Condos', developerStr: 'Fairway Developments', address: '1728 Bloor Street West, Toronto ON' },
  { name: '2273-2279 Bloor Street West', developerStr: 'Unknown', address: '2265 Bloor Street West, Toronto ON' },
  { name: '2450 Victoria Park Avenue Condos', developerStr: 'Collecdev-Markee', address: '2450 Victoria Park Avenue, Toronto ON' },
  { name: '150-158 Pearl Street Condos', developerStr: 'The Conservatory Group', address: '150 Pearl Street, Toronto ON' },
  { name: '1-19 Thelma Avenue Condos', developerStr: 'DealCore Properties', address: '1 Thelma Avenue, Toronto ON' },
  { name: '2683 Lawrence Avenue East Condos', developerStr: 'Unknown', address: '2683 Lawrence Avenue East, Toronto ON' },
  { name: '550 Ontario Street South Condos', developerStr: 'Unknown', address: '550 Ontario Street, Toronto ON' },
  { name: '396-398 Church Street Condos', developerStr: 'Podium Developments', address: '396 Church Street, Toronto ON' },
  { name: '28 River Street & 550 Queen Street East', developerStr: 'Liberty Development / Spotlight Development', address: '28 River Street, Toronto ON' },
  { name: 'Richview Square Phase 3', developerStr: 'Trinity / CreateTO', address: '250 Wincott Drive, Toronto ON' },
  { name: 'Yorkville Condos', developerStr: 'Impressions Group', address: 'Bloor Street West & Avenue Road, Toronto ON' },
  { name: 'South Station', developerStr: 'Devron', address: '21 John Street, Toronto ON' },
  { name: '3459-3471 Sheppard Avenue East', developerStr: 'Lorenzo Developments', address: '3471 Sheppard Avenue East, Toronto ON' },
  { name: '3140-3170 Dufferin Street Condos', developerStr: 'RioCan Living / Innovo', address: '3140 Dufferin Street, Toronto ON' },
  { name: '4155 Yonge Street Condos', developerStr: 'Green City Communities', address: '4155 Yonge Street, Toronto ON' },
  { name: '726-736 Marlee Avenue Condos', developerStr: 'Trinity Point Developments', address: '726 Marlee Avenue, Toronto ON' },
  { name: '137-141 Isabella Street Condos', developerStr: 'Pinedale Properties', address: '137 Isabella Street, Toronto ON' },
  { name: '55-75 Brownlow Avenue Condos', developerStr: 'Menkes Developments', address: '61 Brownlow Avenue, Toronto ON' },
  { name: '2-20 Glazebrook Avenue Condos', developerStr: 'Gairloch Developments', address: '2 Glazebrook Avenue, Toronto ON' },
  { name: '2872-2882 Kingston Road Condos', developerStr: 'Artlife Developments', address: '2880 Kingston Road, Toronto ON' },
  { name: '208 Bloor Street West Condos', developerStr: 'Resident', address: '208 Bloor Street West, Toronto ON' },
  { name: 'Fairview Mall Redevelopment', developerStr: 'Cadillac Fairview / SHAPE', address: '1800 Sheppard Avenue East, Toronto ON' },
  { name: '2575 Pharmacy Avenue Condos', developerStr: 'Unknown', address: '2575 Pharmacy Avenue, Toronto ON' },
  { name: 'The Queen', developerStr: 'Lamb Development Corp', address: '471 Queen Street East, Toronto ON' },
  { name: '1291 Gerrard Street East Condos', developerStr: 'Unknown', address: '1291 Gerrard Street East, Toronto ON' },
  { name: '7-17 Nipigon Avenue Condos', developerStr: 'Arkfield', address: '7 Nipigon Avenue, Toronto ON' },
  { name: '3300 Dufferin Street Condos', developerStr: 'Terracap', address: '3300 Dufferin Street, Toronto ON' },
  { name: '155 Balliol Infill', developerStr: 'Amelin Properties', address: '155 Balliol Street, Toronto ON' },
  { name: '491 Glencairn Avenue Condos', developerStr: 'Greatwise Developments', address: '491 Glencairn Avenue, Toronto ON' },
  { name: '1 Eglinton Avenue East Condos', developerStr: 'Davpart', address: '1 Eglinton Avenue East, Toronto ON' },
  { name: '1507-1545 Avenue Road Condos', developerStr: 'First Capital', address: '284 Lawrence Avenue West, Toronto ON' },
  { name: '419-431 College Street Condos', developerStr: 'Unknown', address: '419 College Street, Toronto ON' },
  { name: '5 Fairview Mall Drive Condos', developerStr: 'Unknown', address: '5 Fairview Mall Drive, Toronto ON' },
  { name: '276-290 Merton Street Condos', developerStr: 'The Rockport Group / Lindvest', address: '276 Merton Street, Toronto ON' },
  { name: '2440 Yonge Street Condos', developerStr: 'First Capital', address: '2440 Yonge Street, Toronto ON' },
  { name: '2491 Lake Shore Boulevard West', developerStr: 'Unknown', address: '2491 Lake Shore Boulevard West, Toronto ON' },
  { name: '6035 Bathurst Street Condos', developerStr: 'Resident', address: '6035 Bathurst Street, Toronto ON' },
  { name: 'Donway West', developerStr: 'Options for Homes / Deltera', address: '230 The Donway West, Toronto ON' },
  { name: 'Elektra', developerStr: 'Menkes Developments', address: '218 Dundas Street East, Toronto ON' },
  { name: '670-690 Progress Avenue Condos', developerStr: 'Fieldgate Urban', address: '670 Progress Avenue, Toronto ON' },
  { name: '4231-4241 Dundas Street West Condos', developerStr: 'Marlin Spring Developments', address: '4241 Dundas Street West, Toronto ON' },
  { name: 'Linden Sherbourne', developerStr: 'Platinum Vista / DBS Developments / Alterra', address: '576 Sherbourne Street, Toronto ON' },
  { name: '7-11 Rochefort Drive Condos', developerStr: 'Damis Properties', address: '7 Rochefort Drive, Toronto ON' },
  { name: 'Shoppes on Steeles Phase 2 Park Precinct', developerStr: 'Streamliner Properties / Minett Capital', address: '2880 Steeles Avenue East, Markham ON' },
  { name: '558-564 Kingston Road Condos', developerStr: 'ARD Development', address: '558 Kingston Road, Toronto ON' },
  { name: '2200 Eglinton Avenue East Condos Phase 1', developerStr: 'CentreCourt / Dream', address: '2200 Eglinton Avenue East, Toronto ON' },
  { name: 'Concord Park Place Block 2', developerStr: 'Concord Adex', address: '1125 Sheppard Avenue East, Toronto ON' },
  { name: '110 Sheppard Avenue East Condos', developerStr: 'Streamliner Properties', address: '110 Sheppard Avenue East, Toronto ON' },
  { name: '500 Duplex Avenue Condos', developerStr: 'Streamliner Properties / Minett Capital', address: '500 Duplex Avenue, Toronto ON' },
  { name: '399-401 Yonge Street Condos', developerStr: 'Capital Developments', address: '399 Yonge Street, Toronto ON' },
  { name: '243 Eglinton Avenue West & 500 Oriole Parkway', developerStr: 'Unknown', address: '243 Eglinton Avenue West, Toronto ON' },
  { name: '125 The Queensway Condos', developerStr: 'Unknown', address: '125 The Queensway, Toronto ON' },
  { name: 'Westside Mall Redevelopment', developerStr: 'SmartLiving', address: '2400 Eglinton Avenue West, Toronto ON' },
  { name: '22-32 Scollard Street Condos', developerStr: 'Constantine Enterprises', address: '30 Scollard Street, Toronto ON' },
  { name: '100 Borough Drive Condos', developerStr: 'Rosdev Group / Dov Capital', address: '100 Borough Drive, Toronto ON' },
  { name: '2-12 Cawthra Square Condos', developerStr: 'BV Realty Partners', address: '2 Cawthra Square, Toronto ON' },
  { name: '1881 Steeles Avenue West Condos', developerStr: 'First Capital', address: '1881 Steeles Avenue West, Toronto ON' },
  { name: 'Queensway III', developerStr: 'Greybrook Realty Partners / Tribute Communities', address: '1325 The Queensway, Toronto ON' },
  { name: 'Agincourt Mall Redevelopment', developerStr: 'North American Development Group', address: '3850 Sheppard Avenue East, Toronto ON' },
  { name: '115 Saulter Street South Condos', developerStr: 'Castlepoint Numa', address: '115 Saulter Street South, Toronto ON' },
  { name: '619-637 Yonge Street Condos', developerStr: 'YI Developments', address: '619 Yonge Street, Toronto ON' },
  { name: '253-263 Viewmount Avenue & 14-18 Romar Crescent', developerStr: 'Osmington Gerofsky', address: '253 Viewmount Avenue, Toronto ON' },
  { name: '262-274 Viewmount Avenue Condos', developerStr: 'Chestnut Hill Developments', address: '262 Viewmount Avenue, Toronto ON' },
  { name: '148-158 Avenue Road Condos', developerStr: 'Tribute Communities / Greybrook Realty Partners', address: '148 Avenue Road, Toronto ON' },
  { name: 'One Thirty Eight', developerStr: 'First Capital / Greybrook Realty Partners / Cityzen', address: '138 Yorkville Avenue, Toronto ON' },
  { name: '1774 Ellesmere Road Condos', developerStr: 'Unknown', address: '1774 Ellesmere Road, Toronto ON' },
  { name: '2525-2545 Lawrence Avenue East / 1380 Midland', developerStr: 'Unknown', address: '1380 Midland Avenue, Toronto ON' },
  { name: '245-251 Marlee Avenue Condos', developerStr: 'Chestnut Hill Developments', address: '245 Marlee Avenue, Toronto ON' },
  { name: 'Concord Park Place Block 7', developerStr: 'Concord Adex', address: '1181 Sheppard Avenue East, Toronto ON' },
  { name: '2157-2183 Lawrence Avenue East Condos', developerStr: 'Initial Corporation', address: '2157 Lawrence Avenue East, Toronto ON' },
  { name: 'Rail Deck District', developerStr: 'Craft Development / Kingsmen Group', address: '595 Front Street West, Toronto ON' },
  { name: '1891 Eglinton Avenue East Condos', developerStr: 'Mattamy Homes Canada', address: '1891 Eglinton Avenue East, Toronto ON' },
  { name: '1920-1940 Eglinton Avenue East Condos', developerStr: 'Madison Group', address: '1920 Eglinton Avenue East, Toronto ON' },
  { name: '3585-3595 Saint Clair Avenue East Condos', developerStr: 'Republic Developments / Harlo Capital', address: '3585 Saint Clair Avenue East, Toronto ON' },
  { name: 'Berkeley House', developerStr: 'Lamb Development Corp', address: '102 Berkeley Street, Toronto ON' },
  { name: '278-280 Viewmount Avenue Condos', developerStr: 'Altree Developments', address: '280 Viewmount Avenue, Toronto ON' },
  { name: 'Maxium 1099 Broadview Avenue', developerStr: 'Equiton Developments', address: '1099 Broadview Avenue, Toronto ON' },
  { name: '4884-4896 Dundas Street West Condos', developerStr: 'The Rockport Group', address: '4888 Dundas Street West, Toronto ON' },
  { name: '632-652 Northcliffe Boulevard Condos', developerStr: 'Stanford Homes', address: '632 Northcliffe Boulevard, Toronto ON' },
  { name: '5280 Dundas Street West Condos', developerStr: 'Marlin Spring Developments', address: '5280 Dundas Street West, Toronto ON' },
  { name: '4700 Bathurst Street Condos', developerStr: 'Frontdoor Developments', address: '4700 Bathurst Street, Toronto ON' },
  { name: '2775 Jane Street Condos', developerStr: 'Stanford Homes', address: '2775 Jane Street, Toronto ON' },
  { name: '2116 Eglinton Avenue West Condos', developerStr: 'Oldstonehenge', address: '2116 Eglinton Avenue West, Toronto ON' },
  { name: '2681 Danforth Avenue Condos', developerStr: 'Canadian Tire Real Estate', address: '2681 Danforth Avenue, Toronto ON' },
  { name: '4280-4290 Kingston Road Condos', developerStr: 'NJS Capital', address: '4280 Kingston Road, Toronto ON' },
  { name: '200 Gateway Boulevard Condos', developerStr: 'Novi Properties', address: '200 Gateway Boulevard, Toronto ON' },
  { name: '4696 Yonge Street Condos', developerStr: 'Skale Developments', address: '4696 Yonge Street, Toronto ON' },
  { name: '5800 Yonge Street East Parcel', developerStr: 'Times Group Corporation', address: '5800 Yonge Street, Toronto ON' },
  { name: 'St Clair Place', developerStr: 'Wittington Properties / Capital Developments', address: '1485 Yonge Street, Toronto ON' },
  { name: 'Golden Mile Shopping Centre Redevelopment', developerStr: 'Choice Properties / The Daniels Corporation', address: '1880 Eglinton Avenue East, Toronto ON' },
  { name: 'Fauna', developerStr: 'Block Developments', address: '1494 Dundas Street West, Toronto ON' },
  { name: '665-671 Sheppard Avenue West Condos', developerStr: 'Regency Development', address: '665 Sheppard Avenue West, Toronto ON' },
  { name: '77 Erskine Avenue Condos', developerStr: 'Fora Developments', address: '77 Erskine Avenue, Toronto ON' },
  { name: 'Leona Condominiums', developerStr: 'Trulife Developments', address: '105 Sheppard Avenue East, Toronto ON' },
  { name: '1-13 St Clair Avenue West Condos', developerStr: 'Slate Asset Management', address: '1 Saint Clair Avenue West, Toronto ON' },
  { name: '86 & 100-108 Lombard Street Condos', developerStr: 'Slate Asset Management / Forum Asset Management', address: '100 Lombard Street, Toronto ON' },
  { name: 'Place The Condo on the Go', developerStr: 'Angil Development / Lorenzo Developments', address: '4212 Kingston Road, Toronto ON' },
  { name: '155 Antibes Drive Condos', developerStr: 'Tenblock', address: '155 Antibes Drive, Toronto ON' },
  { name: 'Designers Walk', developerStr: 'Cityzen / Greybrook Realty Partners', address: '306 Davenport Road, Toronto ON' },
  { name: '15-17 Elm Street Condos', developerStr: 'Fora Developments', address: '17 Elm Street, Toronto ON' },
  { name: '673 Warden Avenue Condos', developerStr: 'Unknown', address: '673 Warden Avenue, Toronto ON' },
  { name: '3434 Lawrence Avenue East Condos', developerStr: 'First Capital', address: '3434 Lawrence Avenue East, Toronto ON' },
  { name: '6040 Bathurst Street & Fisherville Road', developerStr: 'Pinedale Properties', address: '6040 Bathurst Street, Toronto ON' },
  { name: '361 The West Mall & 24 Eva Road Condos', developerStr: 'Unknown', address: '24 Eva Road, Toronto ON' },
  { name: 'Arcadia District Towers A and B', developerStr: 'EllisDon', address: '60 Fieldway Road, Toronto ON' },
  { name: '64 Prince Arthur Avenue Condos', developerStr: 'Adi Development Group', address: '64 Prince Arthur Avenue, Toronto ON' },
  { name: 'KYUB on Keele', developerStr: 'Trolleybus Urban Development / Block Developments', address: '1860 Keele Street, Toronto ON' },
  { name: '287-291 Christie Street Condos', developerStr: 'Zinc Developments', address: '289 Christie Street, Toronto ON' },
  { name: '15-19 Bloor Street West Condos', developerStr: 'Reserve Properties / Westdale Properties', address: '15 Bloor Street West, Toronto ON' },
  { name: '48-58 Avondale Avenue Condos', developerStr: 'Oulahen Team Realty', address: '48 Avondale Avenue, Toronto ON' },
  { name: 'Concord Park Place Block 1', developerStr: 'Concord Adex', address: '1001 Sheppard Avenue East, Toronto ON' },
  { name: '110 Adelaide Street East Condos', developerStr: 'Windmill Developments / Greybrook Realty Partners', address: '110 Adelaide Street East, Toronto ON' },
  { name: '572 Church Street Condos', developerStr: 'Fieldgate Urban', address: '572 Church Street, Toronto ON' },
  { name: '45 & 57-93 Balliol Street Condos', developerStr: 'Greenrock Resident Services', address: '45 Balliol Street, Toronto ON' },
  { name: 'Cloverdale Mall Remaining Phases', developerStr: 'QuadReal', address: '250 The East Mall, Toronto ON' },
  { name: '1710-1712 Ellesmere Road Condos', developerStr: 'Tridel', address: '1710 Ellesmere Road, Toronto ON' },
  { name: '2150-2194 Lake Shore Boulevard West Block D Phase 3', developerStr: 'First Capital / Pemberton Group', address: '2150 Lake Shore Boulevard West, Toronto ON' },
  { name: 'Sandstones', developerStr: 'Equiton Developments', address: '2257 Kingston Road, Toronto ON' },
  { name: '2595 St Clair Avenue West Condos', developerStr: 'Unknown', address: '2595 Saint Clair Avenue West, Toronto ON' },
  { name: '7 St Dennis Drive Condos Phase 1', developerStr: 'Osmington Gerofsky', address: '7 Saint Dennis Drive, Toronto ON' },
  { name: 'Hyde Park Leaside', developerStr: 'Linway Developments', address: '943 Eglinton Avenue East, Toronto ON' },
  { name: '50-60 Eglinton Avenue West / 17-19 Henning Avenue', developerStr: 'Madison Group', address: '90 Eglinton Avenue East, Toronto ON' },
  { name: '16 Wilby Crescent Condos', developerStr: 'Altree Developments', address: '16 Wilby Crescent, Toronto ON' },
  { name: '375-385 The West Mall Condos', developerStr: 'Unknown', address: '375 The West Mall, Toronto ON' },
  { name: '131 Lyon Court & 836-838 Roselawn Avenue', developerStr: 'Capitol Management Corp', address: '131 Lyon Court, Toronto ON' },
  { name: '567 Sheppard Avenue East Condos', developerStr: 'Tridel', address: '567 Sheppard Avenue East, Toronto ON' },
  { name: 'Cricket Park 3', developerStr: 'Clifton Blake', address: '1875 Eglinton Avenue West, Toronto ON' },
  { name: '184 Chatham Avenue Condos', developerStr: 'Icarus Developments / Red Rock Builders', address: '184 Chatham Avenue, Toronto ON' },
  { name: '1437-1455 Queen Street West Condos', developerStr: 'Stanford Homes', address: '1437 Queen Street West, Toronto ON' },
  { name: '1075-1083 Leslie Street Condos', developerStr: 'Rowbry Holding', address: '1075 Leslie Street, Toronto ON' },
  { name: '241 Richmond Street West / 133 John Street', developerStr: 'Tridel', address: '241 Richmond Street West, Toronto ON' },
  { name: '66 Charles Street East Condos', developerStr: 'Aspen Ridge Homes', address: '66 Charles Street East, Toronto ON' },
  { name: 'Juno Residences', developerStr: 'Carlyle Communities', address: '6 Lloyd Avenue, Toronto ON' },
  { name: '2238-2290 Dundas Street West Condos', developerStr: 'Choice Properties', address: '2280 Dundas Street West, Toronto ON' },
  { name: '175-195 St Clair Avenue West / 273 Poplar Plains Road', developerStr: 'Resident / Main+Main / Woodbourne Canada Management', address: '175 Saint Clair Avenue West, Toronto ON' },
  { name: '805 Don Mills Road Condos', developerStr: 'CreateTO', address: '805 Don Mills Road, Toronto ON' },
  { name: '1960 Eglinton Avenue East Condos', developerStr: 'RioCan Living', address: '1966 Eglinton Avenue East, Toronto ON' },
  { name: 'Nahid on Sheppard', developerStr: 'Nahid Corp', address: '110 Sheppard Avenue West, Toronto ON' },
  { name: '401-415 King Street West Condos', developerStr: 'Great Gulf / Terracap', address: '411 King Street West, Toronto ON' },
  { name: '1125 Sheppard Avenue East Condos', developerStr: 'Concord Adex', address: '1125 Sheppard Avenue East, Toronto ON' },
  { name: '2349-2363 Eglinton Avenue West Condos', developerStr: 'Unknown', address: '2363 Eglinton Avenue West, Toronto ON' },
  { name: '45-47 Sheppard Avenue East Condos', developerStr: 'Lev Living', address: '45 Sheppard Avenue East, Toronto ON' },
  { name: '3600 Finch Avenue East Condos', developerStr: 'H & W Developments', address: '3600 Finch Avenue East, Toronto ON' },
  { name: '1230 The Queensway Condos', developerStr: 'Starbank Development Group', address: '1230 The Queensway, Toronto ON' },
  { name: 'Danforth Park', developerStr: 'Vintage Park Homes', address: '3359 Danforth Avenue, Toronto ON' },
  { name: '2901 Bayview Avenue Condos', developerStr: 'QuadReal', address: '2901 Bayview Avenue, Toronto ON' },
  { name: 'Starklands', developerStr: 'Unknown', address: '119 Benny Stark Street, Toronto ON' },
  { name: 'RioCan Scarborough Centre Phase 1 Building 2A', developerStr: 'Unknown', address: '1980 Eglinton Avenue East, Toronto ON' },
  { name: '3000-3020 Kennedy Road Townhomes', developerStr: 'Green City Communities / CIM Developments', address: '3000 Kennedy Road, Toronto ON' },
  { name: '300 Danforth Road Condos', developerStr: 'Ranka Enterprises', address: '300 Danforth Road, Toronto ON' },
  { name: 'Kennedy Co-Ops Phase 2', developerStr: 'Windmill Developments / CreateTO / Civic Developments', address: '2444 Eglinton Avenue East, Toronto ON' },
  { name: '354 Wellington Street West Condos Phase 2', developerStr: 'Mastercraft Starwood', address: '354 Wellington Street West, Toronto ON' },
  { name: 'Hickory Tree Tower', developerStr: 'Arkfield / A1 Development / A1 Capital', address: '1736 Weston Road, Toronto ON' },
  { name: 'The Cedars', developerStr: 'Options for Homes', address: '253 Markham Road, Toronto ON' },
  { name: '625 Yonge Street Condos', developerStr: 'Edenshaw Developments', address: '625 Yonge Street, Toronto ON' },
  { name: '655-663 Queen Street West / 178 Bathurst Street', developerStr: 'Trinity / Hazelview Investments', address: '655 Queen Street West, Toronto ON' },
  { name: '444-466 Eglinton Avenue West', developerStr: 'ARISTA Homes', address: '444 Eglinton Avenue West, Toronto ON' },
  { name: '1-9 Oxford Drive Condos', developerStr: 'Trolleybus Urban Development', address: '9 Oxford Drive, Toronto ON' },
  { name: 'Grand Park Village Block D', developerStr: 'Minto Group', address: '2 Audley Street, Toronto ON' },
  { name: '1821-1831 Weston Road Condos', developerStr: 'BSar Group', address: '1821 Weston Road, Toronto ON' },
  { name: '56-60 Yonge Street Condos', developerStr: 'Kingsett Capital', address: '56 Yonge Street, Toronto ON' },
  { name: 'Foret The Iris', developerStr: 'Canderel Residential', address: '490 Saint Clair Avenue West, Toronto ON' },
  { name: 'Centrepoint Mall Redevelopment', developerStr: 'Unknown', address: '6464 Yonge Street, Toronto ON' },
  { name: '2640-2650 Lawrence Avenue East Condos', developerStr: 'First Capital', address: '2640 Lawrence Avenue East, Toronto ON' },
  { name: '80-82 Bloor Street West Condos', developerStr: 'Krugarand Corporation', address: '80 Bloor Street West, Toronto ON' },
  { name: '390-400 Woodsworth Road Condos', developerStr: 'Resident', address: '390 Woodsworth Road, Toronto ON' },
  { name: '190-200 Ridley Boulevard Condos', developerStr: 'Sny Development Corporation', address: '190 Ridley Boulevard, Toronto ON' },
  { name: '81-83 Isabella Street Condos', developerStr: 'Unknown', address: '81 Isabella Street, Toronto ON' },
  { name: '2200-2206 Eglinton Avenue East Remaining Phases', developerStr: 'Dream', address: '2200 Eglinton Avenue East, Toronto ON' },
  { name: '400 Front Street West Condos', developerStr: 'State Building Group / Stanford Homes / Forest Hill Homes', address: '400 Front Street West, Toronto ON' },
  { name: '2425-2427 Bayview Avenue Condos', developerStr: 'Times Group Corporation', address: '2425 Bayview Avenue, Toronto ON' },
  { name: 'Flora', developerStr: 'Block Developments', address: '646 Dufferin Street, Toronto ON' },
  { name: '66 Wellesley Street East Condos', developerStr: 'ONE Properties', address: '66 Wellesley Street East, Toronto ON' },
  { name: '9 & 25 Dawes Road Condos', developerStr: 'Minto Group', address: '9 Dawes Road, Toronto ON' },
  { name: '1296-1314 Queen Street West Condos', developerStr: 'Unknown', address: '1296 Queen Street West, Toronto ON' },
  { name: '296-300 King Street East Condos', developerStr: 'Lamb Development Corp', address: '296 King Street East, Toronto ON' },
  { name: '150-160 Cactus Avenue Condos', developerStr: 'Resident', address: '160 Cactus Avenue, Toronto ON' },
  { name: '60 Balliol Street / 33 Davisville Avenue', developerStr: 'Osmington Gerofsky', address: '60 Balliol Street, Toronto ON' },
  { name: '3718-3730 Kingston Road Condos', developerStr: 'TAS', address: '3718 Kingston Road, Toronto ON' },
  { name: 'The Everest', developerStr: 'Altree Developments', address: '54 Glen Everest Road, Toronto ON' },
  { name: '55 Eglinton Avenue East Condos', developerStr: 'State Building Group / Forest Hill Homes', address: '55 Eglinton Avenue East, Toronto ON' },
  { name: '1711-1741 Eglinton Avenue West Condos', developerStr: 'Unknown', address: '1711 Eglinton Avenue West, Toronto ON' },
  { name: 'The Lexington Phase 2', developerStr: 'Unknown', address: '840 Queens Plate Drive, Toronto ON' },
  { name: '433 Front Street West Condos', developerStr: 'Unknown', address: '433 Front Street West, Toronto ON' },
  { name: 'Reimagine Galleria', developerStr: 'Almadev', address: '1245 Dupont Street, Toronto ON' },
  { name: '4180 Kingston Road Condos', developerStr: 'North American Development Group', address: '4180 Kingston Road, Toronto ON' },
  { name: 'Bay & Elm Condos', developerStr: 'Unexus Group', address: '650 Bay Street, Toronto ON' },
  { name: '149 College Street Condos', developerStr: 'Northwest Development', address: '149 College Street, Toronto ON' },
  { name: '2-16 Denarda Street Condos', developerStr: 'Kingsett Capital', address: '2 Denarda Street, Toronto ON' },
  { name: '2010-2050 Yonge Street & 15 Lola Road', developerStr: 'Sud Group', address: '2010 Yonge Street, Toronto ON' },
  { name: '310-330 Front Street West Condos', developerStr: 'H&R REIT', address: '310 Front Street West, Toronto ON' },
  { name: '654-668 Danforth Avenue', developerStr: 'Del Boca Vista Properties', address: '656 Danforth Avenue, Toronto ON' },
  { name: '20 Stonehill Court Condos', developerStr: 'DBS Developments', address: '20 Stonehill Court, Toronto ON' },
  { name: '183-189 Avenue Road / 109-111 Pears Avenue', developerStr: 'K P Isberg Construction', address: '183 Avenue Road, Toronto ON' },
  { name: 'West Don Lands Blocks 17 & 26', developerStr: 'Aspen Ridge Homes', address: '153 Eastern Avenue, Toronto ON' },
  { name: '2485 Eglinton Avenue West Condos', developerStr: 'Tercot Communities / Cityzen', address: '2485 Eglinton Avenue West, Toronto ON' },
  { name: '3326 Bloor Street West Building A', developerStr: 'CreateTO', address: '3326 Bloor Street West, Toronto ON' },
  { name: '1670 Avenue Road Condos', developerStr: 'Starbank Development Group', address: '1670 Avenue Road, Toronto ON' },
  { name: '2400 Bathurst Street Condos', developerStr: 'Unknown', address: '2400 Bathurst Street, Toronto ON' },
  { name: '2240 Birchmount Road Condos', developerStr: 'YYZed Project Management', address: '2240 Birchmount Road, Toronto ON' },
  { name: '451-457 Richmond Street West Condos', developerStr: 'DC Development Corp', address: '457 Richmond Street West, Toronto ON' },
  { name: 'Marlee Condos', developerStr: 'Spotlight Development', address: '774 Marlee Avenue, Toronto ON' },
  { name: '2405-2417 Lake Shore Boulevard West', developerStr: 'Winzen', address: '2405 Lake Shore Boulevard West, Toronto ON' },
  { name: 'One Scollard', developerStr: 'Cityzen / Greybrook Realty Partners', address: '874 Yonge Street, Toronto ON' },
  { name: '882 Broadview Avenue Condos', developerStr: 'Unknown', address: '882 Broadview Avenue, Toronto ON' },
  { name: 'Six Points Plaza Redevelopment', developerStr: 'Liberty Development Corporation', address: '5230 Dundas Street West, Toronto ON' },
  { name: 'Quayside Phase 2', developerStr: 'Great Gulf', address: '333 Lake Shore Boulevard East, Toronto ON' },
  { name: '685 Lake Shore Boulevard East Condos', developerStr: 'Slate Asset Management / Carlyle Communities', address: '685 Lake Shore Boulevard East, Toronto ON' },
  { name: '210 Bloor Street West Condos', developerStr: 'Tribute Communities', address: '210 Bloor Street West, Toronto ON' },
  { name: '2345 Yonge Street Condos', developerStr: 'RioCan Living / Minett Capital', address: '2345 Yonge Street, Toronto ON' },
  { name: '36 & 44 Eglinton Avenue West Condos', developerStr: 'Lifetime Developments', address: '36 Eglinton Avenue West, Toronto ON' },
  { name: '401 Dundas Street East Condos', developerStr: 'Resident', address: '401 Dundas Street East, Toronto ON' },
  { name: '41-75 Four Winds Drive Condos', developerStr: 'Berncray Holdings', address: '41 Four Winds Drive, Toronto ON' },
  { name: '485-489 Wellington Street West Condos', developerStr: 'Lifetime Developments', address: '485 Wellington Street West, Toronto ON' },
  { name: '5-9 Jopling Avenue South Condos', developerStr: 'CentreCourt', address: '5 Jopling Avenue South, Toronto ON' },
  { name: '2422-2434 Islington Avenue Condos', developerStr: 'Unknown', address: '2422 Islington Avenue, Toronto ON' },
  { name: '64-66 Wellesley Street East Condos', developerStr: 'ONE Properties', address: '64 Wellesley Street East, Toronto ON' },
  { name: '120-134 Sherbourne Street Condos', developerStr: 'Dash Developments', address: '225 Queen Street East, Toronto ON' },
  { name: 'Victory Silos Condos North Block', developerStr: 'Great Gulf / Dream', address: '351 Lake Shore Boulevard East, Toronto ON' },
  { name: '346-378 Eglinton Avenue West Condos', developerStr: 'Terranata Developments', address: '346 Eglinton Avenue West, Toronto ON' },
  { name: '641-653 Queen Street East Condos', developerStr: 'Streetcar Developments', address: '641 Queen Street East, Toronto ON' },
  { name: '793-797 O\'Connor Drive Condos', developerStr: 'Unknown', address: '793 O\'Connor Drive, Toronto ON' },
  { name: '522 University Avenue Condos', developerStr: 'Industrial Alliance Insurance', address: '522 University Avenue, Toronto ON' },
  { name: '221-227 Sterling Road', developerStr: 'The Muzzo Group', address: '221 Sterling Road, Toronto ON' },
  { name: 'Westdale', developerStr: 'Sorbara Group', address: '33 Walsh Avenue, Toronto ON' },
  { name: '40-60 St Lawrence Avenue Condos Phase I & II', developerStr: 'Greybrook Realty Partners / Marlin Spring', address: '40 Saint Lawrence Avenue, Toronto ON' },
  { name: '49 Jackes Avenue Condos', developerStr: 'Lifetime Developments', address: '49 Jackes Avenue, Toronto ON' },
  { name: '277 Wellington Street West Condos', developerStr: 'Reserve Properties / Westdale Properties / The Rockport Group', address: '277 Wellington Street West, Toronto ON' },
  { name: '101-103 Heath Street West Condos', developerStr: 'Haven Developments', address: '101 Heath Street West, Toronto ON' },
  { name: '1 Eva Road Condos', developerStr: 'Broccolini', address: '1 Eva Road, Toronto ON' },
  { name: '71 Talara Drive Condos', developerStr: 'Tribute Communities', address: '71 Talara Drive, Toronto ON' },
  { name: '38-44 Broadway Avenue Condos', developerStr: 'Collecdev-Markee / Harlo Capital', address: '38 Broadway Avenue, Toronto ON' },
  { name: '1141 Roselawn Avenue Condos', developerStr: 'NJS Capital', address: '1141 Roselawn Avenue, Toronto ON' },
  { name: '600-620 The East Mall Condos', developerStr: 'Lanterra Developments', address: '600 The East Mall, Toronto ON' },
  { name: '402-408 Livingston Road North Condos', developerStr: 'Unknown', address: '402 Livingston Road North, Toronto ON' },
  { name: '2-6 Howard Park Avenue Condos', developerStr: 'Lamb Development Corp', address: '2 Howard Park Avenue, Toronto ON' },
  { name: '49-51 Yonge Street Condos', developerStr: 'SmartLiving', address: '49 Yonge Street, Toronto ON' },
  { name: '147 Spadina Avenue Condos', developerStr: 'Hullmark', address: '147 Spadina Avenue, Toronto ON' },
  { name: '221-237 Finch Avenue West Condos', developerStr: 'Regency Development', address: '221 Finch Avenue West, Toronto ON' },
  { name: 'Westin Prince Hotel', developerStr: 'Haven Developments', address: '900 York Mills Road, Toronto ON' },
  { name: '1366 Yonge Street Condos', developerStr: 'BAZIS', address: '1366 Yonge Street, Toronto ON' },
  { name: '4384 Kingston Road Condos', developerStr: 'Shad Developments', address: '4384 Kingston Road, Toronto ON' },
  { name: '126-130 Avenue Road', developerStr: 'Taheri Development', address: '126 Avenue Road, Toronto ON' },
  { name: 'Eglinton GO', developerStr: 'Achille / DBS Developments', address: '2941 Eglinton Avenue East, Toronto ON' },
  { name: '2004-2008 Bathurst Street Condos', developerStr: 'Unknown', address: '2004 Bathurst Street, Toronto ON' },
  { name: '150-164 Eglinton Avenue East & 134-140 Redpath Avenue', developerStr: 'Madison Group', address: '150 Eglinton Avenue East, Toronto ON' },
  { name: '35-39 Holmes Avenue Condos', developerStr: 'CoStone Group', address: '35 Holmes Avenue, Toronto ON' },
  { name: 'Riocan Hall Festival Hall', developerStr: 'RioCan Living', address: '126 John Street, Toronto ON' },
  { name: '91-101 Raglan Avenue Condos', developerStr: 'Camrost Felcorp', address: '91 Raglan Avenue, Toronto ON' },
  { name: '280 Commissioners Street Condos', developerStr: 'Unknown', address: '280 Commissioners Street, Toronto ON' },
  { name: '3459 Dundas Street West Condos', developerStr: 'Unknown', address: '3459 Dundas Street West, Toronto ON' },
  { name: 'Canada Square Redevelopment', developerStr: 'Oxford Properties / CT REIT', address: '2180 Yonge Street, Toronto ON' },
  { name: '4566-4568 Kingston Road Condos', developerStr: 'Old Orchard Development', address: '4566 Kingston Road, Toronto ON' },
  { name: '1319 Bloor Street West Condos', developerStr: 'Kingsett Capital', address: '1319 Bloor Street West, Toronto ON' },
  { name: 'The John Lea on Broadview', developerStr: 'The Broadview Group / Cape Group', address: '838 Broadview Avenue, Toronto ON' },
  { name: '6 Noble Street Condos', developerStr: 'Minto Group', address: '6 Noble Street, Toronto ON' },
  { name: '3280 Dufferin Street & 12-16 Orfus Road', developerStr: 'Topfar Developments', address: '3280 Dufferin Street, Toronto ON' },
  { name: '210 Islington Avenue Condos', developerStr: 'Taheri Development', address: '210 Islington Avenue, Toronto ON' },
  { name: '1175-1181 Weston Road Condos', developerStr: 'Kingsett Capital', address: '1175 Weston Road, Toronto ON' },
  { name: 'Weston Park', developerStr: 'Castlepoint Numa', address: '1871 Weston Road, Toronto ON' },
  { name: 'The Residences at Central Park Phases 3 & 4', developerStr: 'Amexon Development', address: '1200 Sheppard Avenue East, Toronto ON' },
  { name: '8 Dawes Road Condos', developerStr: 'Marlin Spring Developments', address: '8 Dawes Road, Toronto ON' },
  { name: '1-40 Fountainhead Road & 470 Sentinel Road', developerStr: 'Unknown', address: '470 Sentinel Road, Toronto ON' },
  { name: 'Jarvis and Earl Place', developerStr: 'Originate Developments', address: '561 Jarvis Street, Toronto ON' },
  { name: '26-38 Hounslow Avenue Condos', developerStr: 'Mattamy Homes Canada', address: '26 Hounslow Avenue, Toronto ON' },
  { name: '90 Isabella Street Condos', developerStr: 'Capital Developments', address: '90 Isabella Street, Toronto ON' },
  { name: 'Concord Park Place Block 9 & 18', developerStr: 'Concord Adex', address: '1001 Sheppard Avenue East, Toronto ON' },
  { name: 'Yonge & Rosehill', developerStr: 'Originate Developments / Westdale Properties / Cameron Stephens', address: '1365 Yonge Street, Toronto ON' },
  { name: '3130 & 3150 Danforth Avenue Condos', developerStr: 'Northam Realty Advisors / Crombie REIT', address: '3150 Danforth Avenue, Toronto ON' },
  { name: '1812 Eglinton Avenue West Condos', developerStr: 'DMJ Eglinton Development', address: '1812 Eglinton Avenue West, Toronto ON' },
  { name: 'West Point Art Collection', developerStr: 'Urbinco / Country Homes', address: '630 The East Mall, Toronto ON' },
  { name: '25 Old York Mills Road Condos', developerStr: 'Unknown', address: '25 Old York Mills Road, Toronto ON' },
  { name: 'Leaside Centre', developerStr: 'RioCan Living / Metropia', address: '815 Eglinton Avenue East, Toronto ON' },
  { name: '530-550 Yonge Street & 145 St Luke Lane', developerStr: 'Kingsett Capital', address: '530 Yonge Street, Toronto ON' },
  { name: '333 Wilson Avenue Condos', developerStr: 'Greatwise Developments', address: '333 Wilson Avenue, Toronto ON' },
  { name: '2150-2194 Lake Shore Boulevard West Block B Phase 4', developerStr: 'Pemberton Group / First Capital', address: '2150 Lake Shore Boulevard West, Toronto ON' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getNeighborhoodSlug(address: string): string {
  const a = address.toLowerCase();
  const numMatch = a.match(/^(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;

  // GTA suburbs
  if (a.includes(', markham')) return 'markham';
  if (a.includes('steeles avenue east') && num > 2000) return 'markham';

  // Waterfront
  if (/queen(s)? quay/.test(a)) return 'waterfront';
  if (/lake shore blvd(evard)? east/.test(a) && num > 0 && num <= 400) return 'waterfront';
  if (/lake shore boulevard east/.test(a) && num > 0 && num <= 400) return 'waterfront';

  // Canary District / Port Lands
  if (/cherry st(reet)?/.test(a)) return 'canary-district';
  if (/eastern ave(nue)?/.test(a)) return 'canary-district';
  if (/commissioners st(reet)?/.test(a)) return 'port-lands';
  if (/lake shore blvd(evard)? east/.test(a) && num > 400) return 'canary-district';

  // Cityplace / Fort York
  if (/fort york|lake shore blvd(evard)? west/.test(a) && num <= 700) return 'cityplace';
  if (/lake shore boulevard west/.test(a) && num <= 700) return 'cityplace';

  // Liberty Village
  if (/liberty st(reet)?/.test(a)) return 'liberty-village';
  if (/hanna ave(nue)?/.test(a)) return 'liberty-village';
  if (/sterling rd|sterling road/.test(a)) return 'junction';

  // King West
  if (/king st(reet)? (w|west)/.test(a) && num <= 600) return 'king-west';
  if (/king st(reet)? west/.test(a) && num <= 1400) return 'king-west';
  if (/charlotte st(reet)?/.test(a)) return 'king-west';
  if (/camden st(reet)?/.test(a)) return 'king-west';
  if (/john st(reet)?/.test(a) && num <= 30) return 'king-west';

  // Downtown Core
  if (/yonge st(reet)?/.test(a) && num <= 400) return 'downtown-core';
  if (/bay st(reet)?/.test(a) && num <= 700) return 'downtown-core';
  if (/front st(reet)? (w|west)/.test(a)) return 'downtown-core';
  if (/king st(reet)? (e|east)/.test(a) && num <= 200) return 'downtown-core';
  if (/queen st(reet)? (e|east)/.test(a) && num <= 200) return 'downtown-core';
  if (/richmond st(reet)?/.test(a)) return 'downtown-core';
  if (/wellington st(reet)? (w|west)/.test(a)) return 'downtown-core';
  if (/adelaide st(reet)?/.test(a)) return 'downtown-core';
  if (/university ave(nue)?/.test(a) && num <= 600) return 'downtown-core';
  if (/dundas st(reet)? (w|west)/.test(a) && num <= 300) return 'downtown-core';
  if (/dundas st(reet)? (e|east)/.test(a) && num <= 500) return 'downtown-core';
  if (/bond st(reet)?/.test(a)) return 'downtown-core';
  if (/edward st(reet)?/.test(a)) return 'downtown-core';
  if (/toronto st(reet)?/.test(a)) return 'downtown-core';
  if (/jarvis st(reet)?/.test(a) && num <= 400) return 'downtown-core';
  if (/parliament st(reet)?/.test(a) && num <= 200) return 'downtown-core';
  if (/church st(reet)?/.test(a) && num <= 600) return 'downtown-core';
  if (/bloor st(reet)? (w|west)/.test(a) && num <= 15) return 'downtown-core';
  if (/the esplanade/.test(a)) return 'downtown-core';
  if (/ontario st(reet)?/.test(a) && num <= 200) return 'downtown-core';
  if (/sherbourne st(reet)?/.test(a) && num <= 450) return 'downtown-core';
  if (/lombard st(reet)?/.test(a)) return 'downtown-core';
  if (/pearl st(reet)?/.test(a)) return 'downtown-core';
  if (/elm st(reet)?/.test(a)) return 'downtown-core';
  if (/gerrard st(reet)? (w|west)/.test(a)) return 'downtown-core';

  // Riverside / East Downtown
  if (/king st(reet)? (e|east)/.test(a) && num > 200) return 'riverside';
  if (/parliament st(reet)?/.test(a) && num > 200) return 'riverside';
  if (/queen st(reet)? (e|east)/.test(a) && num >= 200 && num <= 500) return 'riverside';
  if (/river st(reet)?/.test(a)) return 'riverside';
  if (/saulter st(reet)?/.test(a)) return 'riverside';
  if (/ontario st(reet)?/.test(a) && num > 200) return 'riverside';
  if (/ontario st(reet)? south/.test(a)) return 'riverside';
  if (/berkeley st(reet)?/.test(a)) return 'riverside';

  // Queen West
  if (/queen st(reet)? (w|west)/.test(a) && num >= 400 && num <= 1200) return 'queen-west';
  if (/gladstone ave(nue)?/.test(a)) return 'queen-west';
  if (/dovercourt rd|dovercourt road/.test(a)) return 'queen-west';
  if (/symington ave(nue)?/.test(a)) return 'queen-west';
  if (/dundas st(reet)? (w|west)/.test(a) && num >= 1400 && num <= 1900) return 'queen-west';
  if (/dufferin st(reet)?/.test(a) && num <= 700) return 'queen-west';
  if (/brock ave(nue)?/.test(a)) return 'queen-west';
  if (/fauna|flora/.test(a)) return 'queen-west'; // addresses hint

  // Roncesvalles
  if (/roncesvalles/.test(a)) return 'roncesvalles';
  if (/howard park/.test(a)) return 'roncesvalles';

  // High Park
  if (/bloor st(reet)? (w|west)/.test(a) && num >= 1700 && num <= 2900) return 'high-park';
  if (/high park/.test(a)) return 'high-park';
  if (/southport st(reet)?/.test(a)) return 'high-park';

  // Junction
  if (/dundas st(reet)? (w|west)/.test(a) && num >= 2000 && num <= 3500) return 'junction';
  if (/keele st(reet)?/.test(a) && num <= 700) return 'junction';
  if (/junction rd/.test(a)) return 'junction';

  // Yorkville
  if (/bloor st(reet)? (w|west)/.test(a) && num >= 50 && num <= 250) return 'yorkville';
  if (/bloor st(reet)? (e|east)/.test(a) && num <= 400) return 'yorkville';
  if (/avenue rd|avenue road/.test(a) && num <= 250) return 'yorkville';
  if (/bay st(reet)?/.test(a) && num >= 700 && num <= 1300) return 'yorkville';
  if (/scollard st(reet)?/.test(a)) return 'yorkville';
  if (/yorkville ave(nue)?/.test(a)) return 'yorkville';
  if (/charles st(reet)? (e|east)/.test(a) && num <= 100) return 'yorkville';
  if (/st joseph st(reet)?/.test(a)) return 'yorkville';
  if (/st george st(reet)?/.test(a) && num <= 200) return 'yorkville';
  if (/wellesley st(reet)? (e|east)/.test(a) && num <= 100) return 'yorkville';
  if (/huntley st(reet)?|earl st/.test(a)) return 'yorkville';
  if (/isabella st(reet)?/.test(a) && num <= 200) return 'yorkville';
  if (/yonge st(reet)?/.test(a) && num >= 600 && num <= 1000) return 'yorkville';
  if (/saint mary st(reet)?|st mary st(reet)?/.test(a)) return 'yorkville';
  if (/mcmurrich st(reet)?/.test(a)) return 'yorkville';

  // The Annex
  if (/bloor st(reet)? (w|west)/.test(a) && num >= 300 && num <= 900) return 'the-annex';
  if (/spadina (ave|road)/.test(a) && num <= 250) return 'the-annex';
  if (/walmer rd|walmer road/.test(a)) return 'the-annex';
  if (/prince arthur/.test(a)) return 'the-annex';
  if (/davenport rd/.test(a) && num <= 350) return 'the-annex';
  if (/wychwood/.test(a)) return 'the-annex';

  // Midtown
  if (/yonge st(reet)?/.test(a) && num >= 1100 && num <= 1500) return 'midtown';
  if (/davisville ave(nue)?/.test(a)) return 'midtown';
  if (/mount pleasant rd|mt pleasant/.test(a) && num <= 600) return 'midtown';
  if (/merton st(reet)?/.test(a)) return 'midtown';
  if (/roehampton ave(nue)?/.test(a)) return 'midtown';
  if (/balliol st(reet)?/.test(a)) return 'midtown';
  if (/broadway ave(nue)?/.test(a) && num <= 250) return 'midtown';
  if (/brownlow ave(nue)?/.test(a)) return 'midtown';
  if (/lawton blvd/.test(a)) return 'midtown';
  if (/jackes ave(nue)?/.test(a)) return 'midtown';
  if (/heath st(reet)?/.test(a)) return 'midtown';
  if (/erskine ave(nue)?/.test(a)) return 'midtown';

  // Yonge-Eglinton
  if (/yonge st(reet)?/.test(a) && num >= 1500 && num <= 2500) return 'yonge-eglinton';
  if (/eglinton ave(nue)? (w|west)/.test(a) && num <= 600) return 'yonge-eglinton';
  if (/eglinton ave(nue)? (e|east)/.test(a) && num <= 250) return 'yonge-eglinton';
  if (/eglinton ave(nue)?/.test(a) && num <= 200) return 'yonge-eglinton';
  if (/st clair ave(nue)? (w|west)/.test(a) && num <= 700) return 'yonge-eglinton';
  if (/lola rd/.test(a)) return 'yonge-eglinton';
  if (/saint clair ave(nue)? (w|west)/.test(a) && num <= 700) return 'yonge-eglinton';
  if (/1 eglinton/.test(a)) return 'yonge-eglinton';
  if (/eglinton square/.test(a)) return 'yonge-eglinton';

  // Leaside
  if (/laird dr(ive)?/.test(a)) return 'leaside';
  if (/bayview ave(nue)?/.test(a) && num >= 1700 && num <= 2200) return 'leaside';
  if (/eglinton ave(nue)? (e|east)/.test(a) && num >= 700 && num <= 1000) return 'leaside';
  if (/millwood rd/.test(a)) return 'leaside';
  if (/brentcliffe rd/.test(a)) return 'leaside';
  if (/bennlamond|benlamond/.test(a)) return 'leaside';
  if (/leslie st(reet)?/.test(a) && num >= 1000) return 'leaside';

  // Leslieville
  if (/queen st(reet)? (e|east)/.test(a) && num >= 500 && num <= 1500) return 'leslieville';
  if (/broadview ave(nue)?/.test(a) && num <= 1200) return 'leslieville';
  if (/gerrard st(reet)? (e|east)/.test(a) && num <= 1400) return 'leslieville';
  if (/woodbine ave(nue)?/.test(a) && num <= 150) return 'leslieville';
  if (/pape ave(nue)?/.test(a) && num <= 300) return 'leslieville';
  if (/laing st(reet)?/.test(a)) return 'leslieville';
  if (/leslie st(reet)?/.test(a) && num <= 1100) return 'leslieville';
  if (/glen everest/.test(a)) return 'leslieville';
  if (/chatham ave(nue)?/.test(a)) return 'leslieville';

  // Danforth
  if (/danforth ave(nue)?/.test(a) && num >= 200 && num <= 3200) return 'danforth';
  if (/woodbine ave(nue)?/.test(a) && num >= 400) return 'danforth';
  if (/cosburn ave(nue)?/.test(a)) return 'danforth';
  if (/pape ave(nue)?/.test(a) && num >= 300) return 'danforth';
  if (/dawes rd/.test(a)) return 'danforth';

  // North York (general)
  if (/yonge st(reet)?/.test(a) && num >= 2500) return 'north-york';
  if (/sheppard ave(nue)?/.test(a)) return 'north-york';
  if (/finch ave(nue)?/.test(a)) return 'north-york';
  if (/wilson ave(nue)?/.test(a)) return 'north-york';
  if (/bayview ave(nue)?/.test(a) && num >= 2200) return 'north-york';
  if (/steeles ave(nue)? (w|west)/.test(a)) return 'north-york';
  if (/weston rd/.test(a)) return 'north-york';
  if (/jane st(reet)?/.test(a) && num >= 2000) return 'north-york';
  if (/keele st(reet)?/.test(a) && num >= 1000) return 'north-york';
  if (/dufferin st(reet)?/.test(a) && num >= 2000) return 'north-york';
  if (/bathurst st(reet)?/.test(a) && num >= 3500) return 'north-york';
  if (/avenue road/.test(a) && num >= 1400) return 'north-york';
  if (/glencairn ave(nue)?/.test(a)) return 'north-york';
  if (/antibes dr(ive)?/.test(a)) return 'north-york';
  if (/tippett rd/.test(a)) return 'north-york';
  if (/drewry ave(nue)?/.test(a)) return 'north-york';
  if (/poyntz ave(nue)?/.test(a)) return 'north-york';
  if (/tangreen ct/.test(a)) return 'north-york';
  if (/marlee ave(nue)?/.test(a)) return 'north-york';
  if (/viewmount ave(nue)?/.test(a)) return 'north-york';
  if (/duplex ave(nue)?/.test(a)) return 'midtown';
  if (/roselawn ave(nue)?/.test(a)) return 'north-york';
  if (/hollis st(reet)?/.test(a)) return 'north-york';
  if (/hendon ave(nue)?/.test(a)) return 'north-york';
  if (/catford rd/.test(a)) return 'north-york';
  if (/ridley blvd/.test(a)) return 'north-york';
  if (/cactus ave(nue)?/.test(a)) return 'north-york';
  if (/oldyork mills|old york mills/.test(a)) return 'north-york';
  if (/york mills/.test(a)) return 'north-york';

  // Etobicoke
  if (/kipling ave(nue)?/.test(a)) return 'etobicoke';
  if (/islington ave(nue)?/.test(a)) return 'etobicoke';
  if (/royal york rd/.test(a)) return 'etobicoke';
  if (/the queensway/.test(a)) return 'etobicoke';
  if (/the west mall|east mall/.test(a)) return 'etobicoke';
  if (/bloor st(reet)? (w|west)/.test(a) && num >= 3000) return 'etobicoke';
  if (/dundas st(reet)? (w|west)/.test(a) && num >= 4000) return 'etobicoke';
  if (/zorra st(reet)?|thomas riley|fieldway rd/.test(a)) return 'etobicoke';
  if (/eva rd/.test(a)) return 'etobicoke';
  if (/gibbs rd/.test(a)) return 'etobicoke';
  if (/jopling ave(nue)?/.test(a)) return 'etobicoke';
  if (/markland dr(ive)?/.test(a)) return 'etobicoke';
  if (/wincott dr(ive)?/.test(a)) return 'etobicoke';
  if (/lake shore blvd(evard)? west/.test(a) && num >= 700) return 'etobicoke';
  if (/lake shore boulevard west/.test(a) && num >= 700) return 'etobicoke';
  if (/lake promenade/.test(a)) return 'etobicoke';
  if (/queens plate/.test(a)) return 'etobicoke';

  // Scarborough
  if (/kennedy rd/.test(a) && num <= 3100) return 'scarborough';
  if (/markham rd/.test(a)) return 'scarborough';
  if (/morningside/.test(a)) return 'scarborough';
  if (/ellesmere/.test(a)) return 'scarborough';
  if (/military trail/.test(a)) return 'scarborough';
  if (/progress ave(nue)?/.test(a)) return 'scarborough';
  if (/brimley rd/.test(a)) return 'scarborough';
  if (/tapscott rd/.test(a)) return 'scarborough';
  if (/middlefield rd/.test(a)) return 'scarborough';
  if (/pharmacy ave(nue)?/.test(a)) return 'scarborough';
  if (/glen watford/.test(a)) return 'scarborough';
  if (/metropolitan rd/.test(a)) return 'scarborough';
  if (/stonehill ct/.test(a)) return 'scarborough';
  if (/birchmount rd/.test(a)) return 'scarborough';
  if (/warden ave(nue)?/.test(a)) return 'scarborough';
  if (/finch ave(nue)? (e|east)/.test(a) && num >= 2500) return 'scarborough';
  if (/sheppard ave(nue)? (e|east)/.test(a) && num >= 3000) return 'scarborough';
  if (/eglinton ave(nue)? (e|east)/.test(a) && num >= 1800) return 'scarborough';
  if (/lawrence ave(nue)? (e|east)/.test(a) && num >= 1500) return 'scarborough';
  if (/danforth ave(nue)?/.test(a) && num >= 3100) return 'scarborough';
  if (/danforth rd/.test(a)) return 'scarborough';
  if (/victoria park ave(nue)?/.test(a) && num >= 1400) return 'scarborough';
  if (/kingston rd/.test(a) && num >= 900) return 'scarborough';
  if (/saint clair ave(nue)? (e|east)/.test(a) && num >= 3000) return 'scarborough';
  if (/st clair ave(nue)? (e|east)/.test(a) && num >= 3000) return 'scarborough';
  if (/sandhurst/.test(a)) return 'scarborough';
  if (/midland ave(nue)?/.test(a)) return 'scarborough';
  if (/don mills rd/.test(a)) return 'north-york';
  if (/wynford dr(ive)?/.test(a)) return 'north-york';

  // Default
  return 'downtown-core';
}

// Unsplash placeholder images (15 curated Toronto / condo photos)
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507992781348-310259076fe0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1486175060817-b9cfb6ccdb2c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=1200&q=80',
];

function getPlaceholderImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

async function geocodeAddress(
  address: string,
  token: string
): Promise<{ lat: number; lng: number } | null> {
  if (!token) return null;
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=CA&proximity=-79.38%2C43.65&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

function extractDeveloperNames(developerStr: string): string[] {
  if (!developerStr || developerStr === 'Unknown') return [];
  return developerStr
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏗️  CondoWizard — Seeding pending Toronto projects\n');

  console.log('ℹ️  NOTE: The Supabase anon key does not have DELETE permission.');
  console.log('   To fully remove old/dummy projects FIRST run this in Supabase SQL Editor:');
  console.log('   DELETE FROM projects;');
  console.log('   DELETE FROM developers;');
  console.log('   (Dashboard → SQL Editor → New query → paste → Run)\n');

  // ── 2. Build unique developer set ──────────────────────────────────────────
  console.log('\n👷 Building developer profiles...');
  const developerNameSet = new Set<string>();
  for (const p of PROJECTS) {
    for (const dev of extractDeveloperNames(p.developerStr)) {
      developerNameSet.add(dev);
    }
  }

  const developerSlugToId: Record<string, string> = {};

  for (const name of developerNameSet) {
    const slug = slugify(name);
    const { data, error } = await supabase
      .from('developers')
      .upsert(
        {
          name,
          slug,
          headquarters: 'Toronto, ON',
          description: `${name} is a real estate developer active in the Greater Toronto Area pre-construction market.`,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (error) {
      console.warn(`  ⚠ Developer "${name}": ${error.message}`);
    } else if (data) {
      developerSlugToId[slug] = data.id;
    }
  }
  console.log(`  ✓ ${developerNameSet.size} developer profiles created`);

  // ── 3. Load neighborhood map ────────────────────────────────────────────────
  console.log('\n🗺️  Loading neighborhoods...');
  const { data: neighborhoods, error: nhErr } = await supabase
    .from('neighborhoods')
    .select('id, slug');
  if (nhErr) {
    console.error('  ✗ Failed to load neighborhoods:', nhErr.message);
    process.exit(1);
  }
  const neighborhoodSlugToId: Record<string, string> = {};
  for (const n of neighborhoods || []) {
    neighborhoodSlugToId[n.slug] = n.id;
  }
  console.log(`  ✓ ${Object.keys(neighborhoodSlugToId).length} neighborhoods loaded`);

  // ── 4. Geocode and insert projects ─────────────────────────────────────────
  console.log('\n📍 Geocoding and inserting projects...');
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const slug = slugify(p.name);

    // Determine primary developer id
    const devNames = extractDeveloperNames(p.developerStr);
    let developerId: string | null = null;
    if (devNames.length > 0) {
      const devSlug = slugify(devNames[0]);
      developerId = developerSlugToId[devSlug] || null;
    }

    // Determine neighborhood
    const nhSlug = getNeighborhoodSlug(p.address);
    const neighborhoodId = neighborhoodSlugToId[nhSlug] || null;

    // Geocode
    let lat: number | null = null;
    let lng: number | null = null;
    if (MAPBOX_TOKEN) {
      const coords = await geocodeAddress(p.address, MAPBOX_TOKEN);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      } else {
        // Fallback to Toronto city centre
        lat = 43.6532;
        lng = -79.3832;
      }
      await sleep(60); // ~16 req/s, well within Mapbox free tier
    }

    const mainImageUrl = getPlaceholderImage(i);

    const { error } = await supabase.from('projects').upsert(
      {
        name: p.name,
        slug,
        address: p.address,
        status: 'PRE_LAUNCH',
        category: 'PREMIUM',
        featured: false,
        developerId,
        neighborhoodId,
        latitude: lat,
        longitude: lng,
        mainImageUrl,
        images: [mainImageUrl],
        description:
          `${p.name} is an upcoming pre-construction condominium in Toronto. ` +
          `Pricing and floorplans are not yet available. Register your interest to receive priority updates.`,
        amenities: [],
        priceMin: null,
        priceMax: null,
      },
      { onConflict: 'slug' }
    );

    if (error) {
      console.warn(`  [${i + 1}/${PROJECTS.length}] ✗ ${p.name}: ${error.message}`);
      failed++;
    } else {
      if ((i + 1) % 25 === 0 || i === PROJECTS.length - 1) {
        console.log(`  [${i + 1}/${PROJECTS.length}] ✓ ${Math.round(((i + 1) / PROJECTS.length) * 100)}% complete`);
      }
      inserted++;
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted} | Failed: ${failed} | Total: ${PROJECTS.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
