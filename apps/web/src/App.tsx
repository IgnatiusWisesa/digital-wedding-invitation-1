// Lights of Hope App - Romantic Lantern Festival
import React from 'react'
import { Lanterns } from './components/Lanterns'
import { Stars } from './components/Stars'
import { RsvpForm } from './components/RsvpForm'
import { AudioPlayer } from './components/AudioPlayer'
import { Couple } from './components/Couple'
import { Events } from './components/Events'
import { Gallery } from './components/Gallery'
import { Section } from './components/Section'
import { GiftSection } from './components/GiftSection'
import { WishesList } from './components/WishesList'
import { weddingConfig } from './config/wedding'

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-cream font-sans selection:bg-orange-500 selection:text-white pb-20">
            <AudioPlayer />

            {/* Fixed Background - Stars & Lanterns */}
            <Stars />
            <div className="fixed inset-0 pointer-events-none z-0">
                <Lanterns />
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-orange-900/10 pointer-events-none"></div>
            </div>

            {/* Hero Section - Garden Party */}
            <section className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20 text-center">
                <div className="mb-8 animate-fade-in-down p-8 -mt-16 md:mt-0">
                    {/* Subtitle */}
                    <div className="mb-8">
                        <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] border-y border-white/50 py-3 px-6 inline-block">
                            Lights of Hope
                        </span>
                    </div>

                    {/* Couple Names */}
                    <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-2xl mb-4" style={{
                        fontFamily: '"Great Vibes", cursive',
                        textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                        {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname}
                    </h1>

                    {/* Date */}
                    <div className="text-white text-lg md:text-xl font-light tracking-widest mt-8">
                        <p className="drop-shadow-md">{weddingConfig.date.day}, {weddingConfig.date.full}</p>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 animate-bounce text-lantern-glow/70">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* Main Content */}
            <Couple />
            <Events />
            <Gallery />
            <GiftSection />

            {/* RSVP Section */}
            <Section className="max-w-2xl mx-auto">
                <h2 className="font-serif text-4xl text-center text-accent-brown mb-12">RSVP</h2>
                <RsvpForm />
            </Section>

            {/* Wishes Section */}
            <WishesList />

            {/* Footer */}
            <footer className="relative z-10 text-center py-8 mt-20 border-t border-accent-brown/20">
                <p className="text-gray-600 text-xs">
                    Made with love by {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname} © 2025
                </p>
            </footer>
        </div>
    )
}

export default App
