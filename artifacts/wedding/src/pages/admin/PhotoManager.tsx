import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

interface Photo {
    _id: string;
    url: string;
    filename?: string;
    guestId?: string;
    createdAt: string;
}

export const PhotoManager = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [lightbox, setLightbox] = useState<Photo | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) { navigate('/admin/login'); return; }
        fetchPhotos();
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const fetchPhotos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/photos`);
            setPhotos(await res.json());
        } catch {
            alert('Gagal memuat foto');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(p => p._id)));
        }
    };

    const handleDeleteSingle = async (photo: Photo) => {
        if (!window.confirm(`Hapus foto ini?`)) return;
        setDeleting(true);
        try {
            await axios.post(`${getApiUrl()}/api/photos/${photo._id}/delete`, { id: photo._id });
            setPhotos(prev => prev.filter(p => p._id !== photo._id));
            setSelected(prev => { const s = new Set(prev); s.delete(photo._id); return s; });
            setLightbox(null);
        } catch { alert('Gagal menghapus foto'); }
        finally { setDeleting(false); }
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        if (!window.confirm(`Hapus ${selected.size} foto yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) return;
        setDeleting(true);
        try {
            await axios.post(`${getApiUrl()}/api/photos/bulk-delete`, { ids: Array.from(selected) });
            setPhotos(prev => prev.filter(p => !selected.has(p._id)));
            setSelected(new Set());
        } catch { alert('Gagal menghapus foto'); }
        finally { setDeleting(false); }
    };

    const handleDeleteAll = async () => {
        if (photos.length === 0) return;
        if (!window.confirm(`Hapus SEMUA ${photos.length} foto? Tindakan ini tidak dapat dibatalkan.`)) return;
        setDeleting(true);
        try {
            await axios.post(`${getApiUrl()}/api/photos/bulk-delete`, { ids: photos.map(p => p._id) });
            setPhotos([]);
            setSelected(new Set());
        } catch { alert('Gagal menghapus semua foto'); }
        finally { setDeleting(false); }
    };

    const filtered = photos.filter(p =>
        !search ||
        p.guestId?.toLowerCase().includes(search.toLowerCase()) ||
        p.filename?.toLowerCase().includes(search.toLowerCase()) ||
        new Date(p.createdAt).toLocaleString('id-ID').includes(search)
    );

    const allSelected = filtered.length > 0 && selected.size === filtered.length;
    const someSelected = selected.size > 0;

    return (
        <div className="min-h-screen bg-night p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <button onClick={() => navigate('/admin/choose')} className="text-white/40 hover:text-white/70 text-sm mb-2 flex items-center gap-1 transition-colors">
                            ← Pilih Dashboard
                        </button>
                        <h1 className="text-3xl font-serif text-accent-yellow mb-1">Manajemen Foto</h1>
                        <p className="text-white/50 text-sm">{photos.length} foto tersimpan</p>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_username'); navigate('/admin/login'); }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded border border-red-500/50 transition-all text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Cari nama tamu, file..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-night-800/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow w-64"
                    />
                    <button
                        onClick={selectAll}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-all"
                    >
                        {allSelected ? '☑ Batal Pilih Semua' : `☐ Pilih Semua (${filtered.length})`}
                    </button>
                    <span className="text-white/40 text-sm">{selected.size > 0 ? `${selected.size} dipilih` : ''}</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {someSelected && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-medium transition-all disabled:opacity-50"
                        >
                            🗑️ Hapus {selected.size} Foto
                        </button>
                    )}
                    <button
                        onClick={fetchPhotos}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-all disabled:opacity-50"
                    >
                        ↻ Refresh
                    </button>
                    {photos.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleting}
                            className="bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 px-5 py-2 rounded font-medium transition-all disabled:opacity-50"
                        >
                            ⚠️ Hapus Semua
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="text-center py-20 text-white/40">Memuat foto...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-white/40">
                        {search ? 'Tidak ada foto yang cocok.' : 'Belum ada foto yang diupload.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filtered.map((photo) => {
                            const isSelected = selected.has(photo._id);
                            return (
                                <div
                                    key={photo._id}
                                    className={`relative group rounded-lg overflow-hidden bg-white/5 border-2 transition-all cursor-pointer ${
                                        isSelected ? 'border-accent-yellow shadow-lg shadow-accent-yellow/20' : 'border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelect(photo._id)}
                                        className="absolute top-2 left-2 z-20 w-6 h-6 rounded border-2 transition-all flex items-center justify-center text-xs"
                                        style={{
                                            background: isSelected ? '#F5A623' : 'rgba(0,0,0,0.6)',
                                            borderColor: isSelected ? '#F5A623' : 'rgba(255,255,255,0.4)',
                                        }}
                                    >
                                        {isSelected && <span className="text-night font-bold">✓</span>}
                                    </button>

                                    {/* Photo */}
                                    <div
                                        className="aspect-square"
                                        onClick={() => setLightbox(photo)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt="Guest photo"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end pointer-events-none">
                                        <div className="p-2 w-full">
                                            <p className="text-white/70 text-[10px] truncate">{photo.guestId || 'anonymous'}</p>
                                            <p className="text-white/50 text-[10px]">
                                                {new Date(photo.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delete button on hover */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSingle(photo); }}
                                        disabled={deleting}
                                        className="absolute top-2 right-2 z-20 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                        title="Hapus foto ini"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={lightbox.url}
                            alt="Guest photo"
                            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-white/70 text-sm">{lightbox.guestId || 'anonymous'}</p>
                                <p className="text-white/40 text-xs">{new Date(lightbox.createdAt).toLocaleString('id-ID')}</p>
                            </div>
                            <a
                                href={lightbox.url}
                                download={lightbox.filename || 'photo.jpg'}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-accent-yellow hover:bg-accent-green text-night-900 font-bold px-4 py-2 rounded transition-all text-sm"
                                onClick={e => e.stopPropagation()}
                            >
                                ⬇ Download
                            </a>
                            <button
                                onClick={() => handleDeleteSingle(lightbox)}
                                disabled={deleting}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded transition-all text-sm disabled:opacity-50"
                            >
                                🗑️ Hapus
                            </button>
                        </div>
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute top-0 right-0 text-white/40 hover:text-white text-3xl leading-none p-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoManager;
