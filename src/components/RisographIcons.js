import React from 'react';

// Heart Icon
export const HeartIcon = ({ color = '#FF6B9D', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="heartGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M50 90C50 90 20 65 20 40C20 25 30 15 40 15C45 15 50 20 50 20C50 20 55 15 60 15C70 15 80 25 80 40C80 65 50 90 50 90Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      filter={glow ? "url(#heartGlow)" : ""}
    />
  </svg>
);

// Heart with Arrow Icon
export const HeartArrowIcon = ({ color = '#FF6B9D', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="arrowHeartGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M50 80C50 80 25 60 25 40C25 28 33 20 40 20C44 20 48 23 50 25C52 23 56 20 60 20C67 20 75 28 75 40C75 60 50 80 50 80Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      filter={glow ? "url(#arrowHeartGlow)" : ""}
    />
    <line x1="20" y1="70" x2="70" y2="20" stroke="#2D1B69" strokeWidth="3"/>
    <path d="M70 20L65 25L60 20L70 20Z" fill="#2D1B69"/>
  </svg>
);

// Radiating Heart Icon
export const RadiatingHeartIcon = ({ color = '#FFD93D', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="radiatingGlow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Rays */}
    <g stroke={color} strokeWidth="2" opacity="0.8">
      <line x1="50" y1="10" x2="50" y2="20"/>
      <line x1="75" y1="25" x2="70" y2="30"/>
      <line x1="80" y1="50" x2="70" y2="50"/>
      <line x1="75" y1="75" x2="70" y2="70"/>
      <line x1="50" y1="85" x2="50" y2="75"/>
      <line x1="25" y1="75" x2="30" y2="70"/>
      <line x1="20" y1="50" x2="30" y2="50"/>
      <line x1="25" y1="25" x2="30" y2="30"/>
    </g>
    <path 
      d="M50 70C50 70 30 55 30 40C30 32 35 27 40 27C43 27 46 29 50 32C54 29 57 27 60 27C65 27 70 32 70 40C70 55 50 70 50 70Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      filter={glow ? "url(#radiatingGlow)" : ""}
    />
  </svg>
);

// Bow Icon
export const BowIcon = ({ color = '#9C88FF', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="bowGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M20 40C20 40 30 30 40 40C45 45 45 50 50 50C55 50 55 45 60 40C70 30 80 40 80 40C80 40 70 60 60 60C55 60 50 55 50 50C50 55 45 60 40 60C30 60 20 40 20 40Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      filter={glow ? "url(#bowGlow)" : ""}
    />
    <circle cx="50" cy="50" r="5" fill="#2D1B69"/>
  </svg>
);

// Winged Heart Icon
export const WingedHeartIcon = ({ color = '#FFC4E1', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="wingedGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Left Wing */}
    <path 
      d="M30 45C20 40 10 45 10 45C10 45 15 55 25 55C30 55 35 50 35 45"
      fill="#C7CEEA"
      stroke="#2D1B69"
      strokeWidth="2"
      opacity="0.8"
    />
    {/* Right Wing */}
    <path 
      d="M70 45C80 40 90 45 90 45C90 45 85 55 75 55C70 55 65 50 65 45"
      fill="#C7CEEA"
      stroke="#2D1B69"
      strokeWidth="2"
      opacity="0.8"
    />
    {/* Heart */}
    <path 
      d="M50 75C50 75 30 60 30 45C30 37 35 32 40 32C43 32 46 34 50 37C54 34 57 32 60 32C65 32 70 37 70 45C70 60 50 75 50 75Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      filter={glow ? "url(#wingedGlow)" : ""}
    />
  </svg>
);

// Cupid Icon
export const CupidIcon = ({ color = '#FF8C69', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="cupidGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Wings */}
    <ellipse cx="35" cy="40" rx="8" ry="15" fill="#C7CEEA" stroke="#2D1B69" strokeWidth="2" opacity="0.8" transform="rotate(-30 35 40)"/>
    <ellipse cx="65" cy="40" rx="8" ry="15" fill="#C7CEEA" stroke="#2D1B69" strokeWidth="2" opacity="0.8" transform="rotate(30 65 40)"/>
    {/* Body */}
    <circle cx="50" cy="45" r="15" fill={color} stroke="#2D1B69" strokeWidth="3"/>
    {/* Head */}
    <circle cx="50" cy="25" r="10" fill="#FFC4E1" stroke="#2D1B69" strokeWidth="2"/>
    {/* Bow */}
    <path d="M20 50Q50 40,80 50" fill="none" stroke="#2D1B69" strokeWidth="2"/>
    {/* Arrow */}
    <line x1="50" y1="45" x2="70" y2="35" stroke="#2D1B69" strokeWidth="2"/>
    <path d="M68 37L70 35L72 37L70 32" fill="#2D1B69"/>
    <g filter={glow ? "url(#cupidGlow)" : ""}>
      <circle cx="50" cy="45" r="15" fill="none"/>
    </g>
  </svg>
);

// Sparkle Icon
export const SparkleIcon = ({ color = '#FFD93D', size = 16, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="sparkleGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M25 5L28 22L45 25L28 28L25 45L22 28L5 25L22 22L25 5Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="2"
      filter={glow ? "url(#sparkleGlow)" : ""}
    />
  </svg>
);

// Cloud with Heart Icon
export const CloudHeartIcon = ({ color = '#C7CEEA', size = 24, glow = true }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="cloudGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Cloud */}
    <path 
      d="M70 60C80 60 85 55 85 45C85 35 78 30 70 32C70 20 60 15 50 20C40 15 30 20 30 32C22 30 15 35 15 45C15 55 20 60 30 60H70Z" 
      fill={color}
      stroke="#2D1B69"
      strokeWidth="3"
      opacity="0.8"
      filter={glow ? "url(#cloudGlow)" : ""}
    />
    {/* Heart */}
    <path 
      d="M50 65C50 65 40 57 40 47C40 42 43 39 46 39C48 39 50 41 50 41C50 41 52 39 54 39C57 39 60 42 60 47C60 57 50 65 50 65Z" 
      fill="#FF6B9D"
      stroke="#2D1B69"
      strokeWidth="2"
    />
  </svg>
);
