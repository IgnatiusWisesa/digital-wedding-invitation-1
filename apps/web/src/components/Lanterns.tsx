import React from 'react';

export const Lanterns = () => {
  // Generate 25 lanterns with random properties
  const lanterns = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // 0-100%
    size: Math.random() * 0.5 + 0.7, // 0.7-1.2
    duration: Math.random() * 15 + 20, // 20-35s
    delay: Math.random() * -20, // -20 to 0s (stagger start)
    sway: (Math.random() - 0.5) * 40, // -20 to 20px
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
          } as React.CSSProperties & { '--sway': string }}
        >
          🏮
        </div>
      ))}
    </>
  );
};
