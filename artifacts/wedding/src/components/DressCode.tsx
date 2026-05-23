import React from 'react';
import { Section } from './Section';

const colors = [
    { name: 'Beige',        hex: '#C8B89A' },
    { name: 'Champagne',    hex: '#E8D5B0' },
    { name: 'Cream',        hex: '#EDE0C8' },
    { name: 'Brown',        hex: '#8B6347' },
    { name: 'Dusty Blue',   hex: '#8FA8BE' },
    { name: 'Neutral',      hex: '#B0A898' },
];

export const DressCode = () => {
    return (
        <Section className="text-center relative">
            <div className="mb-10">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: '"Playfair Display", serif' }}>Dress Code</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-green to-transparent mx-auto mb-4"></div>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-night-800/50 to-night-900/50 border border-accent-green/20 rounded-2xl p-8">
                    <p className="text-white/80 font-light italic text-lg leading-relaxed mb-8">
                        We would love for our family and friends to dress in soft, earthy, and elegant tones to celebrate our special day together.
                    </p>

                    {/* Color swatches */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        {colors.map((color) => (
                            <div key={color.name} className="flex flex-col items-center gap-2 group">
                                <div
                                    className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg border-2 border-white/20 group-hover:scale-110 group-hover:border-white/50 transition-all duration-300"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.hex}
                                />
                                <span className="text-white/60 text-xs font-light leading-tight text-center">{color.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-16 h-px bg-white/20 mx-auto mb-6" />

                    {/* Avoid note */}
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-5 py-2">
                        <span className="text-white/60 text-sm font-light">
                            Kindly avoid <span className="font-medium">pure white</span> and overly <span className="font-medium">bright / neon</span> colors
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 pt-12">
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-orange-500/30"></div>
                <div className="overflow-hidden relative" style={{ width: '72px', height: '72px' }}>
                    <img
                        src="/asset/section_lantern.png"
                        alt="lantern"
                        className="absolute left-1/2 -translate-x-1/2 object-cover"
                        style={{ top: '-12px', width: '104px', height: '104px' }}
                    />
                </div>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-orange-500/30"></div>
            </div>
        </Section>
    );
};
