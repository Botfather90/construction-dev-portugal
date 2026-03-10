export type Municipality = 'Cascais' | 'Oeiras' | 'Lisboa' | 'Sintra';

export type ZoneClassification =
    | 'Urban Consolidated'
    | 'Urban Expansion'
    | 'Historical Center'
    | 'Rural/Agricultural'
    | 'Protected Natural Area';

// Simplified representation of PDM (Plano Diretor Municipal) rules
export interface PDMRules {
    municipality: Municipality;
    zone: ZoneClassification;
    maxFloors: number;
    maxHeightMeters: number;
    maxImplantationPercentage?: number; // % of lot area that can be built on
    maxConstructionPercentage?: number; // % of lot area for total construction (all floors)
    allowsUsageChange: boolean; // e.g., commercial to residential
    requiresArchitecturalApproval: boolean;
    notes: string[];
}

// Result of checking a property against PDM rules
export interface ConstraintCheckResult {
    isLegal: boolean;
    municipality: Municipality;
    zone: ZoneClassification;
    allowedModifications: string[];
    restrictions: string[];
    maxAdditionalFloors: number;
    requiredPermits: string[];
    confidenceScore: number; // 0-1, lower if coords are near zone borders
}

// Request payload for checking constraints
export interface ConstraintCheckRequest {
    lat: number;
    lng: number;
    currentFloors: number;
    proposedExtraFloors?: number;
    lotAreaSqMeters?: number;
    currentImplantationAreaSqMeters?: number;
}
