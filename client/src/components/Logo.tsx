import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div 
        className="text-center"
        style={{
          color: '#C5B358'
        }}
      >
        <div 
          className="font-bold leading-none"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: 'serif'
          }}
        >
          DD
        </div>
        <div 
          className="uppercase mt-1"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.9em',
            marginLeft: '0.9em',
            fontWeight: 400,
            textTransform: 'uppercase'
          }}
        >
          CARS
        </div>
      </div>
    </div>
  );
}