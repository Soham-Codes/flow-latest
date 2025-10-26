import React, { useState, useCallback } from 'react';
import { useBusynessPrediction } from './hooks/useBusynessPrediction';
import Header from './components/Header';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';
import Heatmap from './components/Heatmap';
import { DAYS, TIMES } from './constants';

type Tab = 'predictor' | 'heatmap';

const App: React.FC = () => {
  const [location, setLocation] = useState<string>('');
  const [day, setDay] = useState<string>(DAYS[0]);
  const [time, setTime] = useState<string>(TIMES[12]); // Default to 12:00 PM
  const [activeTab, setActiveTab] = useState<Tab>('predictor');

  const { prediction, isLoading, error, getPrediction } = useBusynessPrediction();

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!location.trim()) return;
    getPrediction(location, day, time);
  }, [location, day, time, getPrediction]);

  const isButtonDisabled = isLoading || !location.trim();

  // --- Tab Styling ---
  const tabBaseClasses = "px-8 py-3 text-lg font-medium rounded-full transition-all duration-300 border backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50";
  const activeTabClasses = "bg-white/20 text-white border-white/50 shadow-lg shadow-white/10";
  const inactiveTabClasses = "bg-white/10 text-gray-400 border-white/20 hover:bg-white/20 hover:text-white";

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-between font-sans p-4">
      <Header />

      <main className="w-full max-w-2xl mx-auto flex flex-col items-center flex-grow">
        <div className="w-full flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('predictor')}
            className={`${tabBaseClasses} ${activeTab === 'predictor' ? activeTabClasses : inactiveTabClasses}`}
          >
            Predictor
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`${tabBaseClasses} ${activeTab === 'heatmap' ? activeTabClasses : inactiveTabClasses}`}
          >
            Heatmap
          </button>
        </div>

        {activeTab === 'predictor' && (
          <>
            <div className="w-full bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 'Eiffel Tower' or 'Central Park Cafe'"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="day" className="block text-sm font-medium text-gray-400 mb-2">
                      Day of the Week
                    </label>
                    <select
                      id="day"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors appearance-none"
                    >
                      {DAYS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-400 mb-2">
                      Time of Day
                    </label>
                    <select
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors appearance-none"
                    >
                      {TIMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  className={`w-full py-3 px-4 rounded-md font-semibold text-center transition-all duration-300 ease-in-out
                    ${isButtonDisabled
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200 transform hover:scale-105'
                    }`}
                >
                  {isLoading ? 'Estimating...' : 'Estimate Busyness'}
                </button>
              </form>
            </div>
            <ResultDisplay prediction={prediction} isLoading={isLoading} error={error} />
          </>
        )}
        
        {activeTab === 'heatmap' && (
            <div className="w-full">
                <Heatmap />
            </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default App;
