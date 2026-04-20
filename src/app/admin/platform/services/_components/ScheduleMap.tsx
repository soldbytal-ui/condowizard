'use client';

import { useEffect, useRef, useState } from 'react';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  time: string;
  status: 'completed' | 'in_progress' | 'next' | 'scheduled' | 'emergency' | 'vip' | 'closing' | 'hesitant';
  color: string;
  details?: string;
}

export interface MapRoute {
  techId: string;
  path: [number, number][]; // [lng, lat]
  color: string;
}

interface Props {
  pins: MapPin[];
  routes?: MapRoute[];
  mapStyle?: string;
  center?: [number, number];
  zoom?: number;
  height?: number;
  onPinClick?: (pin: MapPin) => void;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#16A34A',
  in_progress: '#E8450C',
  next: '#EAB308',
  scheduled: '#8B8FA3',
  emergency: '#EF4444',
  vip: '#D4A017',
  closing: '#16A34A',
  hesitant: '#8B8FA3',
};

export default function ScheduleMap({
  pins, routes = [], mapStyle = 'mapbox://styles/mapbox/dark-v11',
  center = [-79.3832, 43.6532], zoom = 10, height = 440, onPinClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) { setNoToken(true); return; }

    let map: unknown;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      (mapboxgl as unknown as { accessToken: string }).accessToken = token;

      const m = new mapboxgl.Map({
        container: containerRef.current!,
        style: mapStyle,
        center,
        zoom,
        attributionControl: false,
      });
      map = m;
      mapRef.current = m;

      m.on('load', () => {
        // Add pins
        pins.forEach((pin, i) => {
          const color = pin.color || STATUS_COLORS[pin.status] || '#8B8FA3';

          const el = document.createElement('div');
          el.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;cursor:pointer;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 8px rgba(0,0,0,0.4);`;
          el.textContent = String(i + 1);

          if (onPinClick) {
            el.addEventListener('click', () => onPinClick(pin));
          }

          new mapboxgl.Marker({ element: el })
            .setLngLat([pin.lng, pin.lat])
            .addTo(m);
        });

        // Add routes
        routes.forEach((route, i) => {
          if (route.path.length < 2) return;
          const srcId = `route-${i}`;
          m.addSource(srcId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: route.path },
            },
          });
          m.addLayer({
            id: `route-line-${i}`,
            type: 'line',
            source: srcId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': route.color || '#E8450C',
              'line-width': 2,
              'line-dasharray': [3, 3],
              'line-opacity': 0.6,
            },
          });
        });
      });
    })();

    return () => {
      if (map && typeof (map as { remove: () => void }).remove === 'function') {
        (map as { remove: () => void }).remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (noToken) {
    return (
      <div style={{ height, background: '#1a1a2e', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B8FA3', fontSize: 13 }}>
        Map requires NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
