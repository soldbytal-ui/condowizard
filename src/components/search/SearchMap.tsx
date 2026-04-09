'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
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
  selectedNeighbourhood?: string;
}

// Static paint — never changes, never causes layer re-creation
const BASE_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.05 };
const BASE_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 1.5, 'line-opacity': 0.35 };
const HOVER_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.18 };
const HOVER_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const SELECTED_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.25 };
const SELECTED_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 3, 'line-opacity': 0.9 };

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick, selectedNeighbourhood }: SearchMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [communityTooltip, setCommunityTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const communityClickRef = useRef(onCommunityClick);
  communityClickRef.current = onCommunityClick;

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6832, zoom: 11.5, pitch: 40, bearing: -10,
  });

  // Fetch boundaries once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/repliers/communities');
        if (!res.ok) return;
        const data = await res.json();
        const locs: CommunityBoundary[] = (data.locations || []).filter(
          (c: any) => c.boundary?.[0]?.length >= 3
        );
        setBoundaries(locs);
        console.log(`[Map] ${locs.length} communities loaded`);
      } catch (err) {
        console.error('[Map] Failed to load communities:', err);
      }
    })();
  }, []);

  // Register native Mapbox GL click/hover handlers on the fill layer.
  // This works UNDER the HTML marker overlays — Mapbox GL canvas events
  // aren't blocked by Marker HTML elements because we query at the GL level.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || boundaries.length === 0) return;

    // Wait for style to be loaded
    const setup = () => {
      // Click handler on fill layer
      const onClick = (e: any) => {
        const name = e.features?.[0]?.properties?.name;
        if (!name) return;
        console.log(`[Map] Native GL click on: ${name}`);
        communityClickRef.current?.(name, name);

        // Zoom to bbox
        const coords = e.features[0].geometry?.coordinates?.[0];
        if (coords) {
          let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
          for (const [lng, lat] of coords) {
            if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          }
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
        }
      };

      // Hover handler
      const onMove = (e: any) => {
        const name = e.features?.[0]?.properties?.name;
        if (name) {
          map.getCanvas().style.cursor = 'pointer';
          setHoveredCommunity(name);
          setCommunityTooltip({ name, x: e.point.x, y: e.point.y });
        }
      };

      const onLeave = () => {
        map.getCanvas().style.cursor = '';
        setHoveredCommunity(null);
        setCommunityTooltip(null);
      };

      // Wait for the layer to exist
      const tryRegister = () => {
        if (map.getLayer('community-fill')) {
          map.on('click', 'community-fill', onClick);
          map.on('mousemove', 'community-fill', onMove);
          map.on('mouseleave', 'community-fill', onLeave);
          console.log('[Map] Native GL event handlers registered on community-fill');
        } else {
          // Layer not ready yet — retry
          setTimeout(tryRegister, 500);
        }
      };

      tryRegister();

      return () => {
        try {
          map.off('click', 'community-fill', onClick);
          map.off('mousemove', 'community-fill', onMove);
          map.off('mouseleave', 'community-fill', onLeave);
        } catch {}
      };
    };

    if (map.isStyleLoaded()) {
      const cleanup = setup();
      return cleanup;
    } else {
      let cleanup: (() => void) | undefined;
      const onLoad = () => { cleanup = setup(); };
      map.on('style.load', onLoad);
      return () => {
        map.off('style.load', onLoad);
        cleanup?.();
      };
    }
  }, [boundaries.length]);

  // Stable GeoJSON sources
  const boundariesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.map((b, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: { type: 'Polygon' as const, coordinates: b.boundary },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  const labelsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.filter((b) => b.lat && b.lng).map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  const hoverGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!hoveredCommunity) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === hoveredCommunity);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }] };
  }, [hoveredCommunity, boundaries]);

  const selectedGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!selectedNeighbourhood) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === selectedNeighbourhood);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }] };
  }, [selectedNeighbourhood, boundaries]);

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
    <div className="relative w-full h-full">
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
        maxBounds={[[-80.2, 43.2], [-78.6, 44.4]]}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Base community polygons — always rendered, native GL click handler */}
        {boundaries.length > 0 && (
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer id="community-fill" type="fill" paint={BASE_FILL_PAINT} />
            <Layer id="community-border" type="line" paint={BASE_LINE_PAINT} />
          </Source>
        )}

        {/* Hover overlay */}
        <Source id="community-hover" type="geojson" data={hoverGeoJSON}>
          <Layer id="community-hover-fill" type="fill" paint={HOVER_FILL_PAINT} />
          <Layer id="community-hover-line" type="line" paint={HOVER_LINE_PAINT} />
        </Source>

        {/* Selected overlay */}
        <Source id="community-selected" type="geojson" data={selectedGeoJSON}>
          <Layer id="community-selected-fill" type="fill" paint={SELECTED_FILL_PAINT} />
          <Layer id="community-selected-line" type="line" paint={SELECTED_LINE_PAINT} />
        </Source>

        {/* Community labels */}
        {boundaries.length > 0 && (
          <Source id="community-labels" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="community-label-text" type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 13, 12, 15, 14],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false, 'text-optional': true, 'text-padding': 4,
              }}
              paint={{ 'text-color': 'rgba(100,160,255,0.7)', 'text-halo-color': 'rgba(0,0,0,0.9)', 'text-halo-width': 1.5 }}
              minzoom={11}
            />
          </Source>
        )}

        {/* Listing pins */}
        {listings.map((listing) => {
          if (!listing.lat || !listing.lng) return null;
          const isHighlighted = listing.id === highlightedId;
          const color = isSoldView || listing.soldPrice ? SOLD_PIN_COLOR
            : listing.source === 'precon' ? '#FBBF24'
            : (BUILDING_TYPE_COLORS[listing.buildingType] || '#6B7280');

          return (
            <Marker key={listing.id} latitude={listing.lat} longitude={listing.lng} anchor="center">
              <div
                className="cursor-pointer transition-transform"
                style={{ transform: isHighlighted ? 'scale(1.8)' : 'scale(1)' }}
                onMouseEnter={() => { onMarkerHover(listing.id); setPopup(listing); }}
                onMouseLeave={() => { onMarkerHover(null); setPopup(null); }}
                onClick={() => { window.open(listing.source === 'mls' ? `/listing/${listing.mlsNumber}` : `/projects/${listing.slug}`, '_blank'); }}
              >
                <div className="w-3 h-3 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: color }} />
              </div>
            </Marker>
          );
        })}

        {/* Listing popup */}
        {popup && popup.lat && popup.lng && (
          <Popup latitude={popup.lat} longitude={popup.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={12} className="search-map-popup">
            <div className="p-0 min-w-[200px]">
              {popup.images?.[0] && <img src={popup.images[0]} alt={popup.address} className="w-full h-28 object-cover rounded-t" />}
              <div className="p-2">
                <p className="font-serif font-bold text-sm">{isSoldView && popup.soldPrice ? `$${popup.soldPrice.toLocaleString()} sold` : popup.priceDisplay}</p>
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

      {/* Tooltip */}
      {communityTooltip && (
        <div className="absolute z-20 pointer-events-none bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap" style={{ left: communityTooltip.x + 12, top: communityTooltip.y - 10 }}>
          {communityTooltip.name}
        </div>
      )}
    </div>
  );
}
