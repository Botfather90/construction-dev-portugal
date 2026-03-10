import { NextRequest, NextResponse } from 'next/server';
import { evaluatePropertyConstraints } from '@/lib/legislation/engine';
import { ConstraintCheckRequest } from '@/lib/legislation/types';
import { parseUserIntent } from '@/lib/ai/nlp';

export async function POST(request: NextRequest) {
    try {
        const body: ConstraintCheckRequest = await request.json();

        // Validate basic request shape
        if (!body.lat || !body.lng || !body.prompt) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters (lat, lng, or prompt)' },
                { status: 400 }
            );
        }

        // 1. NLP Parse: Convert Portuguese text into structured architectural intent
        const parsedIntent = await parseUserIntent(body.prompt);

        // 2. Evaluate specific legal constraints against that parsed intent
        const evaluationResult = evaluatePropertyConstraints(body, parsedIntent);

        return NextResponse.json({
            success: true,
            data: evaluationResult
        });

    } catch (error: any) {
        console.error('Error evaluating permits:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
