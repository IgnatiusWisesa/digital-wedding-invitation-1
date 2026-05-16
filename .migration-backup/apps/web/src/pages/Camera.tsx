import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { getApiUrl } from '../config/api';

const MAX_QUOTA = 20;

export const Camera: React.FC = () => {
    const [quota, setQuota] = useState<number>(MAX_QUOTA);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedQuota = localStorage.getItem('wedding_photo_quota');
        if (savedQuota !== null) {
            setQuota(parseInt(savedQuota, 10));
        }
    }, []);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (quota <= 0) {
            setErrorMsg('Anda sudah mencapai batas kuota foto (20/20).');
            return;
        }

        setUploading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Compress image
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            // Prepare FormData
            const formData = new FormData();
            formData.append('file', compressedFile, compressedFile.name);
            formData.append('guestId', 'guest-' + Math.random().toString(36).substring(7));

            // Upload
            // We use the same backend URL pattern as RSVP/check-in. Assuming backend runs on 3001 or via Next proxy.
            const API_URL = getApiUrl();
            
            const response = await fetch(`${API_URL}/api/photos/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload gagal');
            }

            // Update Quota
            const newQuota = quota - 1;
            setQuota(newQuota);
            localStorage.setItem('wedding_photo_quota', newQuota.toString());
            
            setSuccessMsg('Foto berhasil dikirim ke layar utama!');

        } catch (error: any) {
            setErrorMsg(error.message || 'Terjadi kesalahan saat upload.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-cream flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in-down">
                <h1 className="font-script text-5xl md:text-6xl text-accent-yellow">Snap a Memory</h1>
                <p className="text-gray-400">Ambil foto momen favorit Anda! Foto akan langsung tampil di layar utama acara.</p>
                
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent-yellow/5 blur-[50px] rounded-full"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-6xl mb-6">📸</div>
                        
                        {quota > 0 ? (
                            <>
                                <p className="text-lg mb-6">Sisa Kuota: <span className="font-bold text-accent-yellow">{quota}</span> / {MAX_QUOTA}</p>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-8 py-4 bg-gradient-to-r from-accent-yellow to-orange-500 rounded-full text-night-900 font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(253,224,71,0.4)] hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Mengirim Foto...' : 'Ambil Foto Sekarang'}
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={handleCapture}
                                />
                            </>
                        ) : (
                            <div className="text-accent-yellow bg-accent-yellow/10 p-4 rounded-lg">
                                <p className="font-bold mb-2">Terima Kasih!</p>
                                <p className="text-sm">Anda telah menggunakan semua kuota foto Anda. Silakan nikmati kolase foto di layar utama.</p>
                            </div>
                        )}
                        
                        {successMsg && <p className="text-green-400 mt-6 animate-pulse">{successMsg}</p>}
                        {errorMsg && <p className="text-red-400 mt-6">{errorMsg}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
