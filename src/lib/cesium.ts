// ConstruViz — Cesium helpers & Portuguese city presets

import { CityPreset, MapViewState } from '@/types';

// Portuguese city presets for quick navigation
export const PORTUGUESE_CITIES: CityPreset[] = [
    { name: 'Lisboa', lat: 38.7223, lng: -9.1393, altitude: 2000 },
    { name: 'Porto', lat: 41.1579, lng: -8.6291, altitude: 2000 },
    { name: 'Faro', lat: 37.0194, lng: -7.9322, altitude: 1500 },
    { name: 'Braga', lat: 41.5518, lng: -8.4229, altitude: 1500 },
    { name: 'Coimbra', lat: 40.2033, lng: -8.4103, altitude: 1500 },
    { name: 'Albufeira', lat: 37.0893, lng: -8.2500, altitude: 1200 },
    { name: 'Funchal', lat: 32.6669, lng: -16.9241, altitude: 2000 },
    { name: 'Cascais', lat: 38.6979, lng: -9.4215, altitude: 1200 },
    { name: 'Setúbal', lat: 38.5244, lng: -8.8882, altitude: 1500 },
    { name: 'Évora', lat: 38.5719, lng: -7.9097, altitude: 1500 },
    { name: 'Aveiro', lat: 40.6405, lng: -8.6538, altitude: 1500 },
    { name: 'Viseu', lat: 40.6566, lng: -7.9125, altitude: 1500 },
];

// Default view state: centered on Portugal
export const DEFAULT_VIEW: MapViewState = {
    latitude: 39.5,
    longitude: -8.0,
    altitude: 500000,
    heading: 0,
    pitch: -60,
};

// Lisbon detail view
export const LISBON_VIEW: MapViewState = {
    latitude: 38.7223,
    longitude: -9.1393,
    altitude: 3000,
    heading: 0,
    pitch: -45,
};

// Default map layers
export const DEFAULT_LAYERS = [
    { id: 'osm-buildings', name: 'OSM 3D Buildings', type: 'buildings' as const, visible: true, opacity: 1 },
    { id: 'terrain', name: 'World Terrain', type: 'terrain' as const, visible: true, opacity: 1 },
    { id: 'imagery', name: 'Satellite Imagery', type: 'imagery' as const, visible: true, opacity: 1 },
];

// Cesium ion asset IDs
export const CESIUM_ASSETS = {
    OSM_BUILDINGS: 96188, // Cesium OSM Buildings
    WORLD_TERRAIN: 1, // Cesium World Terrain
};

// Format coordinates for display
export function formatCoords(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

// Calculate approximate distance between two GPS coordinates (Haversine)
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
