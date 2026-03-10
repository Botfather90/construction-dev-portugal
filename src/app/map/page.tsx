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
    Trash2
} from 'lucide-react';
import axios from 'axios';
import { PORTUGUESE_CITIES, DEFAULT_LAYERS, CESIUM_ASSETS, formatCoords, LISBON_VIEW } from '@/lib/cesium';
import { MapLayer } from '@/types';
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
                    process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '';

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

                // Handle floor plan placement
                handler.setInputAction((click: any) => {
                    if (!isPlacingRef.current || !floorPlanImageRef.current) return;

                    const ray = viewer.camera.getPickRay(click.position);
                    const position = viewer.scene.globe.pick(ray, viewer.scene);

                    if (position) {
                        const cartographic = Cesium.Cartographic.fromCartesian(position);
                        const lon = Cesium.Math.toDegrees(cartographic.longitude);
                        const lat = Cesium.Math.toDegrees(cartographic.latitude);

                        // Create a 3D volume representing the new property (e.g. 20m x 30m x 15m bounding box)
                        // using the uploaded floor plan as the top texture for visualization
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
