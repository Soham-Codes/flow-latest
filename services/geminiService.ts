import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResult } from '../types';
import { GEMINI_API_KEY } from '../config';

// The API key is now imported from the config file for local development.
if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
  console.warn("Gemini API key is missing. Please add it to config.ts");
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Fetches a busyness prediction from the Gemini API.
 * 
 * @param location - The name of the place.
 * @param day - The day of the week.
 * @param time - The time of day.
 * @returns A promise that resolves to a PredictionResult object.
 */
export const fetchBusynessPrediction = async (
  location: string,
  day: string,
  time: string
): Promise<PredictionResult> => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("Gemini API key not configured. Please check your config.ts file.");
  }

  try {
    const prompt = `
      Estimate the busyness of "${location}" on a typical ${day} at around ${time}.
      Also, determine if the location is likely to be open or closed at that specific day and time.
      Provide your answer in a JSON format.
      - The busyness level should be an integer between 0 (empty) and 100 (extremely busy).
      - Include a short, descriptive string for the busyness level.
      - Provide a brief rationale for your prediction.
      - Provide a boolean 'isOpen' indicating if the location is likely open.
      - Provide a brief 'statusReason' explaining the open/closed status (e.g., 'Standard operating hours', 'Likely closed after hours').
      - If the location is predicted to be 'moderately busy' or busier (busyness level >= 40), suggest 2-3 alternative quiet nearby places suitable for studying. For each suggestion, provide its name and a brief reason why it's a good alternative. If the location is not busy (busyness level < 40), this "alternativeSuggestions" field should be an empty array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            busynessLevel: {
              type: Type.INTEGER,
              description: "A percentage value from 0 to 100 representing how busy the location is."
            },
            description: {
              type: Type.STRING,
              description: "A short text description of the busyness level, like 'Not busy', 'Moderately busy', etc."
            },
            rationale: {
              type: Type.STRING,
              description: "A brief explanation for the predicted busyness level."
            },
            isOpen: {
              type: Type.BOOLEAN,
              description: "A boolean indicating if the location is likely open (true) or closed (false)."
            },
            statusReason: {
              type: Type.STRING,
              description: "A brief reason for the open/closed status."
            },
            alternativeSuggestions: {
              type: Type.ARRAY,
              description: "A list of alternative quiet nearby places for studying. Empty if the location is not busy.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The name of the alternative location." },
                  reason: { type: Type.STRING, description: "A brief reason why this is a good alternative." }
                },
                required: ["name", "reason"]
              }
            }
          },
          required: ["busynessLevel", "description", "rationale", "isOpen", "statusReason", "alternativeSuggestions"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result: PredictionResult = JSON.parse(jsonString);

    // Basic validation
    if (typeof result.busynessLevel !== 'number' || result.busynessLevel < 0 || result.busynessLevel > 100) {
        throw new Error("Invalid busynessLevel received from API.");
    }
     if (typeof result.description !== 'string' || typeof result.rationale !== 'string') {
        throw new Error("Invalid description or rationale received from API.");
    }
    if (typeof result.isOpen !== 'boolean' || typeof result.statusReason !== 'string') {
        throw new Error("Invalid open/closed status received from API.");
    }
    if (result.alternativeSuggestions && !Array.isArray(result.alternativeSuggestions)) {
        throw new Error("Invalid alternativeSuggestions format received from API.");
    }

    return result;

  } catch (error) {
    console.error("Error fetching busyness prediction:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while contacting the Gemini API.");
  }
};