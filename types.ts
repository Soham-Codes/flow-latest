// types.ts

/**
 * Represents a single alternative suggestion.
 */
export interface AlternativeSuggestion {
  name: string;
  reason: string;
}

/**
 * Represents the structured response from the Gemini API for a busyness prediction.
 */
export interface PredictionResult {
  /**
   * The estimated busyness level as a percentage (0-100).
   */
  busynessLevel: number;
  /**
   * A short, human-readable description of the busyness level (e.g., "Not busy", "Moderately busy").
   */
  description: string;
  /**
   * An explanation or rationale for the prediction provided by the AI model.
   */
  rationale: string;
  /**
   * A boolean indicating if the location is likely to be open.
   */
  isOpen: boolean;
  /**
   * A brief reason for the open/closed status.
   */
  statusReason: string;
  /**
   * An optional list of alternative places to go if the location is busy.
   */
  alternativeSuggestions?: AlternativeSuggestion[];
}