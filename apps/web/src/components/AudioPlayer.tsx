import React, { useState, useEffect, useRef } from 'react';

export const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Autoplay on mount
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.log("Autoplay prevented by browser:", error);
                    setIsPlaying(false);
                });
        }
    }, []);

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
        <div className="fixed bottom-6 right-6 z-50">
            <audio ref={audioRef} src="/music.mp3" loop />
            <button
                onClick={togglePlay}
                className="bg-accent-yellow hover:bg-accent-green text-night-900 rounded-full p-3 shadow-lg transition-all hover:scale-110 focus:outline-none ring-2 ring-accent-green"
                aria-label="Toggle Music"
            >
                {isPlaying ? (
                    // Pause Icon - Two vertical bars
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                ) : (
                    // Play Icon - Triangle
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"></path>
                    </svg>
                )}
            </button>
        </div>
    );
};
