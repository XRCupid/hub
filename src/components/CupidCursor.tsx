import React, { useEffect, useState } from 'react';
import './CupidCursor.css';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export const CupidCursor: React.FC = () => {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Create heart particles on click
      const newHearts: HeartParticle[] = [];
      for (let i = 0; i < 3; i++) {
        newHearts.push({
          id: nextId + i,
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: 8 + Math.random() * 8,
          duration: 0.8 + Math.random() * 0.4
        });
      }
      
      setHearts(prev => [...prev, ...newHearts]);
      setNextId(prev => prev + 3);

      // Remove hearts after animation
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => 
          !newHearts.find(newHeart => newHeart.id === heart.id)
        ));
      }, 1500);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [nextId]);

  return (
    <div className="cupid-cursor-container">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="heart-particle"
          style={{
            left: heart.x,
            top: heart.y,
            width: heart.size,
            height: heart.size,
            animationDuration: `${heart.duration}s`
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};
