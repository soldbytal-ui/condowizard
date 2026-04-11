'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import Map, { Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS } from '@/types/listing';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const SOLD_PIN_COLOR = '#9CA3AF';

// TRREB board region colours
const REGION_COLORS: Record<string, { fill: string; border: string; label: string }> = {
  Toronto:  { fill: '#3B82F6', border: '#1D4ED8', label: 'Toronto' },
  York:     { fill: '#8B5CF6', border: '#5B21B6', label: 'York Region' },
  Peel:     { fill: '#10B981', border: '#065F46', label: 'Peel (Mississauga/Brampton)' },
  Durham:   { fill: '#F59E0B', border: '#B45309', label: 'Durham' },
  Halton:   { fill: '#EC4899', border: '#9D174D', label: 'Halton' },
  Hamilton: { fill: '#F43F5E', border: '#9F1239', label: 'Hamilton' },
  Simcoe:   { fill: '#6366F1', border: '#3730A3', label: 'Simcoe' },
};

function getRegionColor(area: string) {
  return REGION_COLORS[area] || { fill: '#6B7280', border: '#374151', label: area };
}

interface CommunityBoundary {
  name: string;
  boundary: number[][][];
  lat: number;
  lng: number;
  city?: string;
  regionArea?: string; // The Repliers area field (Toronto, York, Peel, etc.)
  area: number; // polygon area for sort
}

interface SearchMapProps {
  listings: UnifiedListing[];
  highlightedId: string | null;
  onMarkerHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
  isSoldView?: boolean;
  onCommunityClick?: (name: string, displayName: string, city?: string) => void;
  selectedNeighbourhood?: string;
  onPinClick?: (listing: UnifiedListing) => void;
  onCommunitiesLoaded?: (communities: CommunityBoundary[]) => void;
  onMapBackgroundClick?: () => void;
  panelCollapsed?: boolean;
}

// Static paint for hover/selected overlays
const HOVER_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.18 };
const HOVER_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const SELECTED_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.25 };
const SELECTED_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 3, 'line-opacity': 0.9 };
const CIRCLE_PAINT = {
  'circle-radius': 5,
  'circle-color': ['get', 'color'],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.9,
};

