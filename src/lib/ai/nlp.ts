import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedUserIntent } from '../legislation/types';

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function parseUserIntent(prompt: string): Promise<ParsedUserIntent> {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Using fallback bare-bones parsing.");
        return fallbackParsing(prompt);
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Fast structured output
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemInstruction = `
You are an expert Portuguese architectural and permitting assistant. Your job is to extract structured intent from a user's freeform text request regarding property modifications.
Allowed actions: "add_floors", "subdivide_lot", "build_annex", "change_usage", "build_wall", "exterior_modification", "unknown".
Map the Portuguese or English text to these structured fields.
Example 1: "Quero fazer um destaque e construir 2 casas" -> { action: "subdivide_lot", subdivisionUnits: 2, description: "Subdivide lot into 2 units" }
Example 2: "Fazer um prédio de 5 andares" -> { action: "add_floors", targetFloors: 5, description: "Transform into 5-story building" }
Example 3: "Fazer um muro alto de 2 metros à frente" -> { action: "build_wall", wallHeight: 2, description: "Build 2m high front wall" }
Example 4: "Mudar para comércio" -> { action: "change_usage", targetUsage: "Commercial", description: "Change usage to commercial" }
`;

        const result = await model.generateContent([
            systemInstruction,
            `User prompt: "${prompt}"`
        ]);

        const jsonText = result.response.text();
        const parsed = JSON.parse(jsonText);

        return {
            action: parsed.action || 'unknown',
            targetFloors: parsed.targetFloors,
            subdivisionUnits: parsed.subdivisionUnits,
            annexArea: parsed.annexArea,
            targetUsage: parsed.targetUsage,
            wallHeight: parsed.wallHeight,
            description: parsed.description || prompt
        };
    } catch (error) {
        console.error("AI Pattern matching failed:", error);
        return fallbackParsing(prompt);
    }
}

function fallbackParsing(prompt: string): ParsedUserIntent {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('andar') || lowerPrompt.includes('floor')) {
        const match = lowerPrompt.match(/(\d+)\s*(andar|floor)/);
        return {
            action: 'add_floors',
            targetFloors: match ? parseInt(match[1]) : 2,
            description: prompt
        };
    }

    if (lowerPrompt.includes('destaque') || lowerPrompt.includes('divid') || lowerPrompt.includes('subdiv')) {
        return {
            action: 'subdivide_lot',
            subdivisionUnits: 2,
            description: prompt
        };
    }

    return {
        action: 'unknown',
        description: prompt
    };
}
