'use client';

import { useMemo, useState, useCallback } from 'react';
import Map, { Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent } from 'react-map-gl/mapbox';
import { AirbnbBuilding } from '@/data/airbnb-buildings';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props { buildings: AirbnbBuilding[]; }

function pinColor(n: number): string {
  if (n >= 100) return '#EF4444';
  if (n >= 50) return '#F59E0B';
  if (n >= 10) return '#FBBF24';
  return '#0066FF';
}

const CIRCLE_PAINT = {
  'circle-radius': ['interpolate', ['linear'], ['get', 'registrations'], 1, 5, 50, 8, 100, 11, 250, 14],
  'circle-color': ['case',
    ['>=', ['get', 'registrations'], 100], '#EF4444',
    ['>=', ['get', 'registrations'], 50], '#F59E0B',
    ['>=', ['get', 'registrations'], 10], '#FBBF24',
    '#0066FF',
  ],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.9,
};

export default function AirbnbMap({ buildings }: Props) {
  const [popup, setPopup] = useState<AirbnbBuilding | null>(null);

  const geojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: buildings.map(b => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
      properties: {
        slug: b.slug,
        name: b.buildingName || b.address,
        address: b.address,
        registrations: b.registrations,
        ward: b.ward,
        neighbourhood: b.neighbourhood,
      },
    })),
  }), [buildings]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (f?.properties?.slug) {
      const b = buildings.find(x => x.slug === f.properties!.slug);
      if (b) setPopup(b);
    }
  }, [buildings]);

  return (
    <div className="relative">
      <div className="h-[500px] rounded-xl overflow-hidden border border-border">
        <Map
          initialViewState={{ longitude: -79.38, latitude: 43.645, zoom: 12, pitch: 0, bearing: 0 }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          onClick={handleClick}
          interactiveLayerIds={['airbnb-pins']}
          cursor="pointer"
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Source id="airbnb-buildings" type="geojson" data={geojson}>
            <Layer id="airbnb-pins" type="circle" paint={CIRCLE_PAINT as any} />
            <Layer id="airbnb-labels" type="symbol" layout={{
              'text-field': ['get', 'registrations'],
              'text-size': 9,
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Regular'],
              'text-allow-overlap': false,
              'text-optional': true,
            }} paint={{ 'text-color': '#ffffff' }} minzoom={13} />
          </Source>

          {popup && (
            <Popup latitude={popup.lat} longitude={popup.lng} closeButton closeOnClick={false} anchor="bottom" offset={14} onClose={() => setPopup(null)}>
              <div className="min-w-[220px] bg-white rounded-lg overflow-hidden p-3">
                <h3 className="font-semibold text-sm text-gray-900">{popup.buildingName || popup.address}</h3>
                {popup.buildingName && <p className="text-xs text-gray-500">{popup.address}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pinColor(popup.registrations) }} />
                  <span className="text-sm font-bold" style={{ color: pinColor(popup.registrations) }}>{popup.registrations}</span>
                  <span className="text-xs text-gray-500">registrations</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{popup.neighbourhood} · {popup.ward}</p>
                <a href={`/airbnb-friendly/${popup.slug}`} className="block mt-2 text-center text-xs font-medium text-accent-blue hover:underline">View Building &rarr;</a>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 text-xs z-10">
        <p className="font-semibold text-gray-700 mb-1.5">STR Registrations</p>
        {[
          { color: '#EF4444', label: '100+' },
          { color: '#F59E0B', label: '50–99' },
          { color: '#FBBF24', label: '10–49' },
          { color: '#0066FF', label: '1–9' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
