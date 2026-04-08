'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS } from '@/types/listing';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const SOLD_PIN_COLOR = '#9CA3AF';

interface CommunityBoundary {
  name: string;
  boundary: number[][][];
  lat: number;
  lng: number;
}

interface SearchMapProps {
  listings: UnifiedListing[];
  highlightedId: string | null;
  onMarkerHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
  isSoldView?: boolean;
  onCommunityClick?: (code: string, name: string) => void;
}

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick }: SearchMapProps) {
  const mapRef = useRef<any>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6532, zoom: 12.5, pitch: 45, bearing: -15,
  });

  // Fetch community boundaries ONCE on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/repliers/communities');
        if (res.ok) {
          const data = await res.json();
          setBoundaries(data.locations || []);
          console.log(`[CondoWizard] Loaded ${data.locations?.length || 0} community boundaries`);
        }
      } catch (err) {
        console.error('[CondoWizard] Failed to load community boundaries:', err);
      }
    })();
  }, []);

  // GeoJSON for neighbourhood boundaries (always visible)
  const boundariesGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: boundaries.map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: b.boundary },
      properties: { name: b.name },
    })),
  };

  // GeoJSON for neighbourhood name labels
  const labelsGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: boundaries.filter((b) => b.lat && b.lng).map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
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

  const handleMapClick = useCallback((e: any) => {
    if (!onCommunityClick || !e.features?.length) return;
    const feature = e.features[0];
    if (feature?.properties?.name) {
      onCommunityClick(feature.properties.name, feature.properties.name);
    }
  }, [onCommunityClick]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      onClick={handleMapClick}
      interactiveLayerIds={boundaries.length > 0 ? ['community-fill'] : undefined}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
      reuseMaps
    >
      <NavigationControl position="top-right" />
      <FullscreenControl position="top-right" />

      {/* Community boundaries — ALWAYS visible */}
      {boundaries.length > 0 && (
        <>
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer
              id="community-fill"
              type="fill"
              paint={{
                'fill-color': '#0066FF',
                'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.12, 0.04],
              }}
            />
            <Layer
              id="community-outline"
              type="line"
              paint={{
                'line-color': '#0066FF',
                'line-width': 1,
                'line-dasharray': [3, 2],
                'line-opacity': 0.25,
              }}
            />
          </Source>
          <Source id="community-labels" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="community-label-text"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': 10,
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false,
                'text-optional': true,
              }}
              paint={{
                'text-color': 'rgba(0,102,255,0.5)',
                'text-halo-color': 'rgba(0,0,0,0.8)',
                'text-halo-width': 1,
              }}
              minzoom={12}
            />
          </Source>
        </>
      )}

      {/* Listing pins — on top of community boundaries */}
      {listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        const isHighlighted = listing.id === highlightedId;
        const color = isSoldView || listing.soldPrice
          ? SOLD_PIN_COLOR
          : listing.source === 'precon'
          ? '#FBBF24'
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
      {popup && popup.lat && popup.lng && (
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
