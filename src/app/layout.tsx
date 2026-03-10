import type { Metadata } from 'next';
import '@/styles/globals.css';
import '@/styles/components.css';

export const metadata: Metadata = {
    title: 'ConstruViz — AI-Native Construction Visualization for Portugal',
    description:
        'Upload floor plans, visualize projects in real 3D alongside surrounding buildings, and leverage AI for automated analysis. Built for Portuguese construction developers, architects, and engineers.',
    keywords: [
        'BIM Portugal',
        'construction visualization',
        'ConstruViz',
        '3D building viewer',
        'floor plan upload',
        'construction development',
        'Portugal construction',
        'AI construction',
    ],
    openGraph: {
        title: 'ConstruViz — AI-Native Construction Visualization',
        description:
            'See your new development in real 3D city context. Upload plans, analyze with AI, collaborate with stakeholders.',
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
                    href="https://cesium.com/downloads/cesiumjs/releases/1.125/Build/Cesium/Widgets/widgets.css"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
