import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div 
        className="text-4xl font-bold leading-none"
        style={{ 
          color: '#d4af37',
          fontFamily: 'serif',
          letterSpacing: '-0.05em'
        }}
      >
        DD
      </div>
      <div 
        className="text-xs font-normal uppercase tracking-widest mt-1"
        style={{ 
          color: '#d4af37',
          fontFamily: 'serif',
          letterSpacing: '0.3em'
        }}
      >
        CARS
      </div>
    </div>
  );
}