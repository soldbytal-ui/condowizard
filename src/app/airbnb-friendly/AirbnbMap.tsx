'use client';

import { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
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

function pinSize(n: number): number {
  if (n >= 100) return 14;
  if (n >= 50) return 12;
  if (n >= 10) return 10;
  return 8;
}

export default function AirbnbMap({ buildings }: Props) {
  const [popup, setPopup] = useState<AirbnbBuilding | null>(null);

  return (
    <div className="relative">
      <div className="h-[500px] rounded-xl overflow-hidden border border-border">
        <Map
          initialViewState={{ longitude: -79.38, latitude: 43.645, zoom: 12, pitch: 0, bearing: 0 }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {buildings.map((b) => (
            <Marker key={b.slug} latitude={b.lat} longitude={b.lng} anchor="center">
              <div
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={(e) => { e.stopPropagation(); setPopup(b); }}
              >
                <div
                  className="rounded-full border-2 border-white shadow-lg"
                  style={{
                    width: pinSize(b.registrations),
                    height: pinSize(b.registrations),
                    backgroundColor: pinColor(b.registrations),
                  }}
                />
              </div>
            </Marker>
          ))}

          {popup && (
            <Popup
              latitude={popup.lat}
              longitude={popup.lng}
              closeButton
              closeOnClick={false}
              anchor="bottom"
              offset={12}
              onClose={() => setPopup(null)}
            >
              <div className="min-w-[220px] bg-white rounded-lg overflow-hidden p-3">
                <h3 className="font-semibold text-sm text-gray-900">{popup.buildingName || popup.address}</h3>
                {popup.buildingName && <p className="text-xs text-gray-500">{popup.address}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pinColor(popup.registrations) }} />
                  <span className="text-sm font-bold" style={{ color: pinColor(popup.registrations) }}>{popup.registrations}</span>
                  <span className="text-xs text-gray-500">registrations</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{popup.neighbourhood} · {popup.ward}</p>
                <a href={`/airbnb-friendly/${popup.slug}`} className="block mt-2 text-center text-xs font-medium text-accent-blue hover:underline">
                  View Building &rarr;
                </a>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 text-xs z-10">
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
