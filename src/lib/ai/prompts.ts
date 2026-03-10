import { Municipality, ZoneClassification } from '../legislation/types';

interface GenerationContext {
    municipality: Municipality;
    zone: ZoneClassification;
    baseArchitecturalStyle?: string;
    proposedFloorsAdded: number;
}

export function buildArchitecturalPrompt(context: GenerationContext): string {
    const { municipality, zone, baseArchitecturalStyle = 'modern Portuguese residential', proposedFloorsAdded } = context;

    const basePrompt = `An architectural visualization of a residential building in ${municipality}, Portugal.`;

    let zoneContext = '';
    if (zone === 'Historical Center') {
        zoneContext = 'The building is located in a historical center. It must use traditional Portuguese architecture: terracotta roof tiles, white walls, and potentially small azulejo (tile) details, maintaining the historic charm of the street.';
    } else if (zone === 'Protected Natural Area') {
        zoneContext = 'The building is in a protected natural area. It must blend harmoniously with nature, using sustainable materials, wood accents, and earthy tones with minimal environmental impact.';
    } else {
        zoneContext = `The building is in an ${zone.toLowerCase()} zone, featuring a blend of ${baseArchitecturalStyle} design.`;
    }

    const modificationContext = `The image must show the building with exactly ${proposedFloorsAdded} additional floor(s) added clearly to the existing structure.`;

    const cameraAndLighting = 'The image should be a highly realistic, 4k resolution daytime rendering from a street-level perspective. Clear blue sky, soft natural sunlight, photorealistic.';

    return `${basePrompt} ${zoneContext} ${modificationContext} ${cameraAndLighting}`;
}
