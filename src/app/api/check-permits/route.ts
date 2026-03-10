import { NextResponse } from 'next/server';
import { evaluatePropertyConstraints } from '@/lib/legislation/engine';
import { ConstraintCheckRequest } from '@/lib/legislation/types';

export async function POST(req: Request) {
    try {
        const body: ConstraintCheckRequest = await req.json();

        // Basic validation
        if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
            return NextResponse.json(
                { error: 'Invalid coordinates provided' },
                { status: 400 }
            );
        }

        if (typeof body.currentFloors !== 'number') {
            body.currentFloors = 1; // Default assumption if not provided
        }

        // Evaluate against mock local legislation data
        const evaluation = evaluatePropertyConstraints(body);

        return NextResponse.json({
            success: true,
            data: evaluation
        });

    } catch (error: any) {
        console.error('Error evaluating property constraints:', error);
        return NextResponse.json(
            { error: 'Failed to evaluate property constraints.' },
            { status: 500 }
        );
    }
}
