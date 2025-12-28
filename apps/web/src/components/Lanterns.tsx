import React from 'react';

export const Lanterns: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="lantern lantern-1"></div>
            <div className="lantern lantern-2"></div>
            <div className="lantern lantern-3"></div>
            <div className="lantern lantern-4"></div>

            <style>{`
        .lantern {
          position: absolute;
          background: radial-gradient(circle, #FACC15 0%, #EAB308 60%, rgba(234, 179, 8, 0) 100%);
          width: 20px;
          height: 30px;
          border-radius: 50% 50% 40% 40%;
          filter: blur(8px);
          opacity: 0.6;
          animation: float 10s infinite ease-in-out;
        }
        .lantern-1 { top: 10%; left: 20%; animation-duration: 8s; width: 30px; height: 40px; }
        .lantern-2 { top: 25%; right: 15%; animation-duration: 12s; animation-delay: 2s; }
        .lantern-3 { top: 60%; left: 10%; animation-duration: 15s; width: 15px; height: 25px; }
        .lantern-4 { top: 40%; right: 30%; animation-duration: 10s; animation-delay: 1s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};
