import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <img 
      src="/dd-logo.png" 
      alt="DD Cars" 
      className={`${className} transition-transform duration-300 hover:scale-110`}
      style={{ 
        maxHeight: '48px', 
        width: 'auto',
        objectFit: 'contain'
      }}
    />
  );
}