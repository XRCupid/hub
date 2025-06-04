import React from 'react';

const RisographHeart = ({ size = 40, className = '', animated = true }) => {
  return (
    <span className={`risograph-heart-wrapper ${className}`}>
      <svg
        width={size}
        height={size * 0.9}
        viewBox="0 0 40 36"
        className={`risograph-heart ${animated ? 'animated' : ''}`}
      >
        {/* Layered hearts for Risograph offset effect */}
        {/* Teal layer (offset) */}
        <path
          d="M 20 8 C 16 2, 8 2, 8 8 C 8 14, 16 24, 20 30 C 24 24, 32 14, 32 8 C 32 2, 24 2, 20 8 Z"
          fill="var(--riso-teal)"
          transform="translate(1, 1)"
          opacity="0.6"
        />
        
        {/* Goldenrod layer (offset) */}
        <path
          d="M 20 8 C 16 2, 8 2, 8 8 C 8 14, 16 24, 20 30 C 24 24, 32 14, 32 8 C 32 2, 24 2, 20 8 Z"
          fill="var(--riso-goldenrod)"
          transform="translate(-1, -1)"
          opacity="0.5"
        />
        
        {/* Main pink heart */}
        <path
          d="M 20 8 C 16 2, 8 2, 8 8 C 8 14, 16 24, 20 30 C 24 24, 32 14, 32 8 C 32 2, 24 2, 20 8 Z"
          fill="var(--riso-pink)"
        />
        
        {/* Highlight */}
        <circle cx="14" cy="10" r="3" fill="var(--bg-light)" opacity="0.5" />
      </svg>
    </span>
  );
};

export default RisographHeart;
