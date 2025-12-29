import React from 'react';
import { Section } from './Section';

export const Gallery = () => {
    const photos = [
        { url: "/gallery/photo1.png", caption: "Our Journey Begins" },
        { url: "/gallery/photo2.png", caption: "Under the Lanterns" },
        { url: "/gallery/photo3.png", caption: "Moments of Joy" },
        { url: "/gallery/photo4.png", caption: "Dancing in Twilight" },
        { url: "/gallery/photo5.png", caption: "Forever Together" },
        { url: "/gallery/photo6.png", caption: "Love & Laughter" },
    ];

    return (
        <Section className="text-center relative">
            <div className="mb-12">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>Our Moments</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto mb-4"></div>
                <p className="text-white/60 font-light italic">Capturing the lights of our love story</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {photos.map((photo, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden group rounded-lg transition-all hover:scale-[1.02] duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="aspect-[3/4] relative">
                            <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                <p className="text-white font-light text-sm tracking-wide">{photo.caption}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 pt-12">
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
