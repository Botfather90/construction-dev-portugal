import type { Metadata } from 'next';
import '@/styles/globals.css';
import '@/styles/components.css';

export const metadata: Metadata = {
    title: 'ConstruViz \u2014 AI Construction Visualization for Portugal',
    description:
        'Upload floor plans, visualize projects in real 3D alongside surrounding buildings, and leverage AI for automated feasibility analysis. Built for Portuguese construction developers, architects, and engineers.',
    keywords: [
        'BIM Portugal',
        'construction visualization',
        'ConstruViz',
        '3D building viewer',
        'floor plan upload',
        'construction development',
        'Portugal construction',
        'AI construction',
        'permit feasibility',
        'architectural visualization',
    ],
    openGraph: {
        title: 'ConstruViz \u2014 AI Construction Visualization',
        description:
            'See your new development in real 3D city context. Upload plans, analyze with AI, get permit feasibility instantly.',
        type: 'website',
        locale: 'pt_PT',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    rel="stylesheet"
                    href="https://cesium.com/downloads/cesiumjs/releases/1.139.1/Build/Cesium/Widgets/widgets.css"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>{children}</body>
        </html>
    );
}
