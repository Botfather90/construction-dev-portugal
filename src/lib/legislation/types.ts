export type Municipality = 'Cascais' | 'Oeiras' | 'Lisboa' | 'Sintra';

export type ZoneClassification =
    | 'Urban Consolidated'
    | 'Urban Expansion'
    | 'Historical Center'
    | 'Rural/Agricultural'
    | 'Protected Natural Area';

export type PermitType =
    | 'Isento' // Exempt from licensing entirely
    | 'Comunicação Prévia' // 20-day fast track
    | 'Licenciamento' // 6-18 month full approval process
    | 'Pedido de Informação Prévia (PIP)' // Feasibility request before licensing
    | 'Destaque de Parcela'; // Subdivision specific payload

// Expanded representation of PDM (Plano Diretor Municipal) rules
export interface PDMRules {
    municipality: Municipality;
    zone: ZoneClassification;

    // Volumetry & Density
    maxFloors: number;
    maxHeightMeters: number;
    maxImplantationPercentage: number; // Max % of lot area covered by building footprint
    maxConstructionIndex: number; // Max ratio of total construction area / lot area

    // Subdivisions (Destaque de Parcela)
    allowsSubdivision: boolean;
    minLotSizeSqMetersAfterSubdivision?: number;

    // Usage
    allowsUsageChange: boolean; // e.g., commercial to residential
    allowedUses: ('Residential' | 'Commercial' | 'Services' | 'Industrial' | 'Tourism' | 'Rural/Agricultural')[];

    // Exterior & Additions
    allowsAnnexes: boolean;
    maxAnnexAreaSqMeters?: number;
    maxBoundaryWallHeightMeters: number;
    requiresArchitecturalApproval: boolean; // True forces Licenciamento generally

    notes: string[];
}

// Structured intent for the backend to run math against.
// Extracted from user prompts or generated automatically via "Maximize Yield".
export type UserIntentAction =
    | 'add_floors'
    | 'subdivide_lot'
    | 'build_annex'
    | 'change_usage'
    | 'build_wall'
    | 'maximize_yield' // The master ROI button mapping
    | 'unknown';

export interface ParsedUserIntent {
    action: UserIntentAction;
    targetFloors?: number;
    subdivisionUnits?: number;
    annexArea?: number;
    targetUsage?: string;
    wallHeight?: number;
    description: string;
}

// Feasibility math objects returned to the frontend
export interface FeasibilityMath {
    lotAreaSqMeters: number;
    currentImplantationAreaSqMeters: number;
    maxAllowedFootprintSqMeters: number;
    unbuiltFootprintSqMeters: number; // The golden number investors care about
    maxTotalConstructionSqMeters: number; // e.g., footprint * floors
}

// Result of checking a property against PDM rules
export interface ConstraintCheckResult {
    isLegal: boolean;
    municipality: Municipality;
    zone: ZoneClassification;
    parsedIntent?: ParsedUserIntent;
    feasibilityMath?: FeasibilityMath; // The ROI calculation
    permitType: PermitType;
    estimatedTimelineDays: number; // Extremely important for commercial viability
    allowedModifications: string[];
    restrictions: string[];
    confidenceScore: number;
}

// Request payload for checking constraints
export interface ConstraintCheckRequest {
    lat: number;
    lng: number;
    prompt: string; // Used if they type manually
    isMaximizeYield?: boolean; // True if they click the ROI button
    currentFloors?: number;
    lotAreaSqMeters?: number; // Ideally drawn from actual GIS layer or mocked default
    currentImplantationAreaSqMeters?: number; // Base footprint of existing structures
}
