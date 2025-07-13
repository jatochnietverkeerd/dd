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
          fontFamily: 'Cormorant Garamond, serif',
          color: '#d4af37'
        }}
      >
        <div 
          className="font-bold leading-none"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1
          }}
        >
          DD
        </div>
        <div 
          className="uppercase mt-1"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.6em',
            marginLeft: '0.6em',
            fontWeight: 400
          }}
        >
          CARS
        </div>
      </div>
    </div>
  );
}