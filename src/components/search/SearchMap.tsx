'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent } from 'react-map-gl/mapbox';
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

// Static paint objects — NEVER recreated, so Mapbox never removes/re-adds layers
const BASE_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.03 };
const BASE_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 1.5, 'line-opacity': 0.35 };
const HOVER_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.15 };
const HOVER_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const SELECTED_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.22 };
const SELECTED_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 3, 'line-opacity': 0.85 };

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick, selectedNeighbourhood }: SearchMapProps) {
  const mapRef = useRef<any>(null);
  const [popup, setPopup] = useState<UnifiedListing | null>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [communityTooltip, setCommunityTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6832, zoom: 11.5, pitch: 40, bearing: -10,
  });

  // Fetch community boundaries ONCE
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
        console.log(`[Map] ${locs.length} communities with valid boundaries loaded`);
      } catch (err) {
        console.error('[Map] Failed to load communities:', err);
      }
    })();
  }, []);

  // Main GeoJSON — stable reference, only changes when boundaries load (once)
  const boundariesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.map((b, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: { type: 'Polygon' as const, coordinates: b.boundary },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  // Labels GeoJSON
  const labelsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.filter((b) => b.lat && b.lng).map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  // Hover highlight — separate GeoJSON with just the hovered polygon
  const hoverGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!hoveredCommunity) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === hoveredCommunity);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }],
    };
  }, [hoveredCommunity, boundaries]);

  // Selected highlight — separate GeoJSON with just the selected polygon
  const selectedGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!selectedNeighbourhood) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === selectedNeighbourhood);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }],
    };
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

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature?.properties?.name) return;
    const name = feature.properties.name;
    console.log(`[Map] Polygon clicked: ${name}`);
    onCommunityClick?.(name, name);

    // Zoom to bbox
    if (feature.geometry.type === 'Polygon') {
      const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      }
      mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
    }
  }, [onCommunityClick]);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature?.properties?.name) {
      setHoveredCommunity(feature.properties.name);
      setCommunityTooltip({ name: feature.properties.name, x: e.point.x, y: e.point.y });
    } else {
      setHoveredCommunity(null);
      setCommunityTooltip(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCommunity(null);
    setCommunityTooltip(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={boundaries.length > 0 ? ['community-fill'] : undefined}
        cursor={hoveredCommunity ? 'pointer' : 'grab'}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
        maxBounds={[[-80.2, 43.2], [-78.6, 44.4]]}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* BASE community layer — STATIC paint, never recreated */}
        {boundaries.length > 0 && (
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer id="community-fill" type="fill" paint={BASE_FILL_PAINT} />
            <Layer id="community-border" type="line" paint={BASE_LINE_PAINT} />
          </Source>
        )}

        {/* HOVER highlight — separate source/layer, only contains the hovered polygon */}
        <Source id="community-hover" type="geojson" data={hoverGeoJSON}>
          <Layer id="community-hover-fill" type="fill" paint={HOVER_FILL_PAINT} />
          <Layer id="community-hover-line" type="line" paint={HOVER_LINE_PAINT} />
        </Source>

        {/* SELECTED highlight — separate source/layer */}
        <Source id="community-selected" type="geojson" data={selectedGeoJSON}>
          <Layer id="community-selected-fill" type="fill" paint={SELECTED_FILL_PAINT} />
          <Layer id="community-selected-line" type="line" paint={SELECTED_LINE_PAINT} />
        </Source>

        {/* Community labels */}
        {boundaries.length > 0 && (
          <Source id="community-labels" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="community-label-text"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 13, 12, 15, 14],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false,
                'text-optional': true,
                'text-padding': 4,
              }}
              paint={{
                'text-color': 'rgba(100,160,255,0.7)',
                'text-halo-color': 'rgba(0,0,0,0.9)',
                'text-halo-width': 1.5,
              }}
              minzoom={11}
            />
          </Source>
        )}

        {/* Listing pins */}
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
                onClick={(e) => { e.stopPropagation(); window.open(listing.source === 'mls' ? `/listing/${listing.mlsNumber}` : `/projects/${listing.slug}`, '_blank'); }}
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

      {communityTooltip && (
        <div className="absolute z-20 pointer-events-none bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap" style={{ left: communityTooltip.x + 12, top: communityTooltip.y - 10 }}>
          {communityTooltip.name}
        </div>
      )}
    </div>
  );
}
