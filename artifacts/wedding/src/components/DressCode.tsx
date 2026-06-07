import React, { useState } from 'react';
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
    const [showDetail, setShowDetail] = useState(false);

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

                {/* View detail button */}
                <div className="mt-5">
                    <button
                        onClick={() => setShowDetail(true)}
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm font-light border border-white/15 hover:border-white/30 rounded-full px-5 py-2 transition-all duration-300"
                    >
                        <span>🔍</span> Lihat panduan lengkap
                    </button>
                </div>
            </div>

            {/* Lightbox modal */}
            {showDetail && (
                <div
                    className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDetail(false)}
                >
                    <div className="relative max-w-lg w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowDetail(false)}
                            className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
                        >
                            ✕ Tutup
                        </button>
                        <img
                            src="/asset/dresscode-guide.png"
                            alt="Dress Code Guide"
                            className="w-full h-auto rounded-xl shadow-2xl overflow-y-auto"
                            style={{ maxHeight: '85vh', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            )}

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
