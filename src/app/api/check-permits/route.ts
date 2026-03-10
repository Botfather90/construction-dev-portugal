import { NextRequest, NextResponse } from 'next/server';
import { evaluatePropertyConstraints } from '@/lib/legislation/engine';
import { ConstraintCheckRequest } from '@/lib/legislation/types';
import { parseUserIntent } from '@/lib/ai/nlp';

export async function POST(request: NextRequest) {
    try {
        const body: ConstraintCheckRequest = await request.json();

        // Validate basic request shape
        if (!body.lat || !body.lng || (!body.prompt && !body.isMaximizeYield)) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters (lat, lng, and either prompt or isMaximizeYield)' },
                { status: 400 }
            );
        }

        // 1. NLP Parse: Convert Portuguese text into structured architectural intent ONLY if not maximizing ROI
        let parsedIntent;
        if (!body.isMaximizeYield && body.prompt) {
            parsedIntent = await parseUserIntent(body.prompt);
        }

        // 2. Evaluate specific legal constraints against that intent or the ROI math request
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
