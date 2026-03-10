import { ConstraintCheckRequest, ConstraintCheckResult, PDMRules, Municipality, ZoneClassification, ParsedUserIntent, FeasibilityMath, PermitType } from './types';
import { pdmDatabase, getMunicipalityAndZone } from './mockDB';

/**
 * Core engine to evaluate property constraints based on location and PDM rules + User Intent.
 */
export function evaluatePropertyConstraints(
    request: ConstraintCheckRequest,
    intent?: ParsedUserIntent
): ConstraintCheckResult {
    const { lat, lng, currentFloors = 1, lotAreaSqMeters = 500, currentImplantationAreaSqMeters = 100, isMaximizeYield = false } = request;

    // 1. Identify Municipality and Zone
    const locationInfo = getMunicipalityAndZone(lat, lng);

    if (!locationInfo) {
        return {
            isLegal: false,
            municipality: 'Lisboa', // Default fallback
            zone: 'Urban Consolidated',
            parsedIntent: intent,
            allowedModifications: [],
            restrictions: ['Property outside mapped area. Please consult local Camara Municipal manually.'],
            permitType: 'Pedido de Informação Prévia (PIP)',
            estimatedTimelineDays: 30,
            confidenceScore: 0.1
        };
    }

    const { municipality, zone } = locationInfo;
    const municipalityRules = pdmDatabase[municipality as string] || [];
    const rules = municipalityRules.find(r => r.zone === zone);

    if (!rules) {
        return {
            isLegal: false,
            municipality: municipality as Municipality,
            zone: zone as ZoneClassification,
            parsedIntent: intent,
            allowedModifications: [],
            restrictions: ['No explicit rules found for this zone. Assuming strict no-build.'],
            permitType: 'Licenciamento',
            estimatedTimelineDays: 365,
            confidenceScore: 0.5
        };
    }

    // 2. Compute Feasibility Math (ROI Calculation)
    const maxAllowedFootprintSqMeters = lotAreaSqMeters * (rules.maxImplantationPercentage / 100);
    const unbuiltFootprintSqMeters = Math.max(0, maxAllowedFootprintSqMeters - currentImplantationAreaSqMeters);
    const maxTotalConstructionSqMeters = lotAreaSqMeters * rules.maxConstructionIndex;

    const feasibilityMath: FeasibilityMath = {
        lotAreaSqMeters,
        currentImplantationAreaSqMeters,
        maxAllowedFootprintSqMeters,
        unbuiltFootprintSqMeters,
        maxTotalConstructionSqMeters
    };

    // 3. Evaluate Constraints based on ACTION
    let isLegal = true;
    const allowedModifications: string[] = [];
    const restrictions: string[] = [...rules.notes];

    // Defaults
    let permitType: PermitType = rules.requiresArchitecturalApproval ? 'Licenciamento' : 'Comunicação Prévia';
    let estimatedTimelineDays = permitType === 'Licenciamento' ? 180 : 20;

    const actionToEvaluate = isMaximizeYield ? 'maximize_yield' : (intent?.action || 'unknown');

    switch (actionToEvaluate) {
        case 'maximize_yield':
            allowedModifications.push(`MAXIMIZED YIELD: You can legally build ${unbuiltFootprintSqMeters}m² more on the ground.`);
            allowedModifications.push(`You can build up to ${rules.maxFloors} floors total (${rules.maxHeightMeters}m max height).`);
            allowedModifications.push(`Total construction volume cannot exceed ${maxTotalConstructionSqMeters}m².`);
            permitType = 'Licenciamento'; // Major expansions require full licensing
            estimatedTimelineDays = 240;
            break;

        case 'add_floors':
            const proposedTotal = currentFloors + (intent?.targetFloors || 1);
            if (proposedTotal > rules.maxFloors) {
                isLegal = false;
                restrictions.push(`Proposed total of ${proposedTotal} floors exceeds the zone limit of ${rules.maxFloors} floors.`);
            } else {
                allowedModifications.push(`You can legally build up to ${rules.maxFloors} total floors here.`);
                allowedModifications.push(`Maximum allowed height is ${rules.maxHeightMeters}m.`);
            }
            permitType = 'Licenciamento';
            estimatedTimelineDays = 180;
            break;

        case 'subdivide_lot':
            if (!rules.allowsSubdivision) {
                isLegal = false;
                restrictions.push(`Subdivision (Destaque de parcela) is strictly forbidden in ${rules.zone} zones.`);
            } else {
                const estNewLotSize = lotAreaSqMeters / (intent?.subdivisionUnits || 2);
                if (rules.minLotSizeSqMetersAfterSubdivision && estNewLotSize < rules.minLotSizeSqMetersAfterSubdivision) {
                    isLegal = false;
                    restrictions.push(`Estimated new lot size (${estNewLotSize.toFixed(0)}m²) is smaller than the minimum required ${rules.minLotSizeSqMetersAfterSubdivision}m².`);
                    restrictions.push(`You need a minimum original lot of ${(rules.minLotSizeSqMetersAfterSubdivision * (intent?.subdivisionUnits || 2))}m² to do this.`);
                } else {
                    allowedModifications.push(`Subdivision allowed into ${intent?.subdivisionUnits || 2} units.`);
                    permitType = 'Destaque de Parcela';
                    estimatedTimelineDays = 90;
                }
            }
            break;

        case 'build_annex':
            if (!rules.allowsAnnexes) {
                isLegal = false;
                restrictions.push(`Annexes are not allowed in this specific zone.`);
            } else {
                if (intent?.annexArea && rules.maxAnnexAreaSqMeters && intent.annexArea > rules.maxAnnexAreaSqMeters) {
                    isLegal = false;
                    restrictions.push(`Requested annex area (${intent.annexArea}m²) exceeds the maximum allowed ${rules.maxAnnexAreaSqMeters}m².`);
                } else {
                    allowedModifications.push(`Annex construction allowed up to ${rules.maxAnnexAreaSqMeters || 'a reasonable'}m².`);
                }
            }
            // Annexes can often be fast-tracked if small enough
            permitType = 'Comunicação Prévia';
            estimatedTimelineDays = 20;
            break;

        case 'build_wall':
            if (intent?.wallHeight && intent.wallHeight > rules.maxBoundaryWallHeightMeters) {
                isLegal = false;
                restrictions.push(`Boundary wall height of ${intent.wallHeight}m exceeds the maximum allowed ${rules.maxBoundaryWallHeightMeters}m.`);
            } else {
                allowedModifications.push(`You can build boundary walls up to ${rules.maxBoundaryWallHeightMeters}m high without a full license.`);
            }
            permitType = 'Isento'; // Walls often exempt if under certain heights, else Comunicação Prévia
            estimatedTimelineDays = 0;
            if (intent?.wallHeight && intent.wallHeight >= 1.5) {
                permitType = 'Comunicação Prévia';
                estimatedTimelineDays = 20;
            }
            break;

        case 'change_usage':
            if (!rules.allowsUsageChange) {
                isLegal = false;
                restrictions.push(`Change of usage is not permitted in ${rules.zone} zones.`);
            } else if (intent?.targetUsage && !rules.allowedUses.includes(intent.targetUsage as any)) {
                isLegal = false;
                restrictions.push(`The usage type "${intent.targetUsage}" is not allowed. Allowed types: ${rules.allowedUses.join(', ')}.`);
            } else {
                allowedModifications.push(`Change of usage to ${intent?.targetUsage || 'new type'} is permitted.`);
            }
            permitType = 'Licenciamento';
            estimatedTimelineDays = 120; // Usage changes involve safety/fire inspections
            break;

        default:
            // For unknown or general exterior modifications
            isLegal = true; // Assume conditionally legal pending arch review
            allowedModifications.push('Modifications must respect existing architectural styles.');
            restrictions.push('Complex custom modifications require specific architectural project approval.');
            permitType = 'Pedido de Informação Prévia (PIP)';
            estimatedTimelineDays = 30;
            break;
    }

    // General constraints that apply to everything
    if (rules.maxImplantationPercentage) {
        restrictions.push(`Building footprint cannot exceed ${rules.maxImplantationPercentage}% of the lot area.`);
    }

    return {
        isLegal,
        municipality: municipality as Municipality,
        zone: zone as ZoneClassification,
        parsedIntent: intent,
        feasibilityMath,
        permitType,
        estimatedTimelineDays,
        allowedModifications,
        restrictions,
        confidenceScore: 0.85
    };
}

