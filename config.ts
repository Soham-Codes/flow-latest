// config.ts

// --- SECURITY WARNING ---
// API keys should NEVER be hardcoded or committed to version control.
// This file reads keys from environment variables set in .env.local (not committed).
//
// IMPORTANT: For production, the Gemini API key should be used server-side only.
// Exposing API keys in client-side code (browser) is a security risk.
// Consider moving Gemini API calls to a backend service/serverless function.

/**
 * Your Google Gemini API Key.
 * Get yours from Google AI Studio: https://aistudio.google.com/apikey
 * 
 * Set this in your .env.local file as: VITE_GEMINI_API_KEY=your_key_here
 * 
 * WARNING: This key is exposed in the browser bundle. For production,
 * move Gemini API calls to a server-side function to protect your key.
 */
export const GEMINI_API_KEY: string = 
  (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

/**
 * Your Google Maps Platform API Key.
 * Get yours from the Google Cloud Console: https://console.cloud.google.com/
 * Make sure the "Maps JavaScript API" and "Maps Visualization Library" are enabled.
 * 
 * Set this in your .env.local file as: VITE_GOOGLE_MAPS_API_KEY=your_key_here
 * 
 * Restrict this key by HTTP referrer (domain) in the Google Cloud Console.
 */
export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
