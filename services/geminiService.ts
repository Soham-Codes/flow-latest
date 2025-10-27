// ⚠️ IMPORTANT: This service now uses a server-side proxy ⚠️
// The Gemini API is called through /api/gemini-proxy to protect the API key.
// The API key is stored server-side as an environment variable (GEMINI_API_KEY).
// 
// DO NOT import GoogleGenAI or any server-side packages here - this runs in the browser.
// All Gemini API calls are now proxied through the backend.

import { Type } from "@google/genai";
import { PredictionResult } from '../types';

// Use environment variable for proxy endpoint URL (defaults to /api/gemini-proxy for local/serverless)
const GEMINI_PROXY_ENDPOINT: string = (import.meta.env.VITE_GEMINI_PROXY_ENDPOINT as string) || '/api/gemini-proxy';

/**
 * Fetches a busyness prediction from the Gemini API via the server-side proxy.
 * 
 * This function calls /api/gemini-proxy which handles the actual Gemini API call server-side.
 * The API key is protected and never exposed to the browser.
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

    // Define the response schema for structured output
    const responseSchema = {
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
    };

    // Call the server-side proxy endpoint
    const response = await fetch(GEMINI_PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'gemini-2.5-flash',
        responseSchema,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.text) {
      throw new Error('Invalid response from proxy server');
    }

    // Parse the JSON response from Gemini
    const result: PredictionResult = JSON.parse(data.text.trim());

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