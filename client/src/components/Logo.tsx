import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 100" 
      className={`${className}`}
      style={{ maxWidth: '120px', height: 'auto' }}
    >
      <text 
        x="100" 
        y="55" 
        textAnchor="middle"
        style={{
          fontFamily: 'serif',
          fontSize: '50px',
          fill: '#C5B358',
          fontWeight: 'bold'
        }}
      >
        DD
      </text>
      <text 
        x="100" 
        y="80" 
        textAnchor="middle"
        style={{
          fontFamily: 'sans-serif',
          fontSize: '18px',
          fill: '#C5B358',
          letterSpacing: '6px',
          fontWeight: 'normal'
        }}
      >
        CARS
      </text>
    </svg>
  );
}