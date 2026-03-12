'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Search,
    MapPin,
    Layers,
    Plus,
    Minus,
    Home,
    Building2,
    LayoutDashboard,
    X,
    UploadCloud,
    MousePointerClick,
    Trash2,
    Wand2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    DollarSign,
    FileCheck,
    Clock,
    Ruler,
    Eye,
    EyeOff,
    Landmark,
    ShoppingBag,
    ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import { PORTUGUESE_CITIES, DEFAULT_LAYERS, CESIUM_ASSETS, formatCoords, LISBON_VIEW } from '@/lib/cesium';
import { MapLayer } from '@/types';
import { ConstraintCheckRequest, ConstraintCheckResult } from '@/lib/legislation/types';
import { isMobileDevice, getMobileViewerOptions, configureMobileScene, handleCesiumLoadError } from '@/lib/mobile-cesium-fix';
import '@/styles/map.css';

let Cesium: any = null;

/* ---- Sample Data ---- */
const SAMPLE_LOTS = [
    { id: 1, lat: 38.7169, lng: -9.1399, price: 320000, area: 450, label: 'Lot A - Baixa' },
    { id: 2, lat: 38.7210, lng: -9.1350, price: 185000, area: 280, label: 'Lot B - Alfama' },
    { id: 3, lat: 38.7250, lng: -9.1500, price: 540000, area: 720, label: 'Lot C - Principe Real' },
    { id: 4, lat: 38.7130, lng: -9.1450, price: 420000, area: 380, label: 'Lot D - Santos' },
    { id: 5, lat: 38.7290, lng: -9.1420, price: 275000, area: 310, label: 'Lot E - Graca' },
];

const BUILDING_PRESETS = [
    { id: 'residential', label: 'Residential', floors: 4, footprint: 200, color: '#10b981' },
    { id: 'commercial', label: 'Commercial', floors: 6, footprint: 350, color: '#3b82f6' },
    { id: 'mixed', label: 'Mixed Use', floors: 8, footprint: 300, color: '#8b5cf6' },
    { id: 'bridge', label: 'Bridge / Infrastructure', floors: 1, footprint: 500, color: '#f59e0b' },
];

const PERMIT_DOCS = [
    { name: 'Architectural Project (Projeto de Arquitectura)', required: true },
    { name: 'Structural Stability (Estabilidade)', required: true },
    { name: 'Water & Sewage (Redes de Agua)', required: true },
    { name: 'Electrical Installation (ITED)', required: true },
    { name: 'Thermal Regulation (SCE)', required: true },
    { name: 'Gas Installation (if applicable)', required: false },
    { name: 'Fire Safety (SCIE)', required: true },
    { name: 'Topographic Survey (Levantamento)', required: true },
];

const ARCH_LAYERS = [
    { id: 'roof', label: 'Roof', color: '#8b5cf6' },
    { id: 'upper', label: 'Upper Floors', color: '#3b82f6' },
    { id: 'mid', label: 'Mid Floors', color: '#06b6d4' },
    { id: 'ground', label: 'Ground Floor', color: '#10b981' },
    { id: 'foundation', label: 'Foundation', color: '#64748b' },
];

