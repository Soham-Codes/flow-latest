// src/env.d.ts
// Provide types for Vite's import.meta.env so TypeScript doesn't complain when
// accessing VITE_ prefixed environment variables used in the client code.

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly [key: string]: unknown;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
