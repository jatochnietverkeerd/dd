import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <div className={`${className} flex flex-col items-center justify-center text-center`}>
      <div 
        style={{
          fontFamily: 'Times, serif',
          fontSize: '2.8rem',
          fontWeight: 'bold',
          lineHeight: '1',
          color: '#C5B358'
        }}
      >
        DD
      </div>
      <div 
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.4em',
          color: '#C5B358',
          marginTop: '2px'
        }}
      >
        CARS
      </div>
    </div>
  );
}