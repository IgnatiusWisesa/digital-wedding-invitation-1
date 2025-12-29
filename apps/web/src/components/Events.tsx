import React from 'react';
import { Section } from './Section';
import { weddingConfig } from '../config/wedding';

export const Events = () => {
    return (
        <Section className="text-center relative">
            <div className="mb-12">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>The Wedding Day</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto mb-4"></div>
                <p className="text-white/60 font-light italic">Join us as we light our path together</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* Holy Matrimony */}
                <div className="bg-gradient-to-br from-night-800/50 to-night-900/50 p-8 rounded-xl border border-accent-green/30 hover:border-accent-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.2)] group relative overflow-hidden">
                    <h3 className="font-serif text-2xl text-white mb-4 flex items-center justify-center gap-2">
                        <span>⛪</span> Holy Matrimony
                    </h3>
                    <div className="text-white/80 space-y-2 mb-6 font-light">
                        <p className="text-lg font-semibold text-white">{weddingConfig.ceremony.time}</p>
                        <p className="font-medium">{weddingConfig.ceremony.venue}</p>
                        <p className="text-sm">{weddingConfig.ceremony.address}</p>
                    </div>
                    <a
                        href={weddingConfig.ceremony.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border-2 border-white/50 text-white px-6 py-2 rounded-full hover:bg-white hover:text-garden-dark transition-all duration-300 text-sm uppercase tracking-wider font-medium"
                    >
                        <span>📍</span> View Map
                    </a>
                </div>

                {/* Reception */}
                <div className="bg-gradient-to-br from-night-800/50 to-night-900/50 p-8 rounded-xl border border-accent-green/30 hover:border-accent-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.2)] group relative overflow-hidden">
                    <h3 className="font-serif text-2xl text-white mb-4 flex items-center justify-center gap-2">
                        <span>🎉</span> Wedding Reception
                    </h3>
                    <div className="text-white/80 space-y-2 mb-6 font-light">
                        <p className="text-lg font-semibold text-white">{weddingConfig.reception.time}</p>
                        <p className="font-medium">{weddingConfig.reception.venue}</p>
                        <p className="text-sm">{weddingConfig.reception.address}</p>
                    </div>
                    <a
                        href={weddingConfig.reception.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border-2 border-white/50 text-white px-6 py-2 rounded-full hover:bg-white hover:text-garden-dark transition-all duration-300 text-sm uppercase tracking-wider font-medium"
                    >
                        <span>📍</span> View Map
                    </a>
                </div>
            </div>

            {/* Schedule Timeline */}
            <div className="max-w-2xl mx-auto">
                <h3 className="font-serif text-2xl text-white mb-8 text-center">Timeline</h3>
                <div className="space-y-8 py-4">
                    {weddingConfig.timeline?.length > 0 && weddingConfig.timeline.map((item, idx) => (
                        <div key={idx} className="text-center group">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-3xl">{item.icon}</span>
                                <div>
                                    <h4 className="text-white font-serif text-lg">{item.event}</h4>
                                    <p className="text-gray-400 text-sm">{item.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 pt-12">
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-orange-500/30"></div>
                <div className="w-12 h-12 overflow-hidden relative">
                    <img
                        src="/asset/section_lantern.png"
                        alt="lantern"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-16 object-cover"
                    />
                </div>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-orange-500/30"></div>
            </div>
        </Section>
    );
};
