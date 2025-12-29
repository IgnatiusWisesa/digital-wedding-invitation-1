import React from 'react';

export const Stars = () => {
    // Generate 50 stars with random properties
    const stars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1, // 1-3px
        duration: Math.random() * 3 + 2, // 2-5s
        delay: Math.random() * 5, // 0-5s
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDuration: `${star.duration}s`,
                        animationDelay: `${star.delay}s`,
                    }}
                />
            ))}
        </div>
    );
};