function pointInPolygon(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function polygonArea(ring: number[][]): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick, selectedNeighbourhood, onPinClick, onCommunitiesLoaded, onMapBackgroundClick, panelCollapsed }: SearchMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [communityTooltip, setCommunityTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [popupListing, setPopupListing] = useState<UnifiedListing | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // GTA center, flat 2D view
  const [viewState, setViewState] = useState({
    longitude: -79.45, latitude: 43.72, zoom: 9, pitch: 0, bearing: 0,
  });

  // Resize map when panel collapses
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.getMap()?.resize(), 350);
    return () => clearTimeout(t);
  }, [panelCollapsed]);

  // Fetch boundaries once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/repliers/communities');
        if (!res.ok) return;
        const data = await res.json();
        const locs: CommunityBoundary[] = (data.locations || [])
          .filter((c: any) => c.boundary?.[0]?.length >= 3)
          .map((c: any) => ({
            ...c,
            regionArea: c.area, // Repliers area field (Toronto, York, etc.)
            area: polygonArea(c.boundary[0]),
          }))
          .sort((a: CommunityBoundary, b: CommunityBoundary) => a.area - b.area);
        setBoundaries(locs);
        onCommunitiesLoaded?.(locs);
        console.log(`[Map] ${locs.length} communities loaded`);
      } catch (err) {
        console.error('[Map] Failed to load communities:', err);
      }
    })();
  }, []);

  const findCommunityAtPoint = useCallback((lng: number, lat: number): CommunityBoundary | null => {
    const pt: [number, number] = [lng, lat];
    for (const c of boundaries) { if (pointInPolygon(pt, c.boundary[0])) return c; }
    return null;
  }, [boundaries]);

  // Build region-coloured GeoJSON — single source, color per feature
  const boundariesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.map((b, i) => {
      const rc = getRegionColor(b.regionArea || 'Toronto');
      return {
        type: 'Feature' as const, id: i,
        geometry: { type: 'Polygon' as const, coordinates: b.boundary },
        properties: { name: b.name, fillColor: rc.fill, borderColor: rc.border, region: b.regionArea || 'Toronto' },
      };
    }),
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

  const listingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: listings.filter((l) => l.lat && l.lng).map((l) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        color: (isSoldView || l.soldPrice) ? SOLD_PIN_COLOR : l.source === 'precon' ? '#FBBF24' : (BUILDING_TYPE_COLORS[l.buildingType] || '#6B7280'),
        mlsNumber: l.mlsNumber || '', slug: l.slug || '', source: l.source,
      },
    })),
  }), [listings, isSoldView]);

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    onBoundsChange({ ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }, sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng } });
  }, [onBoundsChange]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const pinFeature = e.features?.find((f: any) => f.layer?.id === 'listings-circle');
    if (pinFeature) {
      const id = pinFeature.properties?.id;
      const listing = listings.find((l) => l.id === id);
      if (listing && onPinClick) onPinClick(listing);
      else if (listing) window.open(listing.source === 'mls' ? `/listing/${listing.mlsNumber}` : `/projects/${listing.slug}`, '_blank');
      return;
    }
    const community = findCommunityAtPoint(e.lngLat.lng, e.lngLat.lat);
    if (community) {
      onCommunityClick?.(community.name, community.name, community.city);
      const ring = community.boundary[0];
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of ring) { if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng; if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat; }
      mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
    } else {
      onMapBackgroundClick?.();
    }
  }, [findCommunityAtPoint, onCommunityClick, onMapBackgroundClick, listings, onPinClick]);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const pinFeature = e.features?.find((f: any) => f.layer?.id === 'listings-circle');
    if (pinFeature) {
      const id = pinFeature.properties?.id;
      setPopupListing(listings.find((l) => l.id === id) || null);
      onMarkerHover(id || null);
      setHoveredCommunity(null); setCommunityTooltip(null);
      return;
    }
    const community = findCommunityAtPoint(e.lngLat.lng, e.lngLat.lat);
    if (community) {
      setHoveredCommunity(community.name);
      setCommunityTooltip({ name: community.name, x: e.point.x, y: e.point.y });
      setPopupListing(null); onMarkerHover(null);
    } else {
      setHoveredCommunity(null); setCommunityTooltip(null); setPopupListing(null); onMarkerHover(null);
    }
  }, [findCommunityAtPoint, listings, onMarkerHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCommunity(null); setCommunityTooltip(null); setPopupListing(null); onMarkerHover(null);
  }, [onMarkerHover]);

  const interactiveLayers = useMemo(() => listings.length > 0 ? ['listings-circle'] : undefined, [listings.length]);

  // Region-coloured fill/line paints using data-driven properties
  const regionFillPaint = useMemo(() => ({
    'fill-color': ['get', 'fillColor'],
    'fill-opacity': 0.08,
  }), []);

  const regionLinePaint = useMemo(() => ({
    'line-color': ['get', 'borderColor'],
    'line-width': 1,
    'line-opacity': 0.5,
  }), []);

  // Fly to a region when legend item is clicked
  const flyToRegion = (region: string) => {
    const regionBounds: Record<string, [[number, number], [number, number]]> = {
      Toronto: [[-79.65, 43.58], [-79.10, 43.86]],
      York: [[-79.70, 43.78], [-79.15, 44.10]],
      Peel: [[-79.95, 43.50], [-79.55, 43.85]],
      Durham: [[-79.20, 43.60], [-78.60, 44.10]],
      Halton: [[-80.05, 43.30], [-79.55, 43.60]],
      Hamilton: [[-80.20, 43.15], [-79.70, 43.40]],
      Simcoe: [[-80.00, 44.20], [-79.30, 44.60]],
    };
    const b = regionBounds[region];
    if (b) mapRef.current?.getMap().fitBounds(b, { padding: 40, duration: 1000 });
  };

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={interactiveLayers}
        cursor={(hoveredCommunity || popupListing) ? 'pointer' : 'grab'}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
        maxBounds={[[-80.6, 43.0], [-78.4, 44.8]]}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Region-coloured community boundaries */}
        {boundaries.length > 0 && (
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer id="community-fill" type="fill" paint={regionFillPaint as any} />
            <Layer id="community-border" type="line" paint={regionLinePaint as any} />
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

        {/* Listing pins */}
        <Source id="listings-pins" type="geojson" data={listingsGeoJSON}>
          <Layer id="listings-circle" type="circle" paint={CIRCLE_PAINT as any} />
        </Source>

        {/* Community labels */}
        {boundaries.length > 0 && (
          <Source id="community-labels" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="community-label-text" type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 9, 8, 11, 9, 13, 12, 15, 14],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false, 'text-optional': true, 'text-padding': 4,
              }}
              paint={{ 'text-color': '#475569', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
              minzoom={10}
            />
          </Source>
        )}

        {/* Listing popup */}
        {popupListing && popupListing.lat && popupListing.lng && (
          <Popup latitude={popupListing.lat} longitude={popupListing.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={12}>
            <div className="p-0 min-w-[200px] bg-white rounded-lg shadow-lg overflow-hidden">
              {popupListing.images?.[0] && <img src={popupListing.images[0]} alt={popupListing.address} className="w-full h-28 object-cover" />}
              <div className="p-2">
                <p className="font-serif font-bold text-sm text-gray-900">{isSoldView && popupListing.soldPrice ? `$${popupListing.soldPrice.toLocaleString()} sold` : popupListing.priceDisplay}</p>
                <p className="text-xs text-gray-600 truncate">{popupListing.address}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  {popupListing.beds > 0 && <span>{popupListing.beds} bd</span>}
                  {popupListing.baths > 0 && <span>{popupListing.baths} ba</span>}
                  {popupListing.sqft && <span>{popupListing.sqft} sqft</span>}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Board region legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">TRREB Regions</span>
            <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600 text-xs ml-3">Hide</button>
          </div>
          {Object.entries(REGION_COLORS).map(([key, rc]) => (
            <button key={key} onClick={() => flyToRegion(key)} className="flex items-center gap-2 w-full text-left py-0.5 hover:bg-gray-50 rounded px-1 -mx-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: rc.fill }} />
              <span className="text-gray-600">{rc.label}</span>
            </button>
          ))}
        </div>
      )}
      {!showLegend && (
        <button onClick={() => setShowLegend(true)} className="absolute bottom-4 left-4 z-20 bg-white/90 rounded-lg shadow border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-white">
          Show Legend
        </button>
      )}

      {/* Community tooltip */}
      {communityTooltip && (
        <div className="absolute z-20 pointer-events-none bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap" style={{ left: communityTooltip.x + 12, top: communityTooltip.y - 10 }}>
          {communityTooltip.name}
        </div>
      )}
    </div>
  );
}
