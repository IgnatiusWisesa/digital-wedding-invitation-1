import React from 'react';

export const Lanterns = () => {
  // Two warm yellow color variations
  const warmColors = [
    'rgba(255, 200, 0, 0.9)',   // Bright golden yellow
    'rgba(255, 160, 80, 0.9)',  // Warm orange
  ];

  // Generate 25 lanterns with random properties including rotation and depth
  const lanterns = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // 0-100%
    size: Math.random() * 0.3 + 0.3, // 0.3-0.6 (much smaller, emoji-sized)
    duration: Math.random() * 15 + 20, // 20-35s
    delay: Math.random() * -20, // -20 to 0s (stagger start)
    sway: (Math.random() - 0.5) * 40, // -20 to 20px
    color: warmColors[Math.floor(Math.random() * warmColors.length)],
    rotation: Math.random() * 30 - 15, // -15 to 15 degrees
    rotationEnd: Math.random() * 30 - 15, // Different end rotation
    blur: Math.random() * 2, // 0-2px blur for depth
    opacity: Math.random() * 0.3 + 0.7, // 0.7-1.0 opacity
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
            '--rotation-start': `${lantern.rotation}deg`,
            '--rotation-end': `${lantern.rotationEnd}deg`,
            filter: `drop-shadow(0 0 ${15 * lantern.size}px ${lantern.color}) drop-shadow(0 0 ${30 * lantern.size}px ${lantern.color}) blur(${lantern.blur}px)`,
            opacity: lantern.opacity,
          } as React.CSSProperties & {
            '--sway': string;
            '--rotation-start': string;
            '--rotation-end': string;
          }}
        >
          <img
            src="/asset/lantern.png"
            alt="lantern"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      ))}
    </>
  );
};
