// Maps marketing area names to their constituent Repliers neighbourhood names
// Areas are broad (Downtown Core = 8 neighbourhoods), neighbourhoods are specific (Bay Street Corridor)

export const AREA_TO_NEIGHBOURHOODS: Record<string, string[]> = {
  'downtown-core': ['Waterfront Communities C1', 'Bay Street Corridor', 'Church-Yonge Corridor', 'Moss Park', 'Regent Park', 'North St. James Town', 'Corktown'],
  'king-west': ['Niagara', 'Trinity-Bellwoods', 'Little Portugal'],
  'liberty-village': ['Niagara'],
  'queen-west': ['Trinity-Bellwoods', 'Palmerston-Little Italy', 'Dufferin Grove'],
  'yorkville': ['Annex', 'Yonge-St. Clair', 'Rosedale-Moore Park'],
  'the-annex': ['Annex'],
  'midtown': ['Yonge-Eglinton', 'Mount Pleasant East', 'Mount Pleasant West'],
  'yonge-eglinton': ['Yonge-Eglinton'],
  'north-york': ['Willowdale West', 'Willowdale East', 'Newtonbrook West', 'Newtonbrook East', 'Lansing-Westgate'],
  'scarborough': ['Scarborough Village', 'Agincourt North', 'Agincourt South-Malvern West', 'Malvern', 'Woburn'],
  'etobicoke': ['Islington-City Centre West', 'Eringate-Centennial-West Deane', 'Kingsway South', 'Mimico', 'New Toronto', 'Long Branch'],
  'leaside': ['Leaside'],
  'leslieville': ['South Riverdale', 'Greenwood-Coxwell'],
  'riverside': ['South Riverdale', 'North Riverdale'],
  'danforth': ['Danforth', 'Greenwood-Coxwell', 'Playter Estates-Danforth'],
  'high-park': ['High Park-Swansea', 'High Park North', 'Roncesvalles'],
  'junction': ['Junction Area', 'Dovercourt-Wallace Emerson-Junction'],
  'waterfront': ['Waterfront Communities C1', 'Waterfront Communities C8'],
  'cityplace': ['Waterfront Communities C1'],
  'fort-york': ['Waterfront Communities C1', 'Niagara'],
  'mississauga': [], // Use city=Mississauga
  'vaughan': [],     // Use city=Vaughan
  'richmond-hill': [], // Use city=Richmond Hill
  'markham': [],     // Use city=Markham
  'oakville': [],    // Use city=Oakville
  'burlington': [],  // Use city=Burlington
  'hamilton': [],    // Use city=Hamilton
  'brampton': [],    // Use city=Brampton
};

// For areas with empty neighbourhood lists, use city-level search
export const AREA_TO_CITY: Record<string, string> = {
  'mississauga': 'Mississauga',
  'vaughan': 'Vaughan',
  'richmond-hill': 'Richmond Hill',
  'markham': 'Markham',
  'oakville': 'Oakville',
  'burlington': 'Burlington',
  'hamilton': 'Hamilton',
  'brampton': 'Brampton',
};

// Get the Repliers query params for an area slug
export function getAreaSearchParams(areaSlug: string): { neighborhoods?: string[]; city?: string } {
  const neighbourhoods = AREA_TO_NEIGHBOURHOODS[areaSlug];
  if (neighbourhoods && neighbourhoods.length > 0) {
    return { neighborhoods: neighbourhoods };
  }
  const city = AREA_TO_CITY[areaSlug];
  if (city) {
    return { city };
  }
  // Fallback: try the slug as a neighbourhood name
  const name = areaSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { neighborhoods: [name] };
}
