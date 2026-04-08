// TRREB community code → neighbourhood mapping and approximate center points
// Used for community overlay on map and neighbourhood auto-populate

export interface CommunityInfo {
  code: string;
  name: string;
  neighbourhoods: string[];
  center: [number, number]; // [lng, lat]
}

export const TRREB_COMMUNITIES: CommunityInfo[] = [
  { code: 'C01', name: 'Downtown / Waterfront', neighbourhoods: ['Waterfront Communities-The Island', 'St. Lawrence-East Bayfront-The Islands', 'Church-Wellesley', 'Bay Street Corridor', 'Regent Park', 'Moss Park', 'Corktown'], center: [-79.376, 43.645] },
  { code: 'C02', name: 'Annex / U of T', neighbourhoods: ['University', 'Kensington-Chinatown', 'Annex', 'Palmerston-Little Italy', 'Dufferin Grove', 'Little Portugal', 'Trinity-Bellwoods'], center: [-79.408, 43.660] },
  { code: 'C03', name: 'Forest Hill / Yorkville', neighbourhoods: ['Forest Hill North', 'Forest Hill South', 'Yonge-St. Clair', 'Deer Park', 'Casa Loma', 'South Hill', 'Wychwood'], center: [-79.410, 43.685] },
  { code: 'C04', name: 'Yonge & Eglinton', neighbourhoods: ['North St. James Town', 'Cabbagetown-South St. James Town', 'Rosedale-Moore Park', 'Mount Pleasant East', 'Mount Pleasant West', 'Yonge-Eglinton'], center: [-79.395, 43.710] },
  { code: 'C06', name: 'North York Centre', neighbourhoods: ['York Mills', 'Bridle Path-Sunnybrook-York Mills', 'St. Andrew-Windfields', 'Hoggs Hollow'], center: [-79.390, 43.745] },
  { code: 'C07', name: 'Willowdale', neighbourhoods: ['Willowdale West', 'Willowdale East', 'Newtonbrook West', 'Newtonbrook East', 'Lansing-Westgate'], center: [-79.410, 43.770] },
  { code: 'C08', name: 'Leslieville / Riverdale', neighbourhoods: ['South Riverdale', 'North Riverdale', 'Playter Estates-Danforth', 'Broadview North', 'Greenwood-Coxwell', 'East End-Danforth', 'Blake-Jones', 'Leslieville'], center: [-79.340, 43.665] },
  { code: 'C09', name: 'Bayview Village', neighbourhoods: ['Bayview Village', 'Henry Farm', 'Don Valley Village', 'Parkwoods-Donalda', 'Victoria Village'], center: [-79.360, 43.770] },
  { code: 'C10', name: 'King West / Liberty', neighbourhoods: ['Niagara', 'King West', 'Liberty Village', 'Dovercourt-Wallace Emerson-Junction', 'Roncesvalles', 'Parkdale', 'High Park-Swansea'], center: [-79.430, 43.640] },
  { code: 'C11', name: 'Leaside / Bennington', neighbourhoods: ['Leaside-Bennington', 'Thorncliffe Park', 'Flemingdon Park', 'Don Mills'], center: [-79.355, 43.710] },
  { code: 'C12', name: 'Scarborough', neighbourhoods: ['Agincourt North', 'Agincourt South-Malvern West', 'Milliken', 'Rouge', 'Tam O\'Shanter-Sullivan', "L'Amoreaux", 'Steeles'], center: [-79.260, 43.790] },
  { code: 'C13', name: 'Scarborough East', neighbourhoods: ['Scarborough Village', 'Guildwood', 'West Hill', 'Highland Creek', 'Centennial Scarborough', 'Morningside', 'Clairlea-Birchmount'], center: [-79.210, 43.760] },
  { code: 'C14', name: 'Etobicoke / Mimico', neighbourhoods: ['Mimico', 'New Toronto', 'Long Branch', 'Alderwood', 'Stonegate-Queensway', 'Islington-City Centre West', 'Eringate-Centennial-West Deane'], center: [-79.510, 43.620] },
  { code: 'C15', name: 'Kingsway / Bloor West', neighbourhoods: ['Kingsway South', 'Sunnylea', 'The Kingsway', 'Princess-Rosethorn', 'Edenbridge-Humber Valley', 'Humber Heights-Westmount', 'Markland Wood'], center: [-79.510, 43.650] },
];

// Flat map: neighbourhood name → community code
export const NEIGHBOURHOOD_TO_COMMUNITY: Record<string, string> = {};
TRREB_COMMUNITIES.forEach((c) => {
  c.neighbourhoods.forEach((n) => {
    NEIGHBOURHOOD_TO_COMMUNITY[n] = c.code;
    NEIGHBOURHOOD_TO_COMMUNITY[n.toLowerCase()] = c.code;
  });
});

export function getCommunityByCode(code: string): CommunityInfo | undefined {
  return TRREB_COMMUNITIES.find((c) => c.code === code);
}

export function getNeighbourhoodsForCommunity(code: string): string[] {
  return getCommunityByCode(code)?.neighbourhoods || [];
}
