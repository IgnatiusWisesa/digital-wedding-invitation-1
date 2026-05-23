import React, { useEffect, useState } from 'react';
import { Section } from './Section';
import { weddingConfig } from '../config/wedding';
import { useInvite } from '../context/InviteContext';
import { getApiUrl } from '../config/api';

export const Events = () => {
    const invite = useInvite();
    const event = invite?.event ?? 'Keduanya';
    const [streamingUrl, setStreamingUrl] = useState<string | null>(null);

    useEffect(() => {
        const API_URL = getApiUrl();
        fetch(`${API_URL}/api/public/streaming-link`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.url) setStreamingUrl(d.url); })
            .catch(() => {});
    }, []);

    const showGereja  = event === 'Keduanya' || event === 'Gereja';
    const showResepsi = event === 'Keduanya' || event === 'Resepsi';

    // Filter timeline items by type: "G" = church only, "R" = reception only, "" = always
    const timelineItems = weddingConfig.timeline?.filter(item => {
        if (!item.type || item.type === '') return true;
        if (item.type === 'G') return showGereja;
        if (item.type === 'R') return showResepsi;
        return true;
    }) ?? [];

    return (
        <Section className="text-center relative">
            <div className="mb-12">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>The Wedding Day</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto mb-4"></div>
                <p className="text-white/60 font-light italic">Join us as we light our path together</p>
            </div>

            <div className={`grid gap-8 mb-16 ${showGereja && showResepsi ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
                {/* Holy Matrimony */}
                {showGereja && (
                    <div className="bg-gradient-to-br from-night-800/50 to-night-900/50 p-8 rounded-xl border border-accent-green/30 hover:border-accent-green/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.2)] group relative overflow-hidden">
                        <h3 className="font-serif text-2xl text-white mb-4 flex items-center justify-center gap-2">
                            <span>⛪</span> {weddingConfig.ceremony.name}
                        </h3>
                        <div className="text-white/80 space-y-2 mb-6 font-light">
                            <p className="text-lg font-semibold text-white">{weddingConfig.ceremony.time}</p>
                            <p className="font-medium">{weddingConfig.ceremony.venue}</p>
                            <p className="text-sm">{weddingConfig.ceremony.address}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href={weddingConfig.ceremony.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 border-2 border-white/50 text-white px-6 py-2 rounded-full hover:bg-white hover:text-garden-dark transition-all duration-300 text-sm uppercase tracking-wider font-medium"
                            >
                                <span>📍</span> View Map
                            </a>
                            {streamingUrl && (
                                <a
                                    href={streamingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 border-2 border-red-400/70 text-red-300 px-6 py-2 rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 text-sm uppercase tracking-wider font-medium animate-pulse"
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Live Streaming
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Reception */}
                {showResepsi && (
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
                )}
            </div>

            {/* Schedule Timeline */}
            {timelineItems.length > 0 && (
                <div className="max-w-2xl mx-auto">
                    <h3 className="font-serif text-2xl text-white mb-8 text-center">Timeline</h3>
                    <div className="space-y-8 py-4">
                        {timelineItems.map((item, idx) => (
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
