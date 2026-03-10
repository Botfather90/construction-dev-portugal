import { PDMRules, Municipality } from './types';

// Mock database simulating structured PDM data for select municipalities
export const pdmDatabase: Record<string, PDMRules[]> = {
    Cascais: [
        {
            municipality: 'Cascais',
            zone: 'Urban Consolidated',
            maxFloors: 3,
            maxHeightMeters: 10.5,
            maxImplantationPercentage: 40,
            maxConstructionIndex: 0.8,
            allowsSubdivision: true,
            minLotSizeSqMetersAfterSubdivision: 300,
            allowsUsageChange: true,
            allowedUses: ['Residential', 'Commercial', 'Services'],
            allowsAnnexes: true,
            maxAnnexAreaSqMeters: 30,
            maxBoundaryWallHeightMeters: 1.8,
            requiresArchitecturalApproval: true,
            notes: ['Must maintain existing architectural style of the street.', 'Setback from street must be at least 3 meters.']
        },
        {
            municipality: 'Cascais',
            zone: 'Historical Center',
            maxFloors: 2,
            maxHeightMeters: 7.5,
            maxImplantationPercentage: 80,
            maxConstructionIndex: 1.2,
            allowsSubdivision: false,
            allowsUsageChange: false,
            allowedUses: ['Residential', 'Commercial'],
            allowsAnnexes: false,
            maxBoundaryWallHeightMeters: 2.0,
            requiresArchitecturalApproval: true,
            notes: ['Strict preservation rules apply.', 'No new exterior windows allowed without special heritage permit.', 'Roof tiles must match original color.']
        },
        {
            municipality: 'Cascais',
            zone: 'Protected Natural Area',
            maxFloors: 1,
            maxHeightMeters: 4.5,
            maxImplantationPercentage: 10,
            maxConstructionIndex: 0.1,
            allowsSubdivision: false,
            allowsUsageChange: false,
            allowedUses: ['Residential', 'Rural/Agricultural'],
            allowsAnnexes: true,
            maxAnnexAreaSqMeters: 15, // Only small wooden tool sheds
            maxBoundaryWallHeightMeters: 1.2,
            requiresArchitecturalApproval: true,
            notes: ['Construction only allowed if replacing existing ruin.', 'Strict environmental impact study required.']
        }
    ],
    Oeiras: [
        {
            municipality: 'Oeiras',
            zone: 'Urban Consolidated',
            maxFloors: 4,
            maxHeightMeters: 13.5,
            maxImplantationPercentage: 50,
            maxConstructionIndex: 1.0,
            allowsSubdivision: true,
            minLotSizeSqMetersAfterSubdivision: 250,
            allowsUsageChange: true,
            allowedUses: ['Residential', 'Commercial', 'Services'],
            allowsAnnexes: true,
            maxAnnexAreaSqMeters: 40,
            maxBoundaryWallHeightMeters: 2.0,
            requiresArchitecturalApproval: true,
            notes: ['Parking provision mandatory for new residential units.']
        },
        {
            municipality: 'Oeiras',
            zone: 'Urban Expansion',
            maxFloors: 5,
            maxHeightMeters: 16.5,
            maxImplantationPercentage: 60,
            maxConstructionIndex: 1.5,
            allowsSubdivision: true,
            minLotSizeSqMetersAfterSubdivision: 200,
            allowsUsageChange: true,
            allowedUses: ['Residential', 'Commercial', 'Services', 'Tourism'],
            allowsAnnexes: true,
            maxAnnexAreaSqMeters: 50,
            maxBoundaryWallHeightMeters: 2.0,
            requiresArchitecturalApproval: true,
            notes: ['Subject to detailed urbanization plan approval.']
        }
    ]
};

// Extremely simplified mock function to simulate GIS point-in-polygon lookup
// In reality, this would query a PostGIS database with actual PDM zoning shapefiles
export function getMunicipalityAndZone(lat: number, lng: number): { municipality: Municipality, zone: string } | null {
    // Rough bounding box for Cascais
    if (lat > 38.68 && lat < 38.76 && lng > -9.49 && lng < -9.32) {
        // Fake logic: if closer to coast, Historical Center, else Urban Consolidated
        if (lat < 38.70 && lng < -9.42) {
            return { municipality: 'Cascais', zone: 'Historical Center' };
        }
        // Fake logic for Protected Area (e.g., Sintra-Cascais Natural Park edge)
        if (lat > 38.73 && lng < -9.45) {
            return { municipality: 'Cascais', zone: 'Protected Natural Area' };
        }
        return { municipality: 'Cascais', zone: 'Urban Consolidated' };
    }

    // Rough bounding box for Oeiras
    if (lat > 38.68 && lat < 38.74 && lng >= -9.32 && lng < -9.22) {
        if (lat > 38.72) {
            return { municipality: 'Oeiras', zone: 'Urban Expansion' };
        }
        return { municipality: 'Oeiras', zone: 'Urban Consolidated' };
    }

    // Default fallback for demo purposes
    return null;
}
