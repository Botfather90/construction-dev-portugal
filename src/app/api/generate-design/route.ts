import { NextResponse } from 'next/server';
import { buildArchitecturalPrompt } from '@/lib/ai/prompts';
import { Municipality, ZoneClassification } from '@/lib/legislation/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { municipality, zone, proposedFloorsAdded, baseArchitecturalStyle } = body;

        if (!municipality || !zone || proposedFloorsAdded === undefined) {
            return NextResponse.json(
                { error: 'Missing required parameters for AI generation.' },
                { status: 400 }
            );
        }

        // 1. Generate the highly specific prompt
        const prompt = buildArchitecturalPrompt({
            municipality: municipality as Municipality,
            zone: zone as ZoneClassification,
            proposedFloorsAdded: Number(proposedFloorsAdded),
            baseArchitecturalStyle
        });

        console.log('Generated AI Prompt:', prompt);

        // 2. Call AI Image Generation API 
        // TODO: Integrate actual provider (e.g., OpenAI DALL-E 3, Midjourney, Gemini)
        // For now, we simulate a successful generation with a placeholder image 
        // to unblock the frontend UI development.

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated response
        const mockImageUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'; // Placeholder of a nice house

        return NextResponse.json({
            success: true,
            promptUsed: prompt,
            imageUrl: mockImageUrl
        });

    } catch (error: any) {
        console.error('Error generating design:', error);
        return NextResponse.json(
            { error: 'Failed to generate architectural design.' },
            { status: 500 }
        );
    }
}
