import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface Photo {
    _id: string;
    url?: string;
    filename: string;
    guestId: string;
    createdAt: string;
}

export const LiveAlbum: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPhotos = async () => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/photos`);
            if (res.ok) {
                const data = await res.json();
                setPhotos(data);
            }
        } catch (error) {
            console.error('Failed to fetch live photos', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
        const interval = setInterval(fetchPhotos, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const API_URL = getApiUrl();

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 overflow-x-hidden">
            <div className="text-center mb-12">
                <h1 className="font-script text-6xl md:text-8xl text-accent-yellow drop-shadow-lg mb-4">Live Memories</h1>
                <p className="text-gray-400 uppercase tracking-[0.3em] text-sm md:text-base">Momen yang Diabadikan oleh Tamu</p>
            </div>

            {loading ? (
                <div className="text-center text-accent-yellow">Memuat foto...</div>
            ) : photos.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-2xl mb-4">📸</p>
                    <p>Belum ada foto. Jadilah yang pertama mengambil foto!</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {photos.map((p, index) => (
                        <div 
                            key={p._id} 
                            className="break-inside-avoid relative group rounded-xl overflow-hidden shadow-xl border border-white/5 bg-gray-900 animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <img 
                                src={p.url || `${API_URL}/uploads/${p.filename}`} 
                                alt="Guest memory"
                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <p className="text-xs text-gray-300 font-mono">
                                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
