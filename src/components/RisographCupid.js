import React from 'react';

const RisographCupid = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 400 600" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Halo glow */}
    <circle cx="200" cy="90" r="50" fill="url(#haloGlow)" opacity="0.3"/>
    
    {/* Halo */}
    <ellipse cx="200" cy="90" rx="45" ry="15" fill="#FFB84D" stroke="#4C5BD4" strokeWidth="3"/>
    
    {/* Wings */}
    <path d="M120 200 C100 180, 80 180, 60 200 C40 220, 40 260, 60 280 L120 240 Z" fill="#FF6B9D" stroke="#4C5BD4" strokeWidth="3"/>
    <path d="M280 200 C300 180, 320 180, 340 200 C360 220, 360 260, 340 280 L280 240 Z" fill="#FF6B9D" stroke="#4C5BD4" strokeWidth="3"/>
    
    {/* Wing details */}
    <path d="M80 220 C90 210, 100 210, 110 220" stroke="#4C5BD4" strokeWidth="2" fill="none"/>
    <path d="M85 235 C95 225, 105 225, 115 235" stroke="#4C5BD4" strokeWidth="2" fill="none"/>
    <path d="M320 220 C310 210, 300 210, 290 220" stroke="#4C5BD4" strokeWidth="2" fill="none"/>
    <path d="M315 235 C305 225, 295 225, 285 235" stroke="#4C5BD4" strokeWidth="2" fill="none"/>
    
    {/* Body/Dress */}
    <path d="M200 180 C160 180, 140 210, 140 250 L140 380 C140 400, 150 410, 160 410 L240 410 C250 410, 260 400, 260 380 L260 250 C260 210, 240 180, 200 180 Z" 
          fill="#FF6B9D" 
          stroke="#4C5BD4" 
          strokeWidth="3"/>
    
    {/* Head */}
    <circle cx="200" cy="150" r="40" fill="#FFB5A7" stroke="#4C5BD4" strokeWidth="3"/>
    
    {/* Hair */}
    <path d="M170 130 C170 120, 180 110, 200 110 C220 110, 230 120, 230 130 L230 140 C230 135, 225 130, 220 130 C215 130, 210 135, 210 140 C210 135, 205 130, 200 130 C195 130, 190 135, 190 140 C190 135, 185 130, 180 130 C175 130, 170 135, 170 140 Z" 
          fill="#4C5BD4"/>
    
    {/* Face */}
    <circle cx="185" cy="145" r="3" fill="#4C5BD4"/>
    <circle cx="215" cy="145" r="3" fill="#4C5BD4"/>
    <path d="M190 160 Q200 165, 210 160" stroke="#4C5BD4" strokeWidth="2" fill="none" strokeLinecap="round"/>
    
    {/* Arms holding bow */}
    <path d="M160 220 L120 250" stroke="#FFB5A7" strokeWidth="12" strokeLinecap="round"/>
    <path d="M240 220 L280 250" stroke="#FFB5A7" strokeWidth="12" strokeLinecap="round"/>
    
    {/* Bow */}
    <path d="M120 250 Q200 200, 280 250" stroke="#4C5BD4" strokeWidth="3" fill="none"/>
    
    {/* Arrow */}
    <line x1="200" y1="225" x2="200" y2="275" stroke="#4C5BD4" strokeWidth="3"/>
    <path d="M200 275 L195 270 L200 280 L205 270 Z" fill="#4C5BD4"/>
    
    {/* Legs */}
    <rect x="175" y="390" width="15" height="40" rx="7" fill="#FFB5A7" stroke="#4C5BD4" strokeWidth="3"/>
    <rect x="210" y="390" width="15" height="40" rx="7" fill="#FFB5A7" stroke="#4C5BD4" strokeWidth="3"/>
    
    {/* Risograph texture overlay */}
    <rect width="400" height="600" fill="url(#risographNoise)" opacity="0.1"/>
    
    <defs>
      <radialGradient id="haloGlow">
        <stop offset="0%" stopColor="#FFB84D" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#FFB84D" stopOpacity="0"/>
      </radialGradient>
      
      <filter id="risographNoise">
        <feTurbulence baseFrequency="0.9" numOctaves="4" seed="5"/>
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      </filter>
    </defs>
  </svg>
);

export default RisographCupid;
