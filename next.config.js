/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        // Don't process Cesium on the server
        if (isServer) {
            return config;
        }

        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
        };

        // Cesium uses web workers with ES modules - we load them from CDN instead
        // of bundling, so no copy-webpack-plugin needed
        config.module = {
            ...config.module,
            unknownContextCritical: false,
        };

        return config;
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.cesium.com' },
            { protocol: 'https', hostname: '**.mapbox.com' },
            { protocol: 'https', hostname: '**.openstreetmap.org' },
        ],
    },
};

module.exports = nextConfig;
