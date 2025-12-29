import React from 'react';
import { Section } from './Section';
import { weddingConfig } from '../config/wedding';

export const Couple = () => {
    return (
        <Section className="text-center space-y-16 relative">
            <div className="mb-4">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>The Couple</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center max-w-4xl mx-auto">
                {/* Groom */}
                <div className="animate-on-scroll group">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-accent-yellow/20 rounded-full blur-3xl group-hover:bg-accent-yellow/30 transition-all duration-500"></div>
                        <div className="relative w-56 h-56 mx-auto rounded-full border-4 border-accent-yellow/40 overflow-hidden shadow-[0_0_40px_rgba(255,215,0,0.3)] group-hover:border-accent-yellow group-hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] transition-all duration-500">
                            <img src="/couple/groom.png" alt="Groom" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-serif text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>{weddingConfig.couple.groom.fullname}</h3>
                    <p className="text-white/60 font-light italic text-sm">Son of</p>
                    <p className="text-white/90 font-light">{weddingConfig.couple.groom.father} & {weddingConfig.couple.groom.mother}</p>
                </div>

                {/* Bride */}
                <div className="animate-on-scroll group">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-accent-yellow/20 rounded-full blur-3xl group-hover:bg-accent-yellow/30 transition-all duration-500"></div>
                        <div className="relative w-56 h-56 mx-auto rounded-full border-4 border-accent-yellow/40 overflow-hidden shadow-[0_0_40px_rgba(255,215,0,0.3)] group-hover:border-accent-yellow group-hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] transition-all duration-500">
                            <img src="/couple/bride.png" alt="Bride" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-serif text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>{weddingConfig.couple.bride.fullname}</h3>
                    <p className="text-white/60 font-light italic text-sm">Daughter of</p>
                    <p className="text-white/90 font-light">{weddingConfig.couple.bride.father} & {weddingConfig.couple.bride.mother}</p>
                </div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 pt-8">
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-orange-500/30"></div>
                <div className="w-18 h-18 overflow-hidden relative">
                    <img
                        src="/asset/section_lantern.png"
                        alt="lantern"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-26 h-26 object-cover"
                    />
                </div>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-orange-500/30"></div>
            </div>
        </Section>
    );
};
