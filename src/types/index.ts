// ConstruViz — Core Type Definitions

export interface Project {
    id: string;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    projectType: 'residential' | 'commercial' | 'mixed' | 'industrial' | 'tourism';
    status: 'planning' | 'design' | 'permitting' | 'construction' | 'completed';
    totalArea?: number; // m²
    floors?: number;
    units?: number;
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
}

export interface ProjectDocument {
    id: string;
    projectId: string;
    name: string;
    fileName: string;
    fileType: DocumentFileType;
    fileSize: number; // bytes
    mimeType: string;
    dataUrl?: string; // base64 for localStorage MVP
    category: DocumentCategory;
    uploadedAt: string;
    version: number;
}

export type DocumentFileType = 'pdf' | 'dwg' | 'dxf' | 'ifc' | 'jpg' | 'png' | 'other';

export type DocumentCategory =
    | 'architecture'
    | 'structural'
    | 'mep'
    | 'electrical'
    | 'landscape'
    | 'site_plan'
    | 'render'
    | 'permit'
    | 'other';

export interface MapLayer {
    id: string;
    name: string;
    type: 'buildings' | 'terrain' | 'imagery' | 'project' | 'cadastral' | 'custom';
    visible: boolean;
    opacity: number;
}

export interface MapViewState {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    pitch: number;
}

export interface Measurement {
    id: string;
    type: 'distance' | 'area';
    points: Array<{ lat: number; lng: number }>;
    value: number; // meters or m²
    label: string;
}

// Portuguese cities for quick navigation
export interface CityPreset {
    name: string;
    lat: number;
    lng: number;
    altitude: number;
}
