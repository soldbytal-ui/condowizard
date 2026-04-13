'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Map, { Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  listings: UnifiedListing[];
  boundary: number[][][] | null; // polygon coordinates from Repliers
  neighbourhoodName: string;
}

const FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.12 };
const LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const CIRCLE_PAINT = {
  'circle-radius': 6,
  'circle-color': ['get', 'color'],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.9,
};

export default function ResaleMiniMap({ listings, boundary, neighbourhoodName }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);

  // Fit to boundary on load
  useEffect(() => {
    if (!mapRef.current || !boundary?.[0]?.length) return;
    const ring = boundary[0];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }
    setTimeout(() => {
      mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 40, duration: 0 });
    }, 100);
  }, [boundary]);

  const boundaryGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!boundary) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: boundary }, properties: { name: neighbourhoodName } }],
    };
  }, [boundary, neighbourhoodName]);

  const pinsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: listings.filter(l => l.lat && l.lng).map(l => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id, mlsNumber: l.mlsNumber || '',
        color: BUILDING_TYPE_COLORS[l.buildingType] || '#6B7280',
      },
    })),
  }), [listings]);

  const handleClick = useCallback((e: any) => {
    const feature = e.features?.[0];
    if (feature?.properties?.id) {
      const listing = listings.find(l => l.id === feature.properties.id);
      setPopup(listing || null);
    }
  }, [listings]);

  return (
    <div className="h-72 md:h-96 rounded-xl overflow-hidden border border-border">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -79.38, latitude: 43.65, zoom: 13, pitch: 0, bearing: 0 }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onClick={handleClick}
        interactiveLayerIds={['resale-pins']}
        cursor="pointer"
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Boundary highlight */}
        <Source id="hood-boundary" type="geojson" data={boundaryGeoJSON}>
          <Layer id="hood-fill" type="fill" paint={FILL_PAINT} />
          <Layer id="hood-border" type="line" paint={LINE_PAINT} />
        </Source>

        {/* Listing pins */}
        <Source id="resale-pins-src" type="geojson" data={pinsGeoJSON}>
          <Layer id="resale-pins" type="circle" paint={CIRCLE_PAINT as any} />
        </Source>

        {/* Popup */}
        {popup && popup.lat && popup.lng && (
          <Popup latitude={popup.lat} longitude={popup.lng} closeButton closeOnClick={false} anchor="bottom" offset={12} onClose={() => setPopup(null)}>
            <div className="min-w-[220px] bg-white rounded-lg overflow-hidden">
              {popup.images?.[0] && <img src={popup.images[0]} alt={popup.address} className="w-full h-28 object-cover" />}
              <div className="p-2">
                <p className="font-serif font-bold text-sm text-gray-900">{popup.priceDisplay}</p>
                <p className="text-xs text-gray-600 truncate">{popup.address}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  {popup.beds > 0 && <span>{popup.beds} bd</span>}
                  {popup.baths > 0 && <span>{popup.baths} ba</span>}
                  {popup.sqft && <span>{popup.sqft} sqft</span>}
                </div>
                <a href={`/listing/${popup.mlsNumber}`} className="block mt-2 text-center text-xs font-medium text-accent-blue hover:underline">View Full Listing &rarr;</a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
