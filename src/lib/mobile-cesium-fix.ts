// Mobile-specific Cesium initialization fixes

export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function getMobileViewerOptions(Cesium: any) {
    const isMobile = isMobileDevice();
    
    return {
        // Reduced graphics settings for mobile
        requestRenderMode: isMobile,
        maximumRenderTimeChange: isMobile ? Infinity : 0.0,
        msaaSamples: isMobile ? 1 : 4,
        
        // Disable heavy features on mobile
        shadows: !isMobile,
        terrainShadows: isMobile ? Cesium.ShadowMode.DISABLED : Cesium.ShadowMode.ENABLED,
        
        // Context options for better mobile compatibility
        contextOptions: {
            webgl: {
                alpha: false,
                depth: true,
                stencil: false,
                antialias: !isMobile,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                powerPreference: isMobile ? 'low-power' : 'high-performance'
            }
        }
    };
}

export function configureMobileScene(viewer: any, Cesium: any) {
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        // Reduce quality settings for mobile
        viewer.scene.globe.maximumScreenSpaceError = 4; // Higher = lower quality but better performance
        viewer.scene.fog.enabled = false;
        viewer.scene.highDynamicRange = false;
        viewer.scene.globe.showWaterEffect = false;
        
        // Disable post-processing on mobile
        if (viewer.scene.postProcessStages.ambientOcclusion) {
            viewer.scene.postProcessStages.ambientOcclusion.enabled = false;
        }
        
        // Disable lighting for better performance
        viewer.scene.globe.enableLighting = false;
        
        // Simpler atmosphere
        viewer.scene.skyAtmosphere.show = true;
    }
    
    return viewer;
}

export function handleCesiumLoadError(error: any): string {
    console.error('Cesium load error:', error);
    
    // Check for specific mobile issues
    const isMobile = isMobileDevice();
    
    if (isMobile && error.message?.includes('WebGL')) {
        return 'WebGL is required but may not be available on your device. Try updating your browser or using a different device.';
    }
    
    if (error.message?.includes('token') || error.message?.includes('401')) {
        return 'Cesium Ion authentication failed. Please contact support.';
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return 'Network error loading map tiles. Please check your internet connection.';
    }
    
    return `Map initialization error: ${error.message || 'Unknown error'}`;
}
