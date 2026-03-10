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
    Compass,
    Eye,
    EyeOff,
    Building2,
    Ruler,
    LayoutDashboard,
    Navigation,
    ChevronLeft,
    X,
    UploadCloud,
    MousePointerClick,
    Trash2,
    Wand2,
    Info,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { PORTUGUESE_CITIES, DEFAULT_LAYERS, CESIUM_ASSETS, formatCoords, LISBON_VIEW } from '@/lib/cesium';
import { MapLayer } from '@/types';
import { ConstraintCheckRequest, ConstraintCheckResult } from '@/lib/legislation/types';
import '@/styles/map.css';

// Dynamic import marker for Cesium - will be loaded client-side
let Cesium: any = null;

export default function MapPage() {
    const viewerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // AI & Legislation State
    const [selectedPropertyCoords, setSelectedPropertyCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [userPrompt, setUserPrompt] = useState<string>('');
    const [constraintsLoading, setConstraintsLoading] = useState(false);
    const [constraintsResult, setConstraintsResult] = useState<ConstraintCheckResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{ imageUrl: string, promptUsed: string } | null>(null);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);

    // Refs for event handlers
    const isPlacingRef = useRef(isPlacing);
    const floorPlanImageRef = useRef(floorPlanImage);

    useEffect(() => {
        isPlacingRef.current = isPlacing;
        floorPlanImageRef.current = floorPlanImage;
    }, [isPlacing, floorPlanImage]);

    // Initialize Cesium
    useEffect(() => {
        let mounted = true;

        async function initCesium() {
            try {
                // Dynamic import of Cesium
                const CesiumModule = await import('cesium');
                Cesium = CesiumModule;

                // Set base URL for Cesium assets
                (window as any).CESIUM_BASE_URL = '/cesium';

                // Set access token
                Cesium.Ion.defaultAccessToken =
                    (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '').trim();

                if (!mounted || !containerRef.current) return;

                // Create viewer with a cinematic diorama aesthetic
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
                    creditContainer: document.createElement('div'), // hide credits
                    msaaSamples: 4,
                    skyAtmosphere: false,
                    skyBox: false,
                    contextOptions: {
                        webgl: {
                            alpha: true,
                            antialias: true
                        }
                    }
                });

                viewerRef.current = viewer;

                // Diorama visual setup
                viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0B101E'); // Match deep navy background
                viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#111827');
                viewer.scene.globe.showWaterEffect = true;
                viewer.scene.highDynamicRange = true;
                viewer.scene.globe.enableLighting = true;
                viewer.scene.globe.depthTestAgainstTerrain = true;

                // Add soft fog for depth perception
                viewer.scene.fog.enabled = true;
                viewer.scene.fog.density = 0.0003;
                viewer.scene.fog.screenSpaceErrorFactor = 2.0;

                // Post-processing: Ambient Occlusion for realistic shadows in crevices
                if (Cesium.PostProcessStageLibrary.isAmbientOcclusionSupported(viewer.scene)) {
                    const ambientOcclusion = viewer.scene.postProcessStages.ambientOcclusion;
                    ambientOcclusion.enabled = true;
                    ambientOcclusion.uniforms.intensity = 3.0;
                    ambientOcclusion.uniforms.lengthCap = 0.25;
                    ambientOcclusion.uniforms.stepSize = 1.5;
                    ambientOcclusion.uniforms.bias = 0.05;
                }

                // Silhouette/Edge highlight on buildings
                const edgeDetection = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
                edgeDetection.uniforms.color = Cesium.Color.clone(Cesium.Color.CYAN).withAlpha(0.2);
                edgeDetection.uniforms.length = 0.1;

                // Add OSM 3D Buildings with styled "architectural model / clay" look
                try {
                    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(
                        CESIUM_ASSETS.OSM_BUILDINGS
                    );

                    // Style buildings: neutral gray with slight transparency, white for features
                    tileset.style = new Cesium.Cesium3DTileStyle({
                        color: "color('#A1A1AA', 0.9)", // Soft zinc color
                        show: true
                    });

                    viewer.scene.primitives.add(tileset);
                    buildingsTilesetRef.current = tileset;
                } catch (e) {
                    console.warn('Could not load OSM buildings:', e);
                }

                // Start with a dramatic tilt / isometric angle
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                        LISBON_VIEW.longitude,
                        LISBON_VIEW.latitude,
                        LISBON_VIEW.altitude * 0.4 // Closer for diorama feel
                    ),
                    orientation: {
                        heading: Cesium.Math.toRadians(45), // Isometric angle
                        pitch: Cesium.Math.toRadians(-30),  // Low angle
                        roll: 0,
                    },
                    duration: 0,
                });

                // Track cursor coordinates
                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((movement: any) => {
                    const cartesian = viewer.camera.pickEllipsoid(
                        movement.endPosition,
                        viewer.scene.globe.ellipsoid
                    );
                    if (cartesian) {
                        const carto = Cesium.Cartographic.fromCartesian(cartesian);
                        const lat = Cesium.Math.toDegrees(carto.latitude);
                        const lng = Cesium.Math.toDegrees(carto.longitude);
                        setCursorCoords(formatCoords(lat, lng));
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                // Handle map clicks (placement or selection)
                handler.setInputAction((click: any) => {
                    const ray = viewer.camera.getPickRay(click.position);
                    const position = viewer.scene.globe.pick(ray, viewer.scene);

                    if (!position) return;

                    const cartographic = Cesium.Cartographic.fromCartesian(position);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);

                    if (isPlacingRef.current && floorPlanImageRef.current) {
                        // 1. Blueprint Placement Mode
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
                        // 2. Property Selection Mode for AI Check
                        setSelectedPropertyCoords({ lat, lng: lon });
                        // Fly closely to the selected property but not into the floor
                        viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500), // Wider view
                            orientation: {
                                heading: viewer.camera.heading,
                                pitch: Cesium.Math.toRadians(-35),
                                roll: 0,
                            },
                            duration: 1.5,
                        });

                        // Reset prompt when a new property is clicked
                        setUserPrompt('');
                        setConstraintsResult(null);
                        setAiResult(null);
                        setAiPanelOpen(true);
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                if (mounted) setLoading(false);
            } catch (err: any) {
                console.error('Cesium init error:', err);
                if (mounted) {
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

    // Fly to city
    const flyToCity = useCallback(
        (cityName: string) => {
            const city = PORTUGUESE_CITIES.find((c) => c.name === cityName);
            if (!city || !viewerRef.current || !Cesium) return;

            setActiveCity(cityName);
            viewerRef.current.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    city.lng,
                    city.lat,
                    city.altitude
                ),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0,
                },
                duration: 1.5,
            });
        },
        []
    );

    // Toggle layer visibility
    const toggleLayer = useCallback(
        (layerId: string) => {
            setLayers((prev) =>
                prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
            );

            const viewer = viewerRef.current;
            if (!viewer || !Cesium) return;

            if (layerId === 'osm-buildings' && buildingsTilesetRef.current) {
                buildingsTilesetRef.current.show = !buildingsTilesetRef.current.show;
            }
            if (layerId === 'terrain') {
                const layer = layers.find((l) => l.id === layerId);
                if (layer) {
                    viewer.scene.globe.show = !layer.visible;
                }
            }
        },
        [layers]
    );

    // Zoom controls
    const zoomIn = () => {
        if (!viewerRef.current) return;
        viewerRef.current.camera.zoomIn(
            viewerRef.current.camera.positionCartographic.height * 0.3
        );
    };

    const zoomOut = () => {
        if (!viewerRef.current) return;
        viewerRef.current.camera.zoomOut(
            viewerRef.current.camera.positionCartographic.height * 0.5
        );
    };

    const resetView = () => {
        flyToCity('Lisboa');
    };

    // Geocoding Search handler
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Nominatim API: search address in Portugal
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&countrycodes=pt&format=json&limit=5`;
                const res = await axios.get(url);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Geocoding failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectAddress = (result: any) => {
        setSearchQuery(result.display_name);
        setSearchOpen(false);
        if (!viewerRef.current || !Cesium) return;

        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        // Fly closely to the searched property for evaluation
        viewerRef.current.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 200),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0,
            },
            duration: 2,
        });
    };

    // Floor plan upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setFloorPlanImage(event.target?.result as string);
            setIsPlacing(true); // Automatically enter placement mode when uploaded
        };
        reader.readAsDataURL(file);
    };

    const clearPlacement = () => {
        if (placedEntityId && viewerRef.current) {
            viewerRef.current.entities.removeById(placedEntityId);
        }
        setPlacedEntityId(null);
        setFloorPlanImage(null);
        setIsPlacing(false);
    };

    const fetchConstraints = async (isMaximizeYield: boolean = false) => {
        if (!selectedPropertyCoords) return;
        if (!isMaximizeYield && !userPrompt.trim()) return;

        setConstraintsLoading(true);
        setConstraintsResult(null);
        setAiResult(null);
        try {
            const req: ConstraintCheckRequest = {
                lat: selectedPropertyCoords.lat,
                lng: selectedPropertyCoords.lng,
                prompt: userPrompt,
                isMaximizeYield
            };
            const res = await axios.post('/api/check-permits', req);
            if (res.data.success) {
                setConstraintsResult(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch constraints', error);
        } finally {
            setConstraintsLoading(false);
        }
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
            if (res.data.success) {
                setAiResult({
                    imageUrl: res.data.imageUrl,
                    promptUsed: res.data.promptUsed
                });
            }
        } catch (error) {
            console.error('Failed to generate AI design', error);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="map-page" id="map-page">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, application/pdf"
                onChange={handleFileUpload}
            />

            {/* Cesium container */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading overlay */}
            {loading && (
                <div className="map-loading">
                    <div className="spinner" style={{ width: 40, height: 40 }} />
                    <div className="map-loading-text">
                        {error ? error : 'Loading 3D Map Engine...'}
                    </div>
                    {error && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', maxWidth: 400, textAlign: 'center', marginTop: 'var(--space-2)' }}>
                            Make sure you have a valid Cesium ion token in your .env.local file.
                            Get one free at <a href="https://ion.cesium.com" target="_blank" rel="noreferrer">ion.cesium.com</a>
                        </p>
                    )}
                </div>
            )}

            {/* Placement Mode Overlay */}
            {isPlacing && (
                <div style={{
                    position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 200, background: 'rgba(16, 185, 129, 0.9)', color: 'white',
                    padding: '12px 24px', borderRadius: '30px', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                    animation: 'pulse 2s infinite'
                }}>
                    <MousePointerClick size={18} />
                    Click anywhere on the map to place your property
                </div>
            )}

            {/* Top Bar */}
            <div className="map-topbar">
                <Link href="/" className="map-logo">
                    <Building2 size={18} />
                    <span className="hide-mobile">ConstruViz</span>
                </Link>

                <div className="map-nav-buttons">
                    {placedEntityId ? (
                        <button className="btn btn-sm btn-danger" onClick={clearPlacement}>
                            <Trash2 size={14} /> Clear Overlay
                        </button>
                    ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud size={14} /> Simulate Property
                        </button>
                    )}
                    <Link href="/dashboard" className="btn btn-sm btn-secondary" style={{
                        background: 'rgba(10, 14, 26, 0.7)',
                        backdropFilter: 'blur(12px)',
                    }}>
                        <LayoutDashboard size={14} />
                        <span className="hide-mobile">Dashboard</span>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="map-search" style={{ width: 400 }}>
                <Search size={16} className="map-search-icon" />
                <input
                    className="map-search-input"
                    placeholder="Search address (e.g. Rua Augusta, Lisboa)"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                // onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
                {isSearching && (
                    <div style={{ position: 'absolute', right: 16, top: 18 }}>
                        <div className="spinner" style={{ width: 14, height: 14 }}></div>
                    </div>
                )}

                {searchOpen && searchResults.length > 0 && (
                    <div className="map-search-results" style={{ width: 400 }}>
                        {searchResults.map((result: any, i: number) => (
                            <button
                                key={i}
                                className="map-search-item"
                                style={{ textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px' }}
                                onMouseDown={() => handleSelectAddress(result)}
                            >
                                <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: '13px', lineHeight: 1.4 }}>{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Generation & Constraints Panel */}
            {aiPanelOpen && (
                <div className="ai-panel" style={{
                    position: 'absolute', top: 80, left: 24, width: 380, bottom: 24,
                    background: 'rgba(11, 16, 30, 0.85)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wand2 size={16} className="text-primary" /> Property Simulation
                        </h3>
                        <button onClick={() => setAiPanelOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {constraintsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px', color: '#94a3b8' }}>
                                <Loader2 size={24} className="spin" />
                                <span>Analyzing municipal PDM regulations...</span>
                            </div>
                        ) : constraintsResult ? (
                            <>
                                {/* Constraints Header */}
                                <div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Location Confirmed</div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>{constraintsResult.municipality}</div>
                                    <div style={{ display: 'inline-flex', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px', marginTop: '8px' }}>
                                        Zone: {constraintsResult.zone}
                                    </div>
                                </div>

                                {/* Freeform Prompt Area */}
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>

                                    <button
                                        onClick={() => fetchConstraints(true)}
                                        disabled={constraintsLoading}
                                        className="btn btn-sm"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            marginBottom: '16px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            fontWeight: 600,
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Building2 size={16} /> Maximize Legal Yield
                                        </div>
                                    </button>

                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Or Describe Specific Modification</label>
                                    <textarea
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            minHeight: '80px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            resize: 'vertical'
                                        }}
                                        placeholder="e.g. Build a 2-story house with a wooden annex, or extend commercial space..."
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={() => fetchConstraints(false)}
                                        disabled={!userPrompt.trim() || constraintsLoading}
                                        className="btn btn-sm btn-secondary"
                                        style={{ marginTop: '12px', width: '100%', padding: '8px' }}
                                    >
                                        Check Viability
                                    </button>
                                </div>

                                {/* Feasibility & Legality Check */}
                                {constraintsResult && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                        {/* ROI Math Block */}
                                        {constraintsResult.feasibilityMath && (
                                            <div style={{
                                                padding: '16px', borderRadius: '12px',
                                                background: 'rgba(59, 130, 246, 0.1)', // Blue tint for math
                                                border: '1px solid rgba(59, 130, 246, 0.2)'
                                            }}>
                                                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 600, marginBottom: '8px' }}>ROI Feasibility Math</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Lot Size</span>
                                                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{constraintsResult.feasibilityMath.lotAreaSqMeters} m²</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Max Implantation</span>
                                                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{constraintsResult.feasibilityMath.maxAllowedFootprintSqMeters} m²</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginTop: '12px' }}>
                                                    <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600 }}>Unbuilt Footprint</span>
                                                    <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 700 }}>+{constraintsResult.feasibilityMath.unbuiltFootprintSqMeters} m²</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Permit Pipeline / Timeline */}
                                        <div style={{
                                            padding: '16px', borderRadius: '12px',
                                            background: 'rgba(245, 158, 11, 0.1)', // Amber warning tint
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                        }}>
                                            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#fcd34d', fontWeight: 600, marginBottom: '8px' }}>Permitting Pipeline</div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ background: '#d97706', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {constraintsResult.permitType}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#fde68a', lineHeight: 1.4 }}>
                                                    Estimated minimum municipal approval timeline: <strong>{constraintsResult.estimatedTimelineDays} days</strong>.
                                                </div>
                                            </div>
                                        </div>

                                        {/* Legality Box */}
                                        <div style={{
                                            padding: '16px', borderRadius: '12px',
                                            background: constraintsResult.isLegal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${constraintsResult.isLegal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: constraintsResult.isLegal ? '#10b981' : '#ef4444', fontWeight: 600, marginBottom: '8px' }}>
                                                {constraintsResult.isLegal ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                {constraintsResult.isLegal ? 'Modification Legally Viable' : 'Exceeds Legal Limits'}
                                            </div>

                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {constraintsResult.allowedModifications.map((mod, i) => <li key={i}>{mod}</li>)}
                                                {!constraintsResult.isLegal && constraintsResult.restrictions.map((res, i) => <li key={i} style={{ color: '#f87171' }}>{res}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* AI Result or Button */}
                                {aiResult ? (
                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>AI Feasibility Render</div>
                                        <img src={aiResult.imageUrl} alt="AI Generated visualization" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)' }} />

                                        <button
                                            onClick={() => window.print()}
                                            className="btn btn-sm"
                                            style={{
                                                marginTop: '16px', width: '100%', padding: '10px',
                                                background: 'white', color: 'black', fontWeight: 600,
                                                borderRadius: '8px', border: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                Download Feasibility Study (PDF)
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn"
                                        onClick={() => handleGenerateAI()}
                                        disabled={aiLoading || !constraintsResult.isLegal}
                                        style={{
                                            marginTop: 'auto',
                                            width: '100%',
                                            background: constraintsResult.isLegal ? 'white' : 'rgba(255,255,255,0.1)',
                                            color: constraintsResult.isLegal ? 'black' : 'rgba(255,255,255,0.3)',
                                            border: 'none',
                                            fontWeight: 600,
                                            padding: '12px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {aiLoading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'black' }}></div> generating render...
                                            </div>
                                        ) : 'Generate AI Visualization '}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', padding: '20px' }}>
                                <MousePointerClick size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p>Click anywhere on the map to analyze a property and simulate modifications.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Right Controls */}
            <div className="map-controls">
                <button
                    className="map-control-btn"
                    onClick={zoomIn}
                    title="Zoom In"
                >
                    <Plus size={18} />
                </button>
                <button
                    className="map-control-btn"
                    onClick={zoomOut}
                    title="Zoom Out"
                >
                    <Minus size={18} />
                </button>
                <div className="map-control-divider" />
                <button
                    className="map-control-btn"
                    onClick={resetView}
                    title="Reset View"
                >
                    <Home size={18} />
                </button>
                <button
                    className={`map-control-btn ${layerPanelOpen ? 'active' : ''}`}
                    onClick={() => setLayerPanelOpen(!layerPanelOpen)}
                    title="Layers"
                >
                    <Layers size={18} />
                </button>
            </div>

            {/* Layer Panel */}
            {layerPanelOpen && (
                <div className="layer-panel">
                    <div className="layer-panel-header">
                        <h3>Map Layers</h3>
                        <button
                            className="btn btn-icon btn-ghost"
                            style={{ minWidth: 28, minHeight: 28, padding: 4 }}
                            onClick={() => setLayerPanelOpen(false)}
                        >
                            <X size={14} />
                        </button>
                    </div>
                    {layers.map((layer) => (
                        <div key={layer.id} className="layer-item">
                            <button
                                className={`layer-toggle ${layer.visible ? 'active' : ''}`}
                                onClick={() => toggleLayer(layer.id)}
                                aria-label={`Toggle ${layer.name}`}
                            />
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
                    <button
                        key={city.name}
                        className={`city-btn ${activeCity === city.name ? 'active' : ''}`}
                        onClick={() => flyToCity(city.name)}
                    >
                        {city.name}
                    </button>
                ))}
            </div>

            {/* Coordinates */}
            {cursorCoords && <div className="map-coords">{cursorCoords}</div>}
        </div>
    );
}
