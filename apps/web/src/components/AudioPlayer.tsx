import React, { useState, useEffect, useRef } from 'react';

export const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startMusic = () => {
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setShowOverlay(false);
                })
                .catch(error => {
                    console.log("Auto-play prevented:", error);
                });
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <>
            {/* Click to Start Overlay */}
            {showOverlay && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                    onClick={startMusic}
                >
                    <div className="text-center animate-pulse">
                        <div className="text-white text-2xl md:text-4xl font-serif mb-4">
                            🎵
                        </div>
                        <p className="text-white text-lg md:text-xl">Click anywhere to start</p>
                        <p className="text-white/60 text-sm mt-2">Music will play automatically</p>
                    </div>
                </div>
            )}

            {/* Audio Player Control */}
            <div className="fixed bottom-6 right-6 z-50">
                <audio ref={audioRef} src="/music.mp3" loop />
                <button
                    onClick={togglePlay}
                    className="bg-accent-yellow hover:bg-accent-green text-night-900 rounded-full p-4 shadow-lg transition-all hover:scale-110 focus:outline-none ring-2 ring-accent-green"
                    aria-label="Toggle Music"
                >
                    {isPlaying ? (
                        // Pause Icon - Two vertical bars
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                        </svg>
                    ) : (
                        // Play Icon - Triangle
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    )}
                </button>
            </div>
        </>
    );
};
