import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface AudioPlayerRef {
    play: () => Promise<void>;
}

interface AudioPlayerProps {
    onReady?: (ref: AudioPlayerRef) => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ onReady }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = async () => {
        if (audioRef.current) {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (error) {
                console.log("Play prevented:", error);
                setIsPlaying(false);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        play: playAudio
    }));

    useEffect(() => {
        if (onReady && audioRef.current) {
            onReady({ play: playAudio });
        }
    }, [onReady]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                playAudio();
            }
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
});

AudioPlayer.displayName = 'AudioPlayer';
