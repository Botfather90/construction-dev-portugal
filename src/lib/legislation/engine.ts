import { ConstraintCheckRequest, ConstraintCheckResult, PDMRules, Municipality, ZoneClassification } from './types';
import { pdmDatabase, getMunicipalityAndZone } from './mockDB';

/**
 * Core engine to evaluate property constraints based on location and PDM rules.
 */
export function evaluatePropertyConstraints(request: ConstraintCheckRequest): ConstraintCheckResult {
    const { lat, lng, currentFloors, proposedExtraFloors = 0 } = request;

    // 1. Identify Municipality and Zone (Simulated GIS lookup)
    const locationInfo = getMunicipalityAndZone(lat, lng);

    if (!locationInfo) {
        // If outside our mock coverage area, return a generic restrictive response
        return {
            isLegal: false,
            municipality: 'Lisboa', // Default fallback
            zone: 'Urban Consolidated',
            allowedModifications: [],
            restrictions: ['Property outside mapped area. Please consult local Camara Municipal manually.'],
            maxAdditionalFloors: 0,
            requiredPermits: ['Full Architectural Project', 'Special Locality Permit'],
            confidenceScore: 0.1
        };
    }

    const { municipality, zone } = locationInfo;

    // 2. Fetch specific PDM rules for this zone
    const municipalityRules = pdmDatabase[municipality as string] || [];
    const rules = municipalityRules.find(r => r.zone === zone);

    if (!rules) {
        return {
            isLegal: false,
            municipality: municipality as Municipality,
            zone: zone as ZoneClassification,
            allowedModifications: [],
            restrictions: ['No explicit rules found for this zone. Assuming strict no-build.'],
            maxAdditionalFloors: 0,
            requiredPermits: [],
            confidenceScore: 0.5
        };
    }

    // 3. Evaluate Constraints
    const totalProposedFloors = currentFloors + proposedExtraFloors;
    const maxAllowedFloors = rules.maxFloors;
    const maxAdditionalFloors = Math.max(0, maxAllowedFloors - currentFloors);

    const isTargetLegal = totalProposedFloors <= maxAllowedFloors;

    const allowedModifications: string[] = [];
    const restrictions: string[] = [...rules.notes];
    const requiredPermits: string[] = [];

    if (rules.requiresArchitecturalApproval) {
        requiredPermits.push('Licenciamento Camarário (Arch. Approval)');
    }

    if (maxAdditionalFloors > 0) {
        allowedModifications.push(`You can legally add up to ${maxAdditionalFloors} floor(s).`);
        allowedModifications.push(`Maximum allowed height for the building is ${rules.maxHeightMeters} meters.`);
    }

    if (!isTargetLegal && proposedExtraFloors > 0) {
        restrictions.push(`Proposed addition of ${proposedExtraFloors} floor(s) exceeds the zone limit of ${maxAllowedFloors} total floors.`);
    }

    if (rules.maxImplantationPercentage) {
        restrictions.push(`Building footprint cannot exceed ${rules.maxImplantationPercentage}% of the lot area.`);
    }

    if (rules.allowsUsageChange) {
        allowedModifications.push('Change of use (e.g., commercial to residential) is permitted under specific conditions.');
    }

    return {
        isLegal: isTargetLegal,
        municipality: municipality as Municipality,
        zone: zone as ZoneClassification,
        allowedModifications,
        restrictions,
        maxAdditionalFloors,
        requiredPermits,
        confidenceScore: 0.85 // High confidence since it's a direct mock hit, but not 1.0 to account for real-world nuances
    };
}
