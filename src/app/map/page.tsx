'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    Building2,
    Search,
    Layers,
    Plus,
    Minus,
    Home,
    Compass,
    Eye,
    EyeOff,
    MapPin,
    Ruler,
    LayoutDashboard,
    Navigation,
    ChevronLeft,
    X,
} from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_LAYERS);
    const [layerPanelOpen, setLayerPanelOpen] = useState(false);
    const [activeCity, setActiveCity] = useState<string>('Lisboa');
    const [cursorCoords, setCursorCoords] = useState<string>('');
    const buildingsTilesetRef = useRef<any>(null);

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

    // Search handler
    const filteredCities = PORTUGUESE_CITIES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="map-page" id="map-page">
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

            {/* Top Bar */}
            <div className="map-topbar">
                <Link href="/" className="map-logo">
                    <Building2 size={18} />
                    <span className="hide-mobile">ConstruViz</span>
                </Link>

                <div className="map-nav-buttons">
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
            <div className="map-search">
                <Search size={16} className="map-search-icon" />
                <input
                    className="map-search-input"
                    placeholder="Search Portuguese cities..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
                {searchOpen && filteredCities.length > 0 && (
                    <div className="map-search-results">
                        {filteredCities.map((city) => (
                            <button
                                key={city.name}
                                className="map-search-item"
                                onMouseDown={() => {
                                    flyToCity(city.name);
                                    setSearchQuery(city.name);
                                    setSearchOpen(false);
                                }}
                            >
                                <MapPin size={14} />
                                {city.name}
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
