export type Municipality = 'Cascais' | 'Oeiras' | 'Lisboa' | 'Sintra';

export type ZoneClassification =
    | 'Urban Consolidated'
    | 'Urban Expansion'
    | 'Historical Center'
    | 'Rural/Agricultural'
    | 'Protected Natural Area';

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
    requiresArchitecturalApproval: boolean; // "Licenciamento" vs "Comunicação Prévia"

    notes: string[];
}

export type UserIntentAction =
    | 'add_floors'
    | 'subdivide_lot'
    | 'build_annex'
    | 'change_usage'
    | 'build_wall'
    | 'exterior_modification'
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

// Result of checking a property against PDM rules
export interface ConstraintCheckResult {
    isLegal: boolean;
    municipality: Municipality;
    zone: ZoneClassification;
    parsedIntent?: ParsedUserIntent;
    allowedModifications: string[];
    restrictions: string[];
    requiredPermits: string[];
    confidenceScore: number; // 0-1, lower if coords are near zone borders
}

// Request payload for checking constraints
export interface ConstraintCheckRequest {
    lat: number;
    lng: number;
    prompt: string; // The freeform text input from the user
    currentFloors?: number;
    lotAreaSqMeters?: number;
    currentImplantationAreaSqMeters?: number;
}
