# ConstruViz 🏗️

**AI-Native Construction Development Visualization Platform for Portugal**

Upload floor plans, visualize new developments in real 3D alongside surrounding buildings, and leverage AI for automated analysis — at 10x lower cost than enterprise tools.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + React
- **3D Engine**: CesiumJS (OSM 3D Buildings, World Terrain)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with design system (dark mode, glassmorphism)
- **Data**: localStorage (MVP), PostgreSQL + PostGIS (planned)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment (add your Cesium ion token)
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features, pricing, comparison |
| `/map` | Full-screen 3D map with CesiumJS, OSM buildings, city navigation |
| `/dashboard` | Project management — create, list, view projects |
| `/dashboard/[id]` | Project detail with documents, overview, settings |

## Project Structure

```
src/
├── app/                  # Next.js pages
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout + SEO
│   ├── map/page.tsx      # 3D Map viewer
│   └── dashboard/        # Project management
├── components/           # React components  
├── lib/                  # Utilities & helpers
│   ├── cesium.ts         # Cesium config, Portuguese cities
│   ├── projects.ts       # Project CRUD (localStorage)
│   └── documents.ts      # Document storage helpers
├── styles/               # CSS design system
│   ├── globals.css       # Variables, reset, animations
│   ├── components.css    # Buttons, cards, modals, inputs
│   ├── landing.css       # Landing page styles
│   ├── map.css           # 3D map viewer styles
│   └── dashboard.css     # Dashboard & project styles
└── types/                # TypeScript definitions
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Yes | Cesium ion access token ([get free](https://ion.cesium.com)) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox token for enhanced imagery |

---

Built by [Digiton Dynamics](mailto:brandon@digiton.ai) • Lisbon & Tallinn
