import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { municipality, zone, prompt, intent, allowedModifications } = body;

        if (!municipality || !zone || !prompt) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Combine the user's core intent with the legal constraints
        const strictPrompt = `
USER REQUEST: "${prompt}"
LEGAL CONSTRAINTS TO ENFORCE in ${zone}, ${municipality}:
${allowedModifications?.join('\n') || 'Must conform to local style.'}

ARCHITECTURAL STYLE: Modern Portuguese, highly realistic.
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
