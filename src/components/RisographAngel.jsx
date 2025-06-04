import React from 'react';

const RisographAngel = ({ className = '', size = 200 }) => {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 200 240"
      className={`risograph-angel ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Define gradients and filters for Risograph effect */}
      <defs>
        {/* Halftone pattern for texture */}
        <pattern id="halftone" patternUnits="userSpaceOnUse" width="4" height="4">
          <circle cx="2" cy="2" r="1" fill="var(--text-dark)" opacity="0.1" />
        </pattern>
        
        {/* Offset print effect filter */}
        <filter id="offset-print">
          <feMorphology operator="dilate" radius="0.5" />
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>

      {/* Wing layers with transparency */}
      <g className="wings" opacity="0.8">
        {/* Left wing - pink layer */}
        <path
          d="M 40 80 Q 10 60, 5 90 Q 0 120, 20 140 Q 40 150, 60 140 L 80 120 Z"
          fill="var(--riso-pink)"
          transform="translate(2, 2)"
          opacity="0.7"
        />
        {/* Left wing - teal overlay */}
        <path
          d="M 40 80 Q 10 60, 5 90 Q 0 120, 20 140 Q 40 150, 60 140 L 80 120 Z"
          fill="var(--riso-teal)"
          opacity="0.5"
        />
        
        {/* Right wing - pink layer */}
        <path
          d="M 160 80 Q 190 60, 195 90 Q 200 120, 180 140 Q 160 150, 140 140 L 120 120 Z"
          fill="var(--riso-pink)"
          transform="translate(-2, 2)"
          opacity="0.7"
        />
        {/* Right wing - teal overlay */}
        <path
          d="M 160 80 Q 190 60, 195 90 Q 200 120, 180 140 Q 160 150, 140 140 L 120 120 Z"
          fill="var(--riso-teal)"
          opacity="0.5"
        />
      </g>

      {/* Halo with layered effect */}
      <g className="halo">
        {/* Goldenrod base */}
        <ellipse
          cx="100"
          cy="40"
          rx="50"
          ry="15"
          fill="var(--riso-goldenrod)"
          opacity="0.6"
          transform="translate(2, -2)"
        />
        {/* Pink overlay */}
        <ellipse
          cx="100"
          cy="40"
          rx="50"
          ry="15"
          fill="var(--riso-pink)"
          opacity="0.3"
        />
      </g>

      {/* Body */}
      <g className="body">
        {/* Dress/robe shape */}
        <path
          d="M 70 140 Q 70 180, 80 200 L 120 200 Q 130 180, 130 140 Z"
          fill="var(--riso-indigo)"
          opacity="0.8"
          filter="url(#offset-print)"
        />
        {/* Body accent */}
        <path
          d="M 75 145 Q 75 175, 82 190 L 118 190 Q 125 175, 125 145 Z"
          fill="var(--bg-light)"
          opacity="0.6"
        />
      </g>

      {/* Head */}
      <g className="head">
        {/* Head base */}
        <circle
          cx="100"
          cy="80"
          r="30"
          fill="var(--riso-pink-light)"
          opacity="0.9"
        />
        {/* Face details */}
        <g className="face">
          {/* Eyes */}
          <circle cx="90" cy="75" r="2" fill="var(--text-dark)" />
          <circle cx="110" cy="75" r="2" fill="var(--text-dark)" />
          
          {/* Smile */}
          <path
            d="M 90 85 Q 100 90, 110 85"
            stroke="var(--text-dark)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Rosy cheeks */}
          <circle cx="80" cy="82" r="5" fill="var(--riso-pink)" opacity="0.3" />
          <circle cx="120" cy="82" r="5" fill="var(--riso-pink)" opacity="0.3" />
        </g>
      </g>

      {/* Arms holding heart */}
      <g className="arms">
        {/* Left arm */}
        <path
          d="M 80 120 Q 70 130, 75 145"
          stroke="var(--riso-pink-light)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right arm */}
        <path
          d="M 120 120 Q 130 130, 125 145"
          stroke="var(--riso-pink-light)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Heart in hands */}
      <g className="heart" transform="translate(100, 150)">
        {/* Heart shadow */}
        <path
          d="M 0 -10 C -10 -20, -25 -20, -25 -10 C -25 0, -15 15, 0 25 C 15 15, 25 0, 25 -10 C 25 -20, 10 -20, 0 -10 Z"
          fill="var(--riso-teal)"
          transform="translate(3, 3) scale(0.8)"
          opacity="0.5"
        />
        {/* Main heart */}
        <path
          d="M 0 -10 C -10 -20, -25 -20, -25 -10 C -25 0, -15 15, 0 25 C 15 15, 25 0, 25 -10 C 25 -20, 10 -20, 0 -10 Z"
          fill="var(--riso-pink)"
          transform="scale(0.8)"
        />
        {/* Heart highlight */}
        <circle cx="-8" cy="-8" r="3" fill="var(--bg-light)" opacity="0.6" transform="scale(0.8)" />
      </g>

      {/* Texture overlay */}
      <rect
        x="0"
        y="0"
        width="200"
        height="240"
        fill="url(#halftone)"
        opacity="0.3"
      />
    </svg>
  );
};

export default RisographAngel;
