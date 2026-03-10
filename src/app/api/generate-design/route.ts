import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { municipality, zone, prompt, intent, allowedModifications, feasibilityMath } = body;

        if (!municipality || !zone || (!prompt && !feasibilityMath)) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Combine the user's core intent with the rigid Feasibility Engine mathematics
        let unbuiltContext = '';
        if (feasibilityMath && feasibilityMath.unbuiltFootprintSqMeters > 0) {
            unbuiltContext = `\nMANDATORY STRUCTURAL LIMIT: The proposed expansion MUST utilize exactly ${feasibilityMath.unbuiltFootprintSqMeters}m² of unbuilt ground footprint. Total construction mass cannot exceed ${feasibilityMath.maxTotalConstructionSqMeters}m².\n`;
        }

        const strictPrompt = `
ARCHITECTURAL RENDER INSTRUCTION:
Location: ${zone}, ${municipality}, Portugal.
Request: "${prompt || 'Maximize permitted yield on this lot.'}"
${unbuiltContext}
LEGAL CONSTRAINTS TO STRICTLY ENFORCE:
${allowedModifications?.join('\n') || 'Must conform to local style.'}

Aesthetic: Ultra-realistic, 8k resolution, modern Portuguese architecture, highly professional developer pitch visualization.
        `;

        // Here we would call the Gemini "Nano Banana" image generation API.
        // For the MVP frontend, we return a high-quality placeholder that matches the theme
        // until billing is enabled for the image model.

        let mockImageUrl = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'; // Default Vivenda
        if (intent?.action === 'subdivide_lot') {
            mockImageUrl = 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef'; // Two modern houses
        } else if (intent?.action === 'add_floors') {
            mockImageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'; // Apartment building
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        return NextResponse.json({
            success: true,
            imageUrl: mockImageUrl,
            promptUsed: strictPrompt
        });

    } catch (error: any) {
        console.error('Error in design generation:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
