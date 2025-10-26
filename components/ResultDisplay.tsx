import React from 'react';
import { PredictionResult } from '../types';
import LoadingSpinner from './LoadingSpinner';
import Gauge from './Gauge';

interface ResultDisplayProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
}

// Displays the prediction result, a loading indicator, an error message, or an initial state message.
const ResultDisplay: React.FC<ResultDisplayProps> = ({ prediction, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-400">AI is analyzing the time and place...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 bg-red-900/50 border border-red-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">An Error Occurred</h3>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (prediction) {
      return (
        <div className="flex flex-col items-center text-center space-y-6 w-full">
          {!prediction.isOpen && (
            <div className="w-full max-w-md mx-auto flex items-center space-x-3 text-left bg-orange-900/50 border border-orange-700 rounded-lg p-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-orange-300">Might Be Closed</h3>
                <p className="text-sm text-orange-400">{prediction.statusReason}</p>
              </div>
            </div>
          )}

          <Gauge value={prediction.busynessLevel} />
          <div className="w-full">
            <h2 className="text-2xl font-bold text-white">{prediction.description}</h2>
            <p className="mt-2 text-gray-300 max-w-md mx-auto">{prediction.rationale}</p>
          </div>

          {prediction.alternativeSuggestions && prediction.alternativeSuggestions.length > 0 && (
            <div className="w-full max-w-md mx-auto border-t border-gray-700 pt-6 mt-4">
              <h3 className="text-xl font-semibold text-white mb-4">Quieter Alternatives Nearby</h3>
              <ul className="space-y-4 text-left">
                {prediction.alternativeSuggestions.map((suggestion, index) => (
                  <li key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-100">{suggestion.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{suggestion.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center text-gray-500">
        <p>Enter a location to estimate its busyness.</p>
      </div>
    );
  };

  return (
    <div className="w-full mt-8 md:mt-12 p-6 min-h-[250px] flex items-center justify-center">
      {renderContent()}
    </div>
  );
};

export default ResultDisplay;