/**
 * Gemini Proxy - Server-side API endpoint
 * 
 * This serverless function acts as a proxy between the client and Google's Gemini API.
 * It protects the API key by keeping it server-side and provides basic rate limiting.
 * 
 * Environment Variables Required:
 * - GEMINI_API_KEY: Your Google Gemini API key (server-side only)
 * 
 * Usage:
 * POST /api/gemini-proxy
 * Body: { prompt: string, model?: string }
 * 
 * This is a basic example implementation. For production, consider adding:
 * - More robust rate limiting (e.g., using Redis)
 * - Request authentication/authorization
 * - More comprehensive input validation
 * - Logging and monitoring
 */

import { GoogleGenAI, Type } from "@google/genai";

// Simple in-memory rate limiting (resets on function restart)
// For production, use a persistent store like Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Input validation limits
const MAX_PROMPT_LENGTH = 5000;
const ALLOWED_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

interface GeminiProxyRequest {
  prompt: string;
  model?: string;
  responseSchema?: any;
}

interface RateLimitInfo {
  limited: boolean;
  retryAfter?: number;
}

/**
 * Check rate limit for a given IP address
 */
function checkRateLimit(ip: string): RateLimitInfo {
  const now = Date.now();
  const limitInfo = rateLimitMap.get(ip);

  if (!limitInfo || now > limitInfo.resetTime) {
    // Reset or create new limit window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  if (limitInfo.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      limited: true,
      retryAfter: Math.ceil((limitInfo.resetTime - now) / 1000),
    };
  }

  limitInfo.count++;
  return { limited: false };
}

/**
 * Serverless function handler
 * Compatible with Vercel, Netlify, and similar platforms
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get client IP for rate limiting
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  // Check rate limit
  const rateLimitCheck = checkRateLimit(clientIp);
  if (rateLimitCheck.limited) {
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: rateLimitCheck.retryAfter,
    });
  }

  // Validate API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not set");
    return res.status(500).json({
      error: "Server configuration error",
    });
  }

  try {
    // Parse and validate request body
    const body: GeminiProxyRequest = req.body;

    if (!body.prompt || typeof body.prompt !== "string") {
      return res.status(400).json({ error: "Invalid or missing prompt" });
    }

    if (body.prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters.`,
      });
    }

    const model = body.model || "gemini-2.5-flash";
    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({
        error: `Invalid model. Allowed models: ${ALLOWED_MODELS.join(", ")}`,
      });
    }

    // Initialize Gemini AI client (server-side only)
    const ai = new GoogleGenAI({ apiKey });

    // Make request to Gemini API
    const requestConfig: any = {
      model,
      contents: body.prompt,
    };

    // Add response schema if provided
    if (body.responseSchema) {
      requestConfig.config = {
        responseMimeType: "application/json",
        responseSchema: body.responseSchema,
      };
    }

    const response = await ai.models.generateContent(requestConfig);

    // Return successful response
    return res.status(200).json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    // Return appropriate error response
    const statusCode = error.status || 500;
    const errorMessage =
      error.message || "An error occurred while processing your request";

    return res.status(statusCode).json({
      error: errorMessage,
    });
  }
}
