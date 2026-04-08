'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS } from '@/types/listing';
import { TRREB_COMMUNITIES, CommunityInfo } from '@/lib/communities';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const SOLD_PIN_COLOR = '#9CA3AF';

interface SearchMapProps {
  listings: UnifiedListing[];
  highlightedId: string | null;
  onMarkerHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
  isSoldView?: boolean;
  onCommunityClick?: (code: string, name: string) => void;
}

interface NeighbourhoodBoundary {
  name: string;
  community?: string;
  boundary: number[][][];
}

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick }: SearchMapProps) {
  const mapRef = useRef<any>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);
  const [showCommunities, setShowCommunities] = useState(false);
  const [boundaries, setBoundaries] = useState<NeighbourhoodBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 12.5,
    pitch: 45,
    bearing: -15,
  });

  // Fetch neighbourhood boundaries on first toggle
  useEffect(() => {
    if (!showCommunities || boundaries.length > 0) return;
    (async () => {
      try {
        const allBoundaries: NeighbourhoodBoundary[] = [];
        for (let page = 1; page <= 2; page++) {
          const res = await fetch(`/api/repliers/locations?type=boundaries&page=${page}`);
          if (!res.ok) break;
          const data = await res.json();
          for (const loc of data.locations || []) {
            if (loc.map?.boundary) {
              allBoundaries.push({ name: loc.name, boundary: loc.map.boundary });
            }
          }
        }
        setBoundaries(allBoundaries);
      } catch (err) {
        console.error('Failed to load boundaries:', err);
      }
    })();
  }, [showCommunities, boundaries.length]);

  // Build GeoJSON for community labels
  const communityLabelsGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: TRREB_COMMUNITIES.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: c.center },
      properties: { code: c.code, name: c.name },
    })),
  };

  // Build GeoJSON for neighbourhood polygons
  const boundariesGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: boundaries.map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: b.boundary },
      properties: { name: b.name },
    })),
  };

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    onBoundsChange({
      ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
    });
  }, [onBoundsChange]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      reuseMaps
    >
      <NavigationControl position="top-right" />
      <FullscreenControl position="top-right" />

      {/* Layer toggle button */}
      <div className="absolute top-2 left-2 z-10 flex bg-black/60 backdrop-blur-sm rounded-lg overflow-hidden">
        <button
          onClick={() => setShowCommunities(false)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${!showCommunities ? 'bg-accent-blue text-white' : 'text-white/70 hover:text-white'}`}
        >Listings</button>
        <button
          onClick={() => setShowCommunities(true)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${showCommunities ? 'bg-accent-blue text-white' : 'text-white/70 hover:text-white'}`}
        >Communities</button>
      </div>

      {/* Community overlay layers */}
      {showCommunities && boundaries.length > 0 && (
        <Source id="neighbourhood-boundaries" type="geojson" data={boundariesGeoJSON}>
          <Layer
            id="neighbourhood-fill"
            type="fill"
            paint={{
              'fill-color': '#0066FF',
              'fill-opacity': 0.08,
            }}
          />
          <Layer
            id="neighbourhood-outline"
            type="line"
            paint={{
              'line-color': '#0066FF',
              'line-width': 1.5,
              'line-dasharray': [3, 2],
              'line-opacity': 0.6,
            }}
          />
        </Source>
      )}

      {/* Community code labels */}
      {showCommunities && (
        <Source id="community-labels" type="geojson" data={communityLabelsGeoJSON}>
          <Layer
            id="community-label-bg"
            type="circle"
            paint={{
              'circle-radius': 18,
              'circle-color': '#0066FF',
              'circle-opacity': 0.85,
            }}
          />
          <Layer
            id="community-label-text"
            type="symbol"
            layout={{
              'text-field': ['get', 'code'],
              'text-size': 11,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-allow-overlap': true,
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
        </Source>
      )}

      {/* Community label click markers */}
      {showCommunities && TRREB_COMMUNITIES.map((c) => (
        <Marker key={c.code} latitude={c.center[1]} longitude={c.center[0]} anchor="center">
          <div
            className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            onClick={() => onCommunityClick?.(c.code, c.name)}
            title={`${c.code} - ${c.name}`}
          />
        </Marker>
      ))}

      {/* Listing pins — only when not in communities view */}
      {!showCommunities && listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        const isHighlighted = listing.id === highlightedId;
        const color = isSoldView || listing.soldPrice
          ? SOLD_PIN_COLOR
          : (BUILDING_TYPE_COLORS[listing.buildingType] || '#6B7280');

        return (
          <Marker key={listing.id} latitude={listing.lat} longitude={listing.lng} anchor="center">
            <div
              className="cursor-pointer transition-transform"
              style={{ transform: isHighlighted ? 'scale(1.8)' : 'scale(1)' }}
              onMouseEnter={() => { onMarkerHover(listing.id); setPopup(listing); }}
              onMouseLeave={() => { onMarkerHover(null); setPopup(null); }}
              onClick={() => {
                const href = listing.source === 'mls' ? `/listing/${listing.mlsNumber}` : `/projects/${listing.slug}`;
                window.open(href, '_blank');
              }}
            >
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: color }} />
            </div>
          </Marker>
        );
      })}

      {/* Popup */}
      {!showCommunities && popup && popup.lat && popup.lng && (
        <Popup latitude={popup.lat} longitude={popup.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={12} className="search-map-popup">
          <div className="p-0 min-w-[200px]">
            {popup.images?.[0] && <img src={popup.images[0]} alt={popup.address} className="w-full h-28 object-cover rounded-t" />}
            <div className="p-2">
              <p className="font-serif font-bold text-sm">
                {isSoldView && popup.soldPrice ? `$${popup.soldPrice.toLocaleString()} sold` : popup.priceDisplay}
              </p>
              <p className="text-xs text-gray-600 truncate">{popup.address}</p>
              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                {popup.beds > 0 && <span>{popup.beds} bd</span>}
                {popup.baths > 0 && <span>{popup.baths} ba</span>}
                {popup.sqft && <span>{popup.sqft} sqft</span>}
              </div>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
