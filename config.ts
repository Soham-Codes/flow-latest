// config.ts

// --- IMPORTANT ---
// This file is for your local API keys.
// 1. Fill in your actual API keys in the placeholders below.
// 2. DO NOT commit this file to public version control (e.g., add it to your .gitignore).

/**
 * Your Google Gemini API Key.
 * Get yours from Google AI Studio.
 */
export const GEMINI_API_KEY: string = "AIzaSyATr0wA5k99oWYUL0Ifu6BDZiEMS0plMOw";

/**
 * Your Google Maps Platform API Key.
 * Get yours from the Google Cloud Console. Make sure the "Maps JavaScript API"
 * and "Maps Visualization Library" are enabled for your key.
 */
// Prefer Vite-provided env var (VITE_GOOGLE_MAPS_API_KEY). Fall back to the
// value in .env.local for convenience during local development.
export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  "AIzaSyCRGNQgexiMHTn3LNHn2OJGd574aqU_Dik";
