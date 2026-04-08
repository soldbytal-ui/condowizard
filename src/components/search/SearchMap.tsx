'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS } from '@/types/listing';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface SearchMapProps {
  listings: UnifiedListing[];
  highlightedId: string | null;
  onMarkerHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
}

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange }: SearchMapProps) {
  const mapRef = useRef<any>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 12.5,
    pitch: 45,
    bearing: -15,
  });

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    onBoundsChange({
      ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
    });
  }, [onBoundsChange]);

  // Fly to highlighted listing
  useEffect(() => {
    if (!highlightedId || !mapRef.current) return;
    const listing = listings.find((l) => l.id === highlightedId);
    if (listing && listing.lat && listing.lng) {
      // Don't fly, just highlight - flying on hover is jarring
    }
  }, [highlightedId, listings]);

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

      {/* 3D building layer */}
      {/* Map pins */}
      {listings.map((listing) => {
        if (!listing.lat || !listing.lng) return null;
        const isHighlighted = listing.id === highlightedId;
        const color = BUILDING_TYPE_COLORS[listing.buildingType];

        return (
          <Marker
            key={listing.id}
            latitude={listing.lat}
            longitude={listing.lng}
            anchor="center"
          >
            <div
              className="cursor-pointer transition-transform"
              style={{ transform: isHighlighted ? 'scale(1.8)' : 'scale(1)' }}
              onMouseEnter={() => {
                onMarkerHover(listing.id);
                setPopup(listing);
              }}
              onMouseLeave={() => {
                onMarkerHover(null);
                setPopup(null);
              }}
              onClick={() => {
                const href = listing.source === 'mls'
                  ? `/listing/${listing.mlsNumber}`
                  : `/projects/${listing.slug}`;
                window.open(href, '_blank');
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: color }}
              />
            </div>
          </Marker>
        );
      })}

      {/* Popup on hover */}
      {popup && popup.lat && popup.lng && (
        <Popup
          latitude={popup.lat}
          longitude={popup.lng}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={12}
          className="search-map-popup"
        >
          <div className="p-0 min-w-[200px]">
            {popup.images[0] && (
              <img
                src={popup.images[0]}
                alt={popup.address}
                className="w-full h-28 object-cover rounded-t"
              />
            )}
            <div className="p-2">
              <p className="font-serif font-bold text-sm">{popup.priceDisplay}</p>
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
