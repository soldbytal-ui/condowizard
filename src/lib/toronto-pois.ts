// Static reference dataset of well-known Toronto points of interest.
// These are public geographic reference points (subway station coordinates,
// downtown landmarks) — not per-listing data. Distances shown on the
// listing page are computed at render time from the listing's own lat/lng
// against this reference set.
//
// If in the future a real POI/proximity API is wired up, replace the
// consumer with API-driven results; this file can go away.

export interface TorontoPOI {
  name: string;
  kind: 'transit' | 'landmark' | 'shopping' | 'education';
  lat: number;
  lng: number;
}

export const TORONTO_POIS: TorontoPOI[] = [
  // TTC subway — Line 1 (Yonge–University)
  { name: 'Union Station', kind: 'transit', lat: 43.6453, lng: -79.3806 },
  { name: 'St. Andrew Station', kind: 'transit', lat: 43.6483, lng: -79.3856 },
  { name: 'Osgoode Station', kind: 'transit', lat: 43.6510, lng: -79.3868 },
  { name: 'St. Patrick Station', kind: 'transit', lat: 43.6547, lng: -79.3877 },
  { name: 'Queen Station', kind: 'transit', lat: 43.6524, lng: -79.3789 },
  { name: 'Dundas Station', kind: 'transit', lat: 43.6564, lng: -79.3806 },
  { name: 'College Station', kind: 'transit', lat: 43.6614, lng: -79.3831 },
  { name: 'Wellesley Station', kind: 'transit', lat: 43.6650, lng: -79.3839 },
  { name: 'Bloor–Yonge Station', kind: 'transit', lat: 43.6708, lng: -79.3859 },
  { name: 'Rosedale Station', kind: 'transit', lat: 43.6774, lng: -79.3888 },
  { name: 'Summerhill Station', kind: 'transit', lat: 43.6820, lng: -79.3897 },
  { name: 'St. Clair Station', kind: 'transit', lat: 43.6879, lng: -79.3934 },
  { name: 'Davisville Station', kind: 'transit', lat: 43.6979, lng: -79.3956 },
  { name: 'Eglinton Station', kind: 'transit', lat: 43.7062, lng: -79.3983 },
  { name: 'Lawrence Station', kind: 'transit', lat: 43.7259, lng: -79.4025 },
  { name: 'York Mills Station', kind: 'transit', lat: 43.7444, lng: -79.4070 },
  { name: 'Sheppard–Yonge Station', kind: 'transit', lat: 43.7615, lng: -79.4110 },
  { name: 'North York Centre Station', kind: 'transit', lat: 43.7683, lng: -79.4133 },
  { name: 'Finch Station', kind: 'transit', lat: 43.7807, lng: -79.4154 },
  { name: 'Museum Station', kind: 'transit', lat: 43.6672, lng: -79.3937 },
  { name: 'St. George Station', kind: 'transit', lat: 43.6683, lng: -79.3993 },
  { name: 'Spadina Station', kind: 'transit', lat: 43.6669, lng: -79.4041 },
  { name: 'Dupont Station', kind: 'transit', lat: 43.6743, lng: -79.4074 },
  { name: 'St. Clair West Station', kind: 'transit', lat: 43.6822, lng: -79.4116 },

  // TTC subway — Line 2 (Bloor–Danforth)
  { name: 'Ossington Station', kind: 'transit', lat: 43.6633, lng: -79.4230 },
  { name: 'Dufferin Station', kind: 'transit', lat: 43.6597, lng: -79.4351 },
  { name: 'Lansdowne Station', kind: 'transit', lat: 43.6592, lng: -79.4416 },
  { name: 'Dundas West Station', kind: 'transit', lat: 43.6650, lng: -79.4498 },
  { name: 'Keele Station', kind: 'transit', lat: 43.6656, lng: -79.4590 },
  { name: 'High Park Station', kind: 'transit', lat: 43.6551, lng: -79.4655 },
  { name: 'Runnymede Station', kind: 'transit', lat: 43.6516, lng: -79.4737 },
  { name: 'Jane Station', kind: 'transit', lat: 43.6491, lng: -79.4838 },
  { name: 'Old Mill Station', kind: 'transit', lat: 43.6491, lng: -79.4949 },
  { name: 'Royal York Station', kind: 'transit', lat: 43.6485, lng: -79.5062 },
  { name: 'Islington Station', kind: 'transit', lat: 43.6453, lng: -79.5240 },
  { name: 'Kipling Station', kind: 'transit', lat: 43.6367, lng: -79.5359 },
  { name: 'Bathurst Station', kind: 'transit', lat: 43.6656, lng: -79.4108 },
  { name: 'Sherbourne Station', kind: 'transit', lat: 43.6714, lng: -79.3767 },
  { name: 'Castle Frank Station', kind: 'transit', lat: 43.6737, lng: -79.3684 },
  { name: 'Broadview Station', kind: 'transit', lat: 43.6767, lng: -79.3585 },
  { name: 'Chester Station', kind: 'transit', lat: 43.6785, lng: -79.3527 },
  { name: 'Pape Station', kind: 'transit', lat: 43.6796, lng: -79.3450 },
  { name: 'Donlands Station', kind: 'transit', lat: 43.6820, lng: -79.3379 },
  { name: 'Greenwood Station', kind: 'transit', lat: 43.6837, lng: -79.3305 },
  { name: 'Coxwell Station', kind: 'transit', lat: 43.6844, lng: -79.3220 },
  { name: 'Woodbine Station', kind: 'transit', lat: 43.6854, lng: -79.3121 },
  { name: 'Main Street Station', kind: 'transit', lat: 43.6907, lng: -79.3013 },
  { name: 'Victoria Park Station', kind: 'transit', lat: 43.6952, lng: -79.2884 },
  { name: 'Warden Station', kind: 'transit', lat: 43.7113, lng: -79.2793 },
  { name: 'Kennedy Station', kind: 'transit', lat: 43.7325, lng: -79.2635 },

  // Downtown landmarks
  { name: 'CN Tower', kind: 'landmark', lat: 43.6426, lng: -79.3871 },
  { name: 'Rogers Centre', kind: 'landmark', lat: 43.6414, lng: -79.3894 },
  { name: 'Scotiabank Arena', kind: 'landmark', lat: 43.6435, lng: -79.3791 },
  { name: 'Toronto Financial District', kind: 'landmark', lat: 43.6486, lng: -79.3800 },
  { name: 'Distillery District', kind: 'landmark', lat: 43.6503, lng: -79.3599 },
  { name: 'Harbourfront Centre', kind: 'landmark', lat: 43.6389, lng: -79.3833 },
  { name: 'Toronto Islands Ferry', kind: 'landmark', lat: 43.6408, lng: -79.3743 },
  { name: 'Ripley’s Aquarium', kind: 'landmark', lat: 43.6424, lng: -79.3860 },
  { name: 'Casa Loma', kind: 'landmark', lat: 43.6780, lng: -79.4094 },
  { name: 'Royal Ontario Museum', kind: 'landmark', lat: 43.6677, lng: -79.3948 },
  { name: 'AGO (Art Gallery of Ontario)', kind: 'landmark', lat: 43.6536, lng: -79.3925 },

  // Major shopping / hubs
  { name: 'CF Toronto Eaton Centre', kind: 'shopping', lat: 43.6544, lng: -79.3807 },
  { name: 'Yorkdale Shopping Centre', kind: 'shopping', lat: 43.7256, lng: -79.4523 },
  { name: 'Sherway Gardens', kind: 'shopping', lat: 43.6113, lng: -79.5573 },
  { name: 'Fairview Mall', kind: 'shopping', lat: 43.7783, lng: -79.3446 },
  { name: 'St. Lawrence Market', kind: 'landmark', lat: 43.6487, lng: -79.3717 },

  // Education
  { name: 'University of Toronto (St. George)', kind: 'education', lat: 43.6629, lng: -79.3957 },
  { name: 'Toronto Metropolitan University', kind: 'education', lat: 43.6577, lng: -79.3788 },
  { name: 'OCAD University', kind: 'education', lat: 43.6531, lng: -79.3912 },
  { name: 'George Brown College – St. James', kind: 'education', lat: 43.6531, lng: -79.3691 },
];

// Haversine distance in kilometres.
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const a = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface RankedPOI extends TorontoPOI {
  distanceKm: number;
}

export function nearestPOIs(
  lat: number,
  lng: number,
  opts: { limit?: number; maxKm?: number; kinds?: Array<TorontoPOI['kind']> } = {}
): RankedPOI[] {
  const limit = opts.limit ?? 6;
  const maxKm = opts.maxKm ?? 12;
  const kinds = opts.kinds;
  const source = kinds ? TORONTO_POIS.filter((p) => kinds.includes(p.kind)) : TORONTO_POIS;
  return source
    .map((p) => ({ ...p, distanceKm: haversineKm(lat, lng, p.lat, p.lng) }))
    .filter((p) => p.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function walkMinutes(km: number): number {
  // Average walking speed ~5 km/h.
  return Math.round((km / 5) * 60);
}

export function driveMinutes(km: number): number {
  // Toronto surface-street average ~25 km/h to account for lights and traffic.
  return Math.round((km / 25) * 60);
}
