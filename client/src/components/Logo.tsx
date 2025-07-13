import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <img 
      src="/assets/dd-cars-logo-exact.png" 
      alt="DD Cars Logo" 
      className={`${className} w-auto`}
    />
  );
}