export default function MapPage() {
    const [mounted, setMounted] = useState(false);
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // Search & Geocoding
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Map State
    const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_LAYERS);
    const [layerPanelOpen, setLayerPanelOpen] = useState(false);
    const [activeCity, setActiveCity] = useState<string>('Lisboa');
    const [cursorCoords, setCursorCoords] = useState<string>('');
    const buildingsTilesetRef = useRef<any>(null);

    // Floor Plan Projection State
    const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
    const [isPlacing, setIsPlacing] = useState(false);
    const [placedEntityId, setPlacedEntityId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Building Simulator State
    const [buildSimOpen, setBuildSimOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(BUILDING_PRESETS[0]);
    const [buildFloors, setBuildFloors] = useState(4);
    const [buildPlacing, setBuildPlacing] = useState(false);
    const [placedBuildings, setPlacedBuildings] = useState<string[]>([]);

    // Lots State
    const [lotsVisible, setLotsVisible] = useState(false);
    const [selectedLot, setSelectedLot] = useState<typeof SAMPLE_LOTS[0] | null>(null);
    const lotEntitiesRef = useRef<any[]>([]);

    // Permit Panel
    const [permitPanelOpen, setPermitPanelOpen] = useState(false);

    // Architectural Layers
    const [archLayersOpen, setArchLayersOpen] = useState(false);
    const [archLayerVisibility, setArchLayerVisibility] = useState<Record<string, boolean>>({
        roof: true, upper: true, mid: true, ground: true, foundation: true,
    });

    // AI & Legislation State
    const [selectedPropertyCoords, setSelectedPropertyCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('');
    const [constraintsLoading, setConstraintsLoading] = useState(false);
    const [constraintsResult, setConstraintsResult] = useState<ConstraintCheckResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{ imageUrl: string, promptUsed: string } | null>(null);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const pinEntityRef = useRef<any>(null);

    // Refs for event handlers
    const isPlacingRef = useRef(isPlacing);
    const floorPlanImageRef = useRef(floorPlanImage);
    const buildPlacingRef = useRef(buildPlacing);
    const selectedPresetRef = useRef(selectedPreset);
    const buildFloorsRef = useRef(buildFloors);

    useEffect(() => {
        isPlacingRef.current = isPlacing;
        floorPlanImageRef.current = floorPlanImage;
        buildPlacingRef.current = buildPlacing;
        selectedPresetRef.current = selectedPreset;
        buildFloorsRef.current = buildFloors;
    }, [isPlacing, floorPlanImage, buildPlacing, selectedPreset, buildFloors]);

    // Initialize Cesium
    useEffect(() => {
        let mounted = true;

        async function initCesium() {
            try {
                const CesiumModule = await import('cesium');
                Cesium = CesiumModule;
                (window as any).CESIUM_BASE_URL = '/cesium';
                
                const token = (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '').trim();
                if (!token) {
                    throw new Error('Cesium Ion token is not configured');
                }
                Cesium.Ion.defaultAccessToken = token;

                if (!mounted || !containerRef.current) return;

                const mobileOptions = getMobileViewerOptions(Cesium);
                const viewer = new Cesium.Viewer(containerRef.current, {
                    terrain: Cesium.Terrain.fromWorldTerrain(),
                    baseLayerPicker: false,
                    geocoder: false,
                    homeButton: false,
                    sceneModePicker: false,
                    selectionIndicator: false,
                    navigationHelpButton: false,
                    animation: false,
                    timeline: false,
                    fullscreenButton: false,
                    infoBox: false,
                    creditContainer: document.createElement('div'),
                    skyAtmosphere: !isMobileDevice(),
                    skyBox: !isMobileDevice(),
                    ...mobileOptions
                });

                viewerRef.current = viewer;

                // Apply mobile-specific configurations
                configureMobileScene(viewer, Cesium);

                // Only apply high-quality settings on desktop
                if (!isMobileDevice()) {
                    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#060a14');
                    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0c1222');
                    viewer.scene.globe.showWaterEffect = true;
                    viewer.scene.highDynamicRange = true;
                    viewer.scene.globe.enableLighting = true;
                    viewer.scene.globe.depthTestAgainstTerrain = true;

                    viewer.scene.fog.enabled = true;
                    viewer.scene.fog.density = 0.0003;
                    viewer.scene.fog.screenSpaceErrorFactor = 2.0;

                    if (Cesium.PostProcessStageLibrary.isAmbientOcclusionSupported(viewer.scene)) {
                        const ao = viewer.scene.postProcessStages.ambientOcclusion;
                        ao.enabled = true;
                        ao.uniforms.intensity = 3.0;
                        ao.uniforms.lengthCap = 0.25;
                        ao.uniforms.stepSize = 1.5;
                        ao.uniforms.bias = 0.05;
                    }
                }

                try {
                    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(CESIUM_ASSETS.OSM_BUILDINGS);
                    tileset.style = new Cesium.Cesium3DTileStyle({
                        color: "color('#A1A1AA', 0.9)",
                        show: true
                    });
                    viewer.scene.primitives.add(tileset);
                    buildingsTilesetRef.current = tileset;
                } catch (e) {
                    console.warn('Could not load OSM buildings:', e);
                }

                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                        LISBON_VIEW.longitude,
                        LISBON_VIEW.latitude,
                        LISBON_VIEW.altitude * 0.4
                    ),
                    orientation: {
                        heading: Cesium.Math.toRadians(45),
                        pitch: Cesium.Math.toRadians(-30),
                        roll: 0,
                    },
                    duration: 0,
                });

                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((movement: any) => {
                    const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
                    if (cartesian) {
                        const carto = Cesium.Cartographic.fromCartesian(cartesian);
                        const lat = Cesium.Math.toDegrees(carto.latitude);
                        const lng = Cesium.Math.toDegrees(carto.longitude);
                        setCursorCoords(formatCoords(lat, lng));
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                handler.setInputAction((click: any) => {
                    const ray = viewer.camera.getPickRay(click.position);
                    const position = viewer.scene.globe.pick(ray, viewer.scene);
                    if (!position) return;

                    const cartographic = Cesium.Cartographic.fromCartesian(position);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);

                    if (buildPlacingRef.current) {
                        // Place a mockup building
                        const preset = selectedPresetRef.current;
                        const floors = buildFloorsRef.current;
                        const height = floors * 3.5;
                        const w = Math.sqrt(preset.footprint);
                        const entity = viewer.entities.add({
                            position: Cesium.Cartesian3.fromDegrees(lon, lat, cartographic.height + height / 2),
                            box: {
                                dimensions: new Cesium.Cartesian3(w, w, height),
                                material: Cesium.Color.fromCssColorString(preset.color).withAlpha(0.7),
                                outline: true,
                                outlineColor: Cesium.Color.fromCssColorString(preset.color),
                            },
                            label: {
                                text: `${preset.label}\n${floors}F / ${Math.round(preset.footprint * floors)} m\u00B2`,
                                font: '12px Outfit, sans-serif',
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                outlineWidth: 2,
                                outlineColor: Cesium.Color.BLACK,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                pixelOffset: new Cesium.Cartesian2(0, -(height * 2 + 20)),
                                heightReference: Cesium.HeightReference.NONE,
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            }
                        });
                        setPlacedBuildings(prev => [...prev, entity.id]);
                        setBuildPlacing(false);
                    } else if (isPlacingRef.current && floorPlanImageRef.current) {
                        const entity = viewer.entities.add({
                            position: Cesium.Cartesian3.fromDegrees(lon, lat, cartographic.height + 7.5),
                            box: {
                                dimensions: new Cesium.Cartesian3(20.0, 30.0, 15.0),
                                material: new Cesium.ImageMaterialProperty({
                                    image: floorPlanImageRef.current,
                                    transparent: true
                                }),
                                outline: true,
                                outlineColor: Cesium.Color.CYAN
                            }
                        });
                        setPlacedEntityId(entity.id);
                        setIsPlacing(false);
                    } else {
                        placePropertyPin(lat, lon);
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                if (mounted) setLoading(false);
            } catch (err: any) {
                console.error('Cesium init error:', err);
                if (mounted) {
                    setError(handleCesiumLoadError(err));
                    setError(err.message || 'Failed to initialize 3D viewer');
                    setLoading(false);
                }
            }
        }

        initCesium();

        return () => {
            mounted = false;
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                viewerRef.current.destroy();
            }
        };
    }, []);

    const flyToCity = useCallback((cityName: string) => {
        const city = PORTUGUESE_CITIES.find((c) => c.name === cityName);
        if (!city || !viewerRef.current || !Cesium) return;
        setActiveCity(cityName);
        viewerRef.current.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(city.lng, city.lat, city.altitude),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
            duration: 1.5,
        });
    }, []);

    const toggleLayer = useCallback((layerId: string) => {
        setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
        const viewer = viewerRef.current;
        if (!viewer || !Cesium) return;
        if (layerId === 'osm-buildings' && buildingsTilesetRef.current) {
            buildingsTilesetRef.current.show = !buildingsTilesetRef.current.show;
        }
        if (layerId === 'terrain') {
            const layer = layers.find((l) => l.id === layerId);
            if (layer) viewer.scene.globe.show = !layer.visible;
        }
    }, [layers]);

    const zoomIn = () => { if (viewerRef.current) viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.3); };
    const zoomOut = () => { if (viewerRef.current) viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.5); };
    const resetView = () => flyToCity('Lisboa');

    // Geocoding
    useEffect(() => {
        if (!searchQuery) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=pt&format=json&limit=5`;
                const res = await axios.get(url);
                setSearchResults(res.data);
            } catch (err) { console.error("Geocoding failed", err); }
            finally { setIsSearching(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const placePropertyPin = (lat: number, lon: number, address?: string) => {
        if (!viewerRef.current || !Cesium) return;
        const viewer = viewerRef.current;
        if (pinEntityRef.current) viewer.entities.remove(pinEntityRef.current);

        pinEntityRef.current = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: {
                image: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 1.0,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: address ? address.split(',')[0] : 'Selected Property',
                font: '13px Outfit, sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 3,
                outlineColor: Cesium.Color.BLACK,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -52),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        setSelectedPropertyCoords({ lat, lng: lon });
        setUserPrompt('');
        setConstraintsResult(null);
        setAiResult(null);
        setAiPanelOpen(true);

        if (address) {
            setSelectedAddress(address);
        } else {
            setSelectedAddress(`${lat.toFixed(4)}\u00B0N, ${Math.abs(lon).toFixed(4)}\u00B0W`);
            axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
                .then(res => {
                    if (res.data?.display_name) {
                        setSelectedAddress(res.data.display_name);
                        if (pinEntityRef.current) pinEntityRef.current.label.text = res.data.display_name.split(',')[0];
                    }
                })
                .catch(() => { });
        }

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 250),
            orientation: { heading: viewer.camera.heading || Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
            duration: 1.5,
        });
    };

    const handleSelectAddress = (result: any) => {
        setSearchQuery(result.display_name);
        setSearchOpen(false);
        if (!viewerRef.current || !Cesium) return;
        placePropertyPin(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setFloorPlanImage(event.target?.result as string);
            setIsPlacing(true);
        };
        reader.readAsDataURL(file);
    };

    const clearPlacement = () => {
        if (placedEntityId && viewerRef.current) viewerRef.current.entities.removeById(placedEntityId);
        setPlacedEntityId(null);
        setFloorPlanImage(null);
        setIsPlacing(false);
    };

    const clearAllBuildings = () => {
        if (!viewerRef.current) return;
        placedBuildings.forEach(id => viewerRef.current.entities.removeById(id));
        setPlacedBuildings([]);
    };

    // Toggle lots visibility
    const toggleLots = () => {
        if (!viewerRef.current || !Cesium) return;
        const viewer = viewerRef.current;

        if (lotsVisible) {
            lotEntitiesRef.current.forEach(e => viewer.entities.remove(e));
            lotEntitiesRef.current = [];
            setLotsVisible(false);
            setSelectedLot(null);
        } else {
            SAMPLE_LOTS.forEach(lot => {
                const entity = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(lot.lng, lot.lat),
                    billboard: {
                        image: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#f59e0b" stroke="#fff" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">\u20AC</text></svg>`),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        scale: 1.2,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                    label: {
                        text: `\u20AC${(lot.price / 1000).toFixed(0)}k`,
                        font: '11px Outfit, sans-serif',
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        outlineColor: Cesium.Color.BLACK,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -40),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        fillColor: Cesium.Color.fromCssColorString('#fbbf24'),
                    }
                });
                lotEntitiesRef.current.push(entity);
            });
            setLotsVisible(true);
        }
    };

    const fetchConstraints = async (isMaximizeYield: boolean = false) => {
        if (!selectedPropertyCoords) return;
        if (!isMaximizeYield && !userPrompt.trim()) return;
        setConstraintsLoading(true);
        setConstraintsResult(null);
        setAiResult(null);
        try {
            const req: ConstraintCheckRequest = { lat: selectedPropertyCoords.lat, lng: selectedPropertyCoords.lng, prompt: userPrompt, isMaximizeYield };
            const res = await axios.post('/api/check-permits', req);
            if (res.data.success) setConstraintsResult(res.data.data);
        } catch (error) { console.error('Failed to fetch constraints', error); }
        finally { setConstraintsLoading(false); }
    };

    const handleGenerateAI = async () => {
        if (!constraintsResult || !userPrompt.trim()) return;
        setAiLoading(true);
        try {
            const res = await axios.post('/api/generate-design', {
                municipality: constraintsResult.municipality,
                zone: constraintsResult.zone,
                prompt: userPrompt,
                intent: constraintsResult.parsedIntent,
                allowedModifications: constraintsResult.allowedModifications,
                feasibilityMath: constraintsResult.feasibilityMath
            });
            if (res.data.success) setAiResult({ imageUrl: res.data.imageUrl, promptUsed: res.data.promptUsed });
        } catch (error) { console.error('Failed to generate AI design', error); }
        finally { setAiLoading(false); }
    };

    if (!mounted || loading) {
        return (
            <div className="map-page" id="map-page" style={{ background: '#060a14', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>Initializing ConstruViz...</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>
                        {typeof window !== 'undefined' && isMobileDevice() ? 'Optimizing for mobile...' : 'Loading 3D map viewer...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="map-page" id="map-page" style={{ background: '#060a14', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
                <div style={{ textAlign: 'center', padding: '32px', maxWidth: '500px' }}>
                    <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
                    <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '12px' }}>Map Load Error</h2>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>{error}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                        >
                            Retry
                        </button>
                        <Link 
                            href="/dashboard" 
                            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="map-page" id="map-page">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, application/pdf" onChange={handleFileUpload} />
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading overlay */}
            {loading && (
                <div className="map-loading">
                    <div className="spinner" style={{ width: 40, height: 40 }} />
                    <div className="map-loading-text">{error ? error : 'Loading 3D Map Engine...'}</div>
                    {error && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', maxWidth: 400, textAlign: 'center', marginTop: 'var(--space-2)' }}>
                            Make sure you have a valid Cesium ion token in your .env.local file.
                        </p>
                    )}
                </div>
            )}

            {/* Placement Mode Overlays */}
            {(isPlacing || buildPlacing) && (
                <div className="placement-banner">
                    <MousePointerClick size={18} />
                    {buildPlacing
                        ? `Click on map to place ${selectedPreset.label} (${buildFloors} floors)`
                        : 'Click anywhere on the map to place your property'
                    }
                </div>
            )}

            {/* ---- Top Bar ---- */}
            <div className="map-topbar">
                <Link href="/" className="map-logo">
                    <Building2 size={16} />
                    <span className="hide-mobile">ConstruViz</span>
                </Link>

                <div className="map-toolbar">
                    {/* Place Building */}
                    <button
                        className={`map-tool-btn ${buildSimOpen ? 'active' : ''}`}
                        onClick={() => { setBuildSimOpen(!buildSimOpen); setPermitPanelOpen(false); setArchLayersOpen(false); }}
                        title="Place Building"
                    >
                        <Building2 size={14} />
                        <span className="hide-mobile">Place Building</span>
                    </button>

                    {/* Empty Lots */}
                    <button
                        className={`map-tool-btn ${lotsVisible ? 'active' : ''}`}
                        onClick={toggleLots}
                        title="Empty Lots for Sale"
                    >
                        <ShoppingBag size={14} />
                        <span className="hide-mobile">Lots for Sale</span>
                    </button>

                    {/* Permit Estimator */}
                    <button
                        className={`map-tool-btn ${permitPanelOpen ? 'active' : ''}`}
                        onClick={() => { setPermitPanelOpen(!permitPanelOpen); setBuildSimOpen(false); setArchLayersOpen(false); }}
                        title="Permit Estimator"
                    >
                        <FileCheck size={14} />
                        <span className="hide-mobile">Permits</span>
                    </button>

                    {/* Arch Layers */}
                    <button
                        className={`map-tool-btn ${archLayersOpen ? 'active' : ''}`}
                        onClick={() => { setArchLayersOpen(!archLayersOpen); setBuildSimOpen(false); setPermitPanelOpen(false); }}
                        title="Building Layers"
                    >
                        <Layers size={14} />
                        <span className="hide-mobile">Layers</span>
                    </button>

                    <div className="toolbar-divider" />

                    {/* Upload */}
                    {placedEntityId ? (
                        <button className="map-tool-btn danger" onClick={clearPlacement}>
                            <Trash2 size={14} /> Clear
                        </button>
                    ) : (
                        <button className="map-tool-btn" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud size={14} />
                            <span className="hide-mobile">Upload Plan</span>
                        </button>
                    )}

                    {placedBuildings.length > 0 && (
                        <button className="map-tool-btn danger" onClick={clearAllBuildings}>
                            <Trash2 size={14} /> Clear Buildings
                        </button>
                    )}
                </div>

                <Link href="/dashboard" className="map-tool-btn" style={{ textDecoration: 'none' }}>
                    <LayoutDashboard size={14} />
                    <span className="hide-mobile">Dashboard</span>
                </Link>
            </div>

            {/* ---- Search ---- */}
            <div className="map-search">
                <Search size={16} className="map-search-icon" />
                <input
                    className="map-search-input"
                    placeholder="Search address in Portugal..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(e.target.value.length > 0); }}
                    onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                />
                {isSearching && <div style={{ position: 'absolute', right: 16, top: 18 }}><div className="spinner" style={{ width: 14, height: 14 }} /></div>}
                {searchOpen && searchResults.length > 0 && (
                    <div className="map-search-results">
                        {searchResults.map((result: any, i: number) => (
                            <button key={i} className="map-search-item" onMouseDown={() => handleSelectAddress(result)}>
                                <MapPin size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ---- Building Simulator Panel ---- */}
            {buildSimOpen && (
                <div className="side-panel" style={{ top: 80 }}>
                    <div className="side-panel-header">
                        <h3><Building2 size={16} /> Building Simulator</h3>
                        <button className="close-btn" onClick={() => setBuildSimOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="side-panel-body">
                        <label className="panel-label">Building Type</label>
                        <div className="preset-grid">
                            {BUILDING_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    className={`preset-btn ${selectedPreset.id === preset.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedPreset(preset); setBuildFloors(preset.floors); }}
                                    style={{ borderColor: selectedPreset.id === preset.id ? preset.color : undefined }}
                                >
                                    <span className="preset-dot" style={{ background: preset.color }} />
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <label className="panel-label">Floors: {buildFloors}</label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={buildFloors}
                            onChange={(e) => setBuildFloors(parseInt(e.target.value))}
                            className="range-input"
                        />
                        <div className="range-labels">
                            <span>1</span><span>20</span>
                        </div>

                        <div className="panel-stats">
                            <div className="panel-stat">
                                <span>Est. GFA</span>
                                <strong>{(selectedPreset.footprint * buildFloors).toLocaleString()} m\u00B2</strong>
                            </div>
                            <div className="panel-stat">
                                <span>Height</span>
                                <strong>{(buildFloors * 3.5).toFixed(1)} m</strong>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'var(--space-4)' }}
                            onClick={() => { setBuildPlacing(true); setBuildSimOpen(false); }}
                        >
                            Place on Map
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* ---- Lot Detail Popover ---- */}
            {lotsVisible && selectedLot && (
                <div className="side-panel" style={{ top: 80 }}>
                    <div className="side-panel-header">
                        <h3><ShoppingBag size={16} /> {selectedLot.label}</h3>
                        <button className="close-btn" onClick={() => setSelectedLot(null)}><X size={16} /></button>
                    </div>
                    <div className="side-panel-body">
                        <div className="panel-stats">
                            <div className="panel-stat"><span>Price</span><strong style={{ color: '#fbbf24' }}>{'\u20AC'}{selectedLot.price.toLocaleString()}</strong></div>
                            <div className="panel-stat"><span>Area</span><strong>{selectedLot.area} m\u00B2</strong></div>
                            <div className="panel-stat"><span>Price / m\u00B2</span><strong>{'\u20AC'}{(selectedLot.price / selectedLot.area).toFixed(0)}</strong></div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }} onClick={() => { placePropertyPin(selectedLot.lat, selectedLot.lng, selectedLot.label); setSelectedLot(null); }}>
                            Analyze This Lot <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* ---- Lots List Panel ---- */}
            {lotsVisible && !selectedLot && (
                <div className="side-panel lots-list-panel" style={{ top: 80 }}>
                    <div className="side-panel-header">
                        <h3><ShoppingBag size={16} /> Lots for Sale</h3>
                        <button className="close-btn" onClick={toggleLots}><X size={16} /></button>
                    </div>
                    <div className="side-panel-body" style={{ padding: 0 }}>
                        {SAMPLE_LOTS.map(lot => (
                            <button key={lot.id} className="lot-list-item" onClick={() => setSelectedLot(lot)}>
                                <div>
                                    <div className="lot-name">{lot.label}</div>
                                    <div className="lot-meta">{lot.area} m\u00B2</div>
                                </div>
                                <div className="lot-price">{'\u20AC'}{(lot.price / 1000).toFixed(0)}k</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ---- Permit Estimator Panel ---- */}
            {permitPanelOpen && (
                <div className="side-panel" style={{ top: 80 }}>
                    <div className="side-panel-header">
                        <h3><FileCheck size={16} /> Permit Requirements</h3>
                        <button className="close-btn" onClick={() => setPermitPanelOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="side-panel-body">
                        <div className="permit-estimate">
                            <div className="permit-estimate-row">
                                <div className="permit-estimate-label"><DollarSign size={14} /> Municipal Tax (TMU)</div>
                                <div className="permit-estimate-value">{'\u20AC'}3,200 - {'\u20AC'}8,500</div>
                            </div>
                            <div className="permit-estimate-row">
                                <div className="permit-estimate-label"><DollarSign size={14} /> Technical Projects</div>
                                <div className="permit-estimate-value">{'\u20AC'}5,000 - {'\u20AC'}15,000</div>
                            </div>
                            <div className="permit-estimate-row">
                                <div className="permit-estimate-label"><Clock size={14} /> Est. Timeline</div>
                                <div className="permit-estimate-value">90 - 180 days</div>
                            </div>
                            <div className="permit-estimate-row">
                                <div className="permit-estimate-label"><Landmark size={14} /> Permit Type</div>
                                <div className="permit-estimate-value">Licenciamento</div>
                            </div>
                        </div>

                        <label className="panel-label" style={{ marginTop: 'var(--space-6)' }}>Required Documents</label>
                        <div className="permit-docs">
                            {PERMIT_DOCS.map((doc, i) => (
                                <div key={i} className="permit-doc-item">
                                    {doc.required
                                        ? <CheckCircle2 size={14} style={{ color: 'var(--color-accent-emerald)', flexShrink: 0 }} />
                                        : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--color-text-muted)', flexShrink: 0 }} />
                                    }
                                    <span>{doc.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Architectural Layers Panel ---- */}
            {archLayersOpen && (
                <div className="side-panel" style={{ top: 80 }}>
                    <div className="side-panel-header">
                        <h3><Layers size={16} /> Architectural Layers</h3>
                        <button className="close-btn" onClick={() => setArchLayersOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="side-panel-body">
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                            Toggle building layers for architectural review
                        </p>
                        <div className="arch-layers-list">
                            {ARCH_LAYERS.map(layer => (
                                <div key={layer.id} className="arch-layer-item">
                                    <div className="arch-layer-bar" style={{ background: layer.color, opacity: archLayerVisibility[layer.id] ? 1 : 0.2 }} />
                                    <span className="arch-layer-label">{layer.label}</span>
                                    <button
                                        className="arch-layer-toggle"
                                        onClick={() => setArchLayerVisibility(prev => ({ ...prev, [layer.id]: !prev[layer.id] }))}
                                    >
                                        {archLayerVisibility[layer.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="arch-preview">
                            <div className="arch-preview-building">
                                {ARCH_LAYERS.map(layer => (
                                    <div
                                        key={layer.id}
                                        className="arch-preview-floor"
                                        style={{
                                            background: layer.color,
                                            opacity: archLayerVisibility[layer.id] ? 0.7 : 0.05,
                                            borderColor: layer.color,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- AI Panel ---- */}
            {aiPanelOpen && (
                <div className="side-panel ai-panel" style={{ top: 80, right: 'auto', left: 24, bottom: 24 }}>
                    <div className="side-panel-header">
                        <h3><Wand2 size={16} /> Property Simulation</h3>
                        <button className="close-btn" onClick={() => setAiPanelOpen(false)}><X size={16} /></button>
                    </div>

                    <div className="side-panel-body" style={{ flex: 1, overflowY: 'auto' }}>
                        {constraintsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px', color: '#94a3b8' }}>
                                <Loader2 size={24} className="spin" />
                                <span>Analyzing municipal PDM regulations...</span>
                            </div>
                        ) : constraintsResult ? (
                            <>
                                <div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Location Confirmed</div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>{constraintsResult.municipality}</div>
                                    <div style={{ display: 'inline-flex', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px', marginTop: '8px' }}>
                                        Zone: {constraintsResult.zone}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
                                    <button onClick={() => fetchConstraints(true)} disabled={constraintsLoading} className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }}>
                                        <Building2 size={14} /> Maximize Legal Yield
                                    </button>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Or Describe Modification</label>
                                    <textarea
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', minHeight: '70px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                                        placeholder="e.g. Build a 2-story house..."
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                    />
                                    <button onClick={() => fetchConstraints(false)} disabled={!userPrompt.trim() || constraintsLoading} className="btn btn-glass" style={{ marginTop: '12px', width: '100%' }}>
                                        Check Viability
                                    </button>
                                </div>

                                {constraintsResult.feasibilityMath && (
                                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', marginTop: '16px' }}>
                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 600, marginBottom: '8px' }}>ROI Feasibility</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Lot Size</span>
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{constraintsResult.feasibilityMath.lotAreaSqMeters} m{'\u00B2'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Max Implantation</span>
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{constraintsResult.feasibilityMath.maxAllowedFootprintSqMeters} m{'\u00B2'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginTop: '12px' }}>
                                            <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600 }}>Unbuilt Footprint</span>
                                            <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 700 }}>+{constraintsResult.feasibilityMath.unbuiltFootprintSqMeters} m{'\u00B2'}</span>
                                        </div>
                                    </div>
                                )}

                                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', marginTop: '12px' }}>
                                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#fcd34d', fontWeight: 600, marginBottom: '8px' }}>Permitting Pipeline</div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ background: '#d97706', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{constraintsResult.permitType}</div>
                                        <div style={{ fontSize: '13px', color: '#fde68a', lineHeight: 1.4 }}>Est. approval: <strong>{constraintsResult.estimatedTimelineDays} days</strong></div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', borderRadius: '12px', background: constraintsResult.isLegal ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${constraintsResult.isLegal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`, marginTop: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: constraintsResult.isLegal ? '#10b981' : '#ef4444', fontWeight: 600, marginBottom: '8px' }}>
                                        {constraintsResult.isLegal ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        {constraintsResult.isLegal ? 'Legally Viable' : 'Exceeds Limits'}
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {constraintsResult.allowedModifications.map((mod: string, i: number) => <li key={i}>{mod}</li>)}
                                        {!constraintsResult.isLegal && constraintsResult.restrictions.map((res: string, i: number) => <li key={i} style={{ color: '#f87171' }}>{res}</li>)}
                                    </ul>
                                </div>

                                {aiResult ? (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>AI Render</div>
                                        <img src={aiResult.imageUrl} alt="AI visualization" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </div>
                                ) : (
                                    <button className="btn btn-primary" onClick={handleGenerateAI} disabled={aiLoading || !constraintsResult.isLegal} style={{ width: '100%', marginTop: '16px' }}>
                                        {aiLoading ? <><Loader2 size={14} className="spin" /> Generating...</> : 'Generate AI Visualization'}
                                    </button>
                                )}
                            </>
                        ) : selectedPropertyCoords ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Property Selected</div>
                                    <div style={{ fontSize: '14px', color: 'white', lineHeight: 1.4 }}>{selectedAddress || `${selectedPropertyCoords.lat.toFixed(4)}\u00B0N, ${selectedPropertyCoords.lng.toFixed(4)}\u00B0W`}</div>
                                </div>
                                <button onClick={() => fetchConstraints(true)} disabled={constraintsLoading} className="btn btn-primary" style={{ width: '100%' }}>
                                    <Building2 size={14} /> Maximize Legal Yield
                                </button>
                                <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Or Describe Modification</label>
                                <textarea
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', minHeight: '70px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                                    placeholder="e.g. Build a 2-story house..."
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                />
                                <button onClick={() => fetchConstraints(false)} disabled={!userPrompt.trim()} className="btn btn-glass" style={{ width: '100%' }}>Check Viability</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', padding: '20px' }}>
                                <MousePointerClick size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p>Search for an address or click anywhere on the map to begin analysis.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ---- Right Controls ---- */}
            <div className="map-controls">
                <button className="map-control-btn" onClick={zoomIn} title="Zoom In"><Plus size={18} /></button>
                <button className="map-control-btn" onClick={zoomOut} title="Zoom Out"><Minus size={18} /></button>
                <div className="map-control-divider" />
                <button className="map-control-btn" onClick={resetView} title="Reset View"><Home size={18} /></button>
                <button className={`map-control-btn ${layerPanelOpen ? 'active' : ''}`} onClick={() => setLayerPanelOpen(!layerPanelOpen)} title="Map Layers"><Layers size={18} /></button>
            </div>

            {/* Layer Panel */}
            {layerPanelOpen && (
                <div className="layer-panel">
                    <div className="layer-panel-header">
                        <h3>Map Layers</h3>
                        <button className="close-btn" onClick={() => setLayerPanelOpen(false)}><X size={14} /></button>
                    </div>
                    {layers.map((layer) => (
                        <div key={layer.id} className="layer-item">
                            <button className={`layer-toggle ${layer.visible ? 'active' : ''}`} onClick={() => toggleLayer(layer.id)} aria-label={`Toggle ${layer.name}`} />
                            <div className="layer-info">
                                <div className="layer-name">{layer.name}</div>
                                <div className="layer-type">{layer.type}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* City Quick Nav */}
            <div className="city-nav">
                {PORTUGUESE_CITIES.slice(0, 8).map((city) => (
                    <button key={city.name} className={`city-btn ${activeCity === city.name ? 'active' : ''}`} onClick={() => flyToCity(city.name)}>
                        {city.name}
                    </button>
                ))}
            </div>

            {cursorCoords && <div className="map-coords">{cursorCoords}</div>}
        </div>
    );
}
