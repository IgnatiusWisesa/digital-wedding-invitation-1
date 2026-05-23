// Lights of Hope App - Romantic Lantern Festival
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Lanterns } from './components/Lanterns'
import { Stars } from './components/Stars'
import { RsvpForm } from './components/RsvpForm'
import { AudioPlayer, AudioPlayerRef } from './components/AudioPlayer'
import { Couple } from './components/Couple'
import { Events } from './components/Events'
import { Gallery } from './components/Gallery'
import { Section } from './components/Section'
import { GiftSection } from './components/GiftSection'
import { WishesList } from './components/WishesList'
import { DressCode } from './components/DressCode'
import { weddingConfig } from './config/wedding'
import { useInvite } from './context/InviteContext'

function App() {
    const [showSplash, setShowSplash] = useState(true)
    const audioPlayerRef = useRef<AudioPlayerRef | null>(null)
    const invite = useInvite()

    useEffect(() => {
        if (showSplash) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [showSplash])

    const handleEnter = () => {
        setShowSplash(false)
        if (audioPlayerRef.current) {
            audioPlayerRef.current.play()
        }
    }

    const splashStars = useMemo(() => {
        const seed = 42
        const lcg = (s: number) => (s * 1664525 + 1013904223) & 0xffffffff
        let s = seed
        const rand = () => { s = lcg(s); return (s >>> 0) / 0xffffffff }
        return Array.from({ length: 55 }, (_, i) => {
            const left = rand() * 100
            const top = rand() * 100
            const size = 0.8 + rand() * 2.2
            const delay = rand() * 5
            const duration = 2 + rand() * 3
            const opacity = 0.3 + rand() * 0.7
            const type = rand() > 0.4 ? '✦' : (rand() > 0.5 ? '·' : '✧')
            return { id: i, left, top, size, delay, duration, opacity, type }
        })
    }, [])

    return (
        <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-cream font-sans selection:bg-orange-500 selection:text-white pb-20 ${showSplash ? 'h-screen overflow-hidden' : ''}`}>
            {showSplash && (
                <div className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 via-gray-950 to-black flex items-center justify-center">
                    {/* Full-screen star field */}
                    {splashStars.map(star => (
                        <span
                            key={star.id}
                            style={{
                                position: 'absolute',
                                left: `${star.left}%`,
                                top: `${star.top}%`,
                                fontSize: `${star.size * 6}px`,
                                color: star.type === '✦' ? '#F5C842' : star.type === '✧' ? '#E8D5A3' : '#ffffff',
                                opacity: star.opacity,
                                animation: `twinkle ${star.duration}s ${star.delay}s ease-in-out infinite`,
                                pointerEvents: 'none',
                                lineHeight: 1,
                                zIndex: 0,
                            }}
                        >
                            {star.type}
                        </span>
                    ))}
                    <div className="text-center space-y-8 p-8 animate-fade-in-down relative z-10">
                        <div className="relative flex justify-center items-center mb-6 mx-auto" style={{ width: 240, height: 240 }}>
                            <div className="absolute w-40 h-40 md:w-56 md:h-56 bg-accent-yellow/10 blur-[60px] rounded-full"></div>
                            <img
                                src="/logo-new.png"
                                alt="Logo"
                                className="relative z-10 w-48 h-48 md:w-60 md:h-60 object-contain drop-shadow-[0_0_16px_rgba(255,200,80,0.35)]"
                            />
                        </div>
                        <div className="mb-8">
                            <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] border-y border-white/50 py-3 px-6 inline-block">
                                Lights of Hope
                            </span>
                        </div>
                        <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-2xl mb-4" style={{
                            fontFamily: '"Great Vibes", cursive',
                            textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}>
                            {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname}
                        </h1>
                        {invite && (
                            <p className="text-lantern-light/80 text-lg">
                                Kepada Yth. <span className="font-semibold text-accent-yellow">{invite.name}</span>
                            </p>
                        )}
                        <button
                            onClick={handleEnter}
                            className="mt-8 px-8 py-3 bg-gradient-to-r from-accent-yellow to-accent-green text-night-900 rounded-full font-semibold uppercase tracking-wider hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            {invite ? 'Buka Undangan' : 'Open Invitation'}
                        </button>
                    </div>
                </div>
            )}

            <AudioPlayer
                ref={audioPlayerRef}
                onReady={(ref) => { audioPlayerRef.current = ref }}
            />

            <Stars />
            <div className="fixed inset-0 pointer-events-none z-0">
                <Lanterns />
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-orange-900/10 pointer-events-none"></div>
            </div>

            <section className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20 text-center">
                <div className="mb-8 animate-fade-in-down p-8 -mt-16 md:mt-0">
                    <div className="mb-8">
                        <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] border-y border-white/50 py-3 px-6 inline-block">
                            Lights of Hope
                        </span>
                    </div>

                    <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-2xl mb-4" style={{
                        fontFamily: '"Great Vibes", cursive',
                        textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                        {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname}
                    </h1>

                    <div className="text-white text-lg md:text-xl font-light tracking-widest mt-8">
                        <p className="drop-shadow-md">{weddingConfig.date.day}, {weddingConfig.date.full}</p>
                    </div>

                </div>

                <div className="absolute bottom-24 animate-bounce text-lantern-glow/70">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            <Couple />
            <Events />
            <DressCode />
            <Gallery />
            <GiftSection />

            <Section className="max-w-2xl mx-auto">
                <h2 className="font-serif text-4xl text-center text-accent-brown mb-12">RSVP</h2>
                <RsvpForm />
            </Section>

            <WishesList />

            <footer className="relative z-10 text-center py-8 mt-20 border-t border-accent-brown/20">
                <p className="text-gray-600 text-xs">
                    Made with love by {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname} © 2025
                </p>
            </footer>
        </div>
    )
}

export default App
