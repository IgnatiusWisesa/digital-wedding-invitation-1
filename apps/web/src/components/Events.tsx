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
                <h3 className="font-serif text-2xl text-white mb-8">Timeline</h3>
                <div className="relative border-l-2 border-accent-green/30 ml-4 md:mx-auto md:w-3/4 text-left pl-8 space-y-8 py-4">
                    <div className="absolute top-0 bottom-0 left-[-5px] w-2 bg-gradient-to-b from-accent-green/30 via-accent-green/20 to-accent-green/30"></div>

                    {weddingConfig.timeline?.length > 0 && weddingConfig.timeline.map((item, idx) => (
                        <div key={idx} className="relative group">
                            <span className="absolute -left-[41px] bg-night-900 border-2 border-accent-green w-6 h-6 rounded-full group-hover:scale-125 transition-transform duration-300 flex items-center justify-center">
                                <span className="w-2 h-2 bg-accent-green rounded-full"></span>
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.icon}</span>
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
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-accent-green/50"></div>
                <span className="text-accent-yellow text-2xl">🏮</span>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-accent-green/50"></div>
            </div>
        </Section>
    );
};
