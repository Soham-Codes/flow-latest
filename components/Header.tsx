import React from 'react';

// Renders the main header for the application.
const Header: React.FC = () => {
  return (
    <header className="w-full text-center py-6 md:py-8">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
        Flow
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Predict Crowds & Find Your Spot
      </p>
    </header>
  );
};

export default Header;