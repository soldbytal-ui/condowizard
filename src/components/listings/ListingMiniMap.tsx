'use client';

import { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
}

export default function ListingMiniMap({ lat, lng, zoom = 15 }: Props) {
  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom,
  });

  if (!lat || !lng || !MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
        Map unavailable
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      <Marker latitude={lat} longitude={lng} anchor="center">
        <div className="w-4 h-4 rounded-full bg-accent-blue border-2 border-white shadow-lg" />
      </Marker>
    </Map>
  );
}
