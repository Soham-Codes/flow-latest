
import React from 'react';

interface GaugeProps {
  value: number; // A value between 0 and 100
}

// A component to render a semi-circular gauge for displaying percentage values.
const Gauge: React.FC<GaugeProps> = ({ value }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = -90 + (clampedValue / 100) * 180;
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  const x = cx + radius * Math.cos((angle * Math.PI) / 180);
  const y = cy + radius * Math.sin((angle * Math.PI) / 180);
  
  const largeArcFlag = clampedValue > 50 ? 1 : 0;

  const pathData = `M ${cx - radius},${cy} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x},${y}`;

  const getColor = (val: number): string => {
    if (val < 40) return '#22c55e'; // Green
    if (val < 75) return '#facc15'; // Yellow
    return '#ef4444'; // Red
  };
  
  const strokeColor = getColor(clampedValue);

  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      {/* Background Arc */}
      <path
        d={`M ${cx-radius},${cy} A ${radius},${radius} 0 0 1 ${cx+radius},${cy}`}
        fill="none"
        stroke="#374151" // gray-700
        strokeWidth="20"
        strokeLinecap="round"
      />
      {/* Foreground Arc */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="20"
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
      />
      {/* Text in the middle */}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="36"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        {clampedValue}%
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fill="#9CA3AF" // gray-400
      >
        Busy
      </text>
    </svg>
  );
};

export default Gauge;
