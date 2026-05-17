import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '../config/api';

interface Photo {
    _id: string;
    url?: string;
    filename: string;
    guestId: string;
    createdAt: string;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

type ViewMode = 'slideshow' | 'gallery';

export const LiveAlbum: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [shuffled, setShuffled] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('slideshow');
    const [lightbox, setLightbox] = useState<Photo | null>(null);

    // Slideshow state
    const [slideIndex, setSlideIndex] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);
    const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const API_URL = getApiUrl();

    const fetchPhotos = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/photos`);
            if (res.ok) {
                const data: Photo[] = await res.json();
                setPhotos(data);
                setShuffled(prev => {
                    if (prev.length === 0) return shuffle(data); // first load: shuffle
                    // New photos arrived: append only the new ones at random positions
                    const existingIds = new Set(prev.map(p => p._id));
                    const newPhotos = data.filter(p => !existingIds.has(p._id));
                    if (newPhotos.length === 0) return prev; // nothing new, keep order
                    // Insert new photos at random spots
                    const combined = [...prev];
                    for (const np of newPhotos) {
                        const pos = Math.floor(Math.random() * (combined.length + 1));
                        combined.splice(pos, 0, np);
                    }
                    return combined;
                });
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [API_URL]);

    // Seeded per-photo random values for visual variety (stable across re-renders)
    const cardVariants = React.useMemo(() => {
        return Array.from({ length: 200 }, (_, i) => {
            const r = ((i * 2654435761) >>> 0) / 0xffffffff;
            const r2 = (((i + 99) * 2246822519) >>> 0) / 0xffffffff;
            return {
                mt: Math.floor(r * 32),         // 0–32px top margin
                wide: r2 > 0.82,                // ~18% cards get double column
            };
        });
    }, []);

    useEffect(() => {
        fetchPhotos();
        const poll = setInterval(fetchPhotos, 10000);
        return () => clearInterval(poll);
    }, [fetchPhotos]);

    // Re-shuffle when switching to slideshow
    useEffect(() => {
        if (view === 'slideshow' && photos.length > 0) {
            setShuffled(shuffle(photos));
            setSlideIndex(0);
        }
    }, [view]);

    // Auto-advance slideshow
    const advanceSlide = useCallback(() => {
        setFadingOut(true);
        setTimeout(() => {
            setSlideIndex(i => (i + 1) % (shuffled.length || 1));
            setFadingOut(false);
        }, 600);
    }, [shuffled.length]);

    useEffect(() => {
        if (view !== 'slideshow' || shuffled.length === 0) return;
        slideTimer.current = setTimeout(advanceSlide, 4500);
        return () => { if (slideTimer.current) clearTimeout(slideTimer.current); };
    }, [view, slideIndex, shuffled.length, advanceSlide]);

    const goSlide = (dir: 1 | -1) => {
        if (slideTimer.current) clearTimeout(slideTimer.current);
        setFadingOut(true);
        setTimeout(() => {
            setSlideIndex(i => (i + dir + shuffled.length) % shuffled.length);
            setFadingOut(false);
        }, 300);
    };

    // Keyboard nav for lightbox / slideshow
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (lightbox) {
                if (e.key === 'Escape') setLightbox(null);
                return;
            }
            if (view === 'slideshow') {
                if (e.key === 'ArrowRight') goSlide(1);
                if (e.key === 'ArrowLeft') goSlide(-1);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox, view, shuffled.length]);

    const currentPhoto = shuffled[slideIndex];

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

            {/* ── Header ── */}
            <div className="text-center pt-10 pb-6 px-4">
                <h1 className="font-script text-5xl md:text-7xl text-accent-yellow drop-shadow-lg mb-3"
                    style={{ fontFamily: '"Great Vibes", cursive' }}>
                    Live Memories
                </h1>
                <p className="text-gray-500 tracking-widest text-[10px] md:text-xs mb-6 italic">
                    setiap jepretan, sebuah kenangan abadi
                </p>

                {/* View toggle */}
                <div className="inline-flex rounded-full border border-white/10 overflow-hidden">
                    <button
                        onClick={() => setView('slideshow')}
                        className={`px-5 py-2 text-sm font-medium transition-all ${view === 'slideshow' ? 'bg-accent-yellow text-night-900' : 'text-white/50 hover:text-white'}`}
                    >
                        ▶ Slideshow
                    </button>
                    <button
                        onClick={() => setView('gallery')}
                        className={`px-5 py-2 text-sm font-medium transition-all ${view === 'gallery' ? 'bg-accent-yellow text-night-900' : 'text-white/50 hover:text-white'}`}
                    >
                        ⊞ Gallery
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="text-center py-20 text-accent-yellow/60 text-sm animate-pulse">Memuat foto...</div>
            )}

            {!loading && photos.length === 0 && (
                <div className="text-center py-32 text-gray-500">
                    <p className="text-4xl mb-4">📸</p>
                    <p>Belum ada foto. Jadilah yang pertama!</p>
                </div>
            )}

            {/* ══════════════════════════════════
                SLIDESHOW VIEW
            ══════════════════════════════════ */}
            {!loading && photos.length > 0 && view === 'slideshow' && currentPhoto && (
                <div className="relative w-full" style={{ height: 'calc(100vh - 180px)', minHeight: 420 }}>

                    {/* Background blur layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                        style={{ backgroundImage: `url(${currentPhoto.url || `${API_URL}/uploads/${currentPhoto.filename}`})`, filter: 'blur(24px) brightness(0.25)', transform: 'scale(1.1)' }}
                    />

                    {/* Main photo */}
                    <div className="absolute inset-0 flex items-center justify-center px-16">
                        <img
                            key={currentPhoto._id}
                            src={currentPhoto.url || `${API_URL}/uploads/${currentPhoto.filename}`}
                            alt="Guest memory"
                            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-500"
                            style={{ opacity: fadingOut ? 0 : 1, transform: fadingOut ? 'scale(0.97)' : 'scale(1)' }}
                        />
                    </div>

                    {/* Gradient bottom overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />

                    {/* Info */}
                    <div
                        className="absolute bottom-5 left-0 right-0 text-center transition-all duration-500 pointer-events-none"
                        style={{ opacity: fadingOut ? 0 : 1 }}
                    >
                        <p className="text-white/50 text-xs">
                            {currentPhoto.guestId && currentPhoto.guestId !== 'anonymous' ? currentPhoto.guestId : ''}
                        </p>
                        <p className="text-white/25 text-xs mt-0.5">
                            {slideIndex + 1} / {shuffled.length}
                        </p>
                    </div>

                    {/* Prev / Next */}
                    <button
                        onClick={() => goSlide(-1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all z-10"
                    >‹</button>
                    <button
                        onClick={() => goSlide(1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all z-10"
                    >›</button>

                    {/* Dot indicators (max 12) */}
                    {shuffled.length <= 24 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                            {shuffled.map((_, i) => (
                                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === slideIndex ? 'bg-accent-yellow scale-125' : 'bg-white/20'}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════
                PINTEREST GALLERY VIEW
            ══════════════════════════════════ */}
            {!loading && photos.length > 0 && view === 'gallery' && (
                <div className="px-2 md:px-5 pb-12">
                    {/* Pinterest masonry — CSS columns with random top offsets */}
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3">
                        {shuffled.map((p, i) => {
                            const v = cardVariants[i % cardVariants.length];
                            return (
                                <div
                                    key={p._id}
                                    onClick={() => setLightbox(p)}
                                    className="break-inside-avoid relative group cursor-zoom-in rounded-xl overflow-hidden bg-gray-900 border border-white/5 shadow-lg hover:shadow-accent-yellow/10 hover:border-white/20 transition-all duration-300 mb-2 md:mb-3"
                                    style={{ marginTop: v.mt }}
                                >
                                    <img
                                        src={p.url || `${API_URL}/uploads/${p.filename}`}
                                        alt="Guest memory"
                                        className="w-full h-auto block group-hover:scale-[1.04] transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    {/* Timestamp — always visible, bottom-right */}
                                    <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
                                        <p className="text-white/50 text-[10px] text-right leading-tight">
                                            {new Date(p.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {/* Guest name on hover */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-start p-3 pointer-events-none">
                                        {p.guestId && p.guestId !== 'anonymous' && (
                                            <p className="text-white/90 text-xs font-medium truncate bg-black/40 rounded px-1.5 py-0.5">{p.guestId}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-center text-white/20 text-xs mt-6">{photos.length} foto</p>
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/95 z-[90] flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox.url || `${API_URL}/uploads/${lightbox.filename}`}
                            alt="Guest memory"
                            className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
                        />
                        <div className="mt-3 flex items-center gap-4">
                            {lightbox.guestId && lightbox.guestId !== 'anonymous' && (
                                <p className="text-white/50 text-sm">{lightbox.guestId}</p>
                            )}
                            <p className="text-white/30 text-xs">
                                {new Date(lightbox.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <a
                                href={lightbox.url || `${API_URL}/uploads/${lightbox.filename}`}
                                download target="_blank" rel="noreferrer"
                                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded transition-all"
                                onClick={e => e.stopPropagation()}
                            >
                                ⬇ Download
                            </a>
                        </div>
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-1 -right-1 text-white/40 hover:text-white text-2xl w-9 h-9 flex items-center justify-center"
                        >✕</button>
                    </div>
                </div>
            )}
        </div>
    );
};
