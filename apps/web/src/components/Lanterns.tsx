import React from 'react';

export const Lanterns = () => {
  // Warm yellow color palette for lanterns
  const warmColors = [
    'rgba(255, 200, 0, 0.9)',   // Bright golden yellow
    'rgba(255, 180, 50, 0.9)',  // Warm amber
    'rgba(255, 160, 80, 0.9)',  // Peachy orange
    'rgba(255, 140, 0, 0.9)',   // Deep orange
    'rgba(255, 220, 100, 0.9)', // Light golden
  ];

  // Generate 12 lanterns with random properties
  const lanterns = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // 0-100%
    size: Math.random() * 0.5 + 0.8, // 0.8-1.3
    duration: Math.random() * 15 + 20, // 20-35s
    delay: Math.random() * -20, // -20 to 0s (stagger start)
    sway: (Math.random() - 0.5) * 40, // -20 to 20px
    color: warmColors[Math.floor(Math.random() * warmColors.length)],
  }));

  return (
    <>
      {lanterns.map((lantern) => (
        <div
          key={lantern.id}
          className="lantern"
          style={{
            left: `${lantern.left}%`,
            fontSize: `${lantern.size * 2}rem`,
            animationDuration: `${lantern.duration}s`,
            animationDelay: `${lantern.delay}s`,
            '--sway': `${lantern.sway}px`,
            filter: `drop-shadow(0 0 15px ${lantern.color}) drop-shadow(0 0 30px ${lantern.color})`,
          } as React.CSSProperties & { '--sway': string }}
        >
          🏮
        </div>
      ))}
    </>
  );
};
