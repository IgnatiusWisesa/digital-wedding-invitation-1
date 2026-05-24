import React from 'react';
import { Section } from './Section';

const wearColors = [
    { name: 'Mocha',      hex: '#4A2C17' },
    { name: 'Cocoa',      hex: '#7B4F2E' },
    { name: 'Taupe',      hex: '#A08070' },
    { name: 'Warm Grey',  hex: '#8A8078' },
    { name: 'Muted Gold', hex: '#C4A855' },
    { name: 'Yellow',     hex: '#D4A830' },
];

const avoidColors = [
    { name: 'Green',        hex: '#8A9E6A' },
    { name: 'Champagne',    hex: '#E8DCC8' },
    { name: 'Beige',        hex: '#D4C4A0' },
    { name: 'White / Ivory',hex: '#F0EDE0' },
];

export const DressCode = () => {
    return (
        <Section className="text-center relative">
            <div className="mb-10">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>Dress Code</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto mb-4"></div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-night-800/50 to-night-900/50 border border-accent-green/20 rounded-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">

                        {/* KINDLY WEAR */}
                        <div className="p-8 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-3 w-full justify-center">
                                <div className="h-px flex-1 bg-white/20"></div>
                                <span className="text-white/70 text-xs tracking-[0.25em] uppercase font-medium">Kindly Wear</span>
                                <div className="h-px flex-1 bg-white/20"></div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-5">
                                {wearColors.map((c) => (
                                    <div key={c.name} className="flex flex-col items-center gap-2">
                                        <div
                                            className="w-14 h-14 rounded-full shadow-lg border border-white/10 hover:scale-105 transition-transform duration-300"
                                            style={{ backgroundColor: c.hex }}
                                        />
                                        <span className="text-white/55 text-xs font-light">{c.name}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-white/50 text-sm font-light italic leading-relaxed">
                                Warm, earthy, and golden hues that blend beautifully<br className="hidden sm:block" /> with our garden celebration.
                            </p>
                        </div>

                        {/* PLEASE AVOID */}
                        <div className="p-8 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-3 w-full justify-center">
                                <div className="h-px flex-1 bg-white/20"></div>
                                <span className="text-white/70 text-xs tracking-[0.25em] uppercase font-medium">Please Avoid</span>
                                <div className="h-px flex-1 bg-white/20"></div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-5">
                                {avoidColors.map((c) => (
                                    <div key={c.name} className="flex flex-col items-center gap-2">
                                        <div className="relative w-14 h-14">
                                            <div
                                                className="w-full h-full rounded-full border border-white/10"
                                                style={{ backgroundColor: c.hex }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-black/50 font-light text-2xl leading-none select-none">✕</span>
                                            </div>
                                        </div>
                                        <span className="text-white/55 text-xs font-light text-center leading-tight">{c.name}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-white/50 text-sm font-light italic leading-relaxed">
                                These colors are part of our palette for the day.<br className="hidden sm:block" />
                                Thank you for helping us keep our vision beautifully cohesive.
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 pt-12">
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-orange-500/30"></div>
                <div className="flex items-center justify-center" style={{ width: "100px", height: "100px" }}>
                    <img
                        src="/asset/moon.png"
                        alt="moon"
                        className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,200,80,0.6)]"
                    />
                </div>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-orange-500/30"></div>
            </div>
        </Section>
    );
};
