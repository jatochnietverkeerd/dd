import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <img 
      src="/assets/dd-cars-logo-final.svg" 
      alt="DD Cars Logo" 
      className={`${className} w-auto`}
    />
  );
}