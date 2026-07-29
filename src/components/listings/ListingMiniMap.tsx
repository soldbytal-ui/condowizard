'use client';

import { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  variant?: 'light' | 'dark';
}

export default function ListingMiniMap({ lat, lng, zoom = 15, variant = 'dark' }: Props) {
  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom,
  });

  const isLight = variant === 'light';
  const fallbackBg = isLight ? 'bg-surface2 text-text-muted' : 'bg-gray-800 text-gray-400';
  const mapStyle = isLight ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';

  if (!lat || !lng || !MAPBOX_TOKEN) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-sm ${fallbackBg}`}>
        Map unavailable
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={mapStyle}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      <Marker latitude={lat} longitude={lng} anchor="center">
        <div className={`w-4 h-4 rounded-full border-2 shadow-lg ${isLight ? 'bg-accent-blue border-white' : 'bg-accent-blue border-white'}`} />
      </Marker>
    </Map>
  );
}
