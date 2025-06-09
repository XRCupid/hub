import React from 'react';
import './AngelMascot.css';

interface AngelMascotProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'cupid' | 'wink' | 'flying';
  animate?: boolean;
}

const AngelMascot: React.FC<AngelMascotProps> = ({ 
  size = 'medium', 
  variant = 'cupid',
  animate = true 
}) => {
  const sizeClasses = {
    small: 'angel-small',
    medium: 'angel-medium',
    large: 'angel-large'
  };

  const variantClasses = {
    cupid: 'angel-cupid',
    wink: 'angel-wink',
    flying: 'angel-flying'
  };

  return (
    <div 
      className={`angel-mascot ${sizeClasses[size]} ${variantClasses[variant]} ${animate ? 'angel-animate' : ''}`}
    >
      <img 
        src="/assets/angel-cupid.png" 
        alt="XRCupid Angel Mascot"
        className="angel-image"
      />
      <div className="angel-effects">
        <span className="sparkle sparkle-1">✨</span>
        <span className="sparkle sparkle-2">💕</span>
        <span className="sparkle sparkle-3">✨</span>
        <span className="heart-trail heart-1">💗</span>
        <span className="heart-trail heart-2">💖</span>
      </div>
    </div>
  );
};

export default AngelMascot;
