
import { useState, useCallback } from 'react';
import { PredictionResult } from '../types';
import { fetchBusynessPrediction } from '../services/geminiService';

interface UseBusynessPrediction {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  getPrediction: (location: string, day: string, time: string) => Promise<void>;
}

// Custom hook to handle the logic for fetching and managing busyness prediction state.
export const useBusynessPrediction = (): UseBusynessPrediction => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (location: string, day: string, time: string) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const result = await fetchBusynessPrediction(location, day, time);
      setPrediction(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to get prediction: ${err.message}`);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { prediction, isLoading, error, getPrediction };
};
