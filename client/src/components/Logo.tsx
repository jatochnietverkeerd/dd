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
      <style>
        {`.logo-text {
          font-family: serif;
          font-size: 50px;
          fill: #C5B358;
          text-anchor: middle;
        }
        .tagline-text {
          font-family: sans-serif;
          font-size: 18px;
          fill: #C5B358;
          text-anchor: middle;
          letter-spacing: 6px;
        }`}
      </style>
      <text x="100" y="55" className="logo-text">DD</text>
      <text x="100" y="80" className="tagline-text">CARS</text>
    </svg>
  );
}