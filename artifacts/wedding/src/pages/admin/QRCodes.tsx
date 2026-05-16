import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const SETTING_KEY = 'baseUrl';

export const QRCodes = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    const [baseUrl, setBaseUrl] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!token) { navigate('/admin/login'); return; }
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await axios.get(`${getApiUrl()}/api/admin/app-settings`, axiosConfig);
            const saved = res.data[SETTING_KEY];
            if (saved) {
                setBaseUrl(saved);
                setEditUrl(saved);
            } else {
                const fallback = window.location.origin + (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');
                setBaseUrl(fallback);
                setEditUrl(fallback);
            }
        } catch {
            const fallback = window.location.origin + (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');
            setBaseUrl(fallback);
            setEditUrl(fallback);
        } finally {
            setLoaded(true);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editUrl.replace(/\/$/, '');
            await axios.post(`${getApiUrl()}/api/admin/app-settings`, { key: SETTING_KEY, value: url }, axiosConfig);
            setBaseUrl(url);
            setEditing(false);
        } catch {
            alert('Gagal menyimpan URL');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const snapUrl = `${baseUrl}/snap`;
    const albumUrl = `${baseUrl}/live-album`;

    const qrCards = [
        {
            label: '📷 Kamera / Ambil Foto',
            description: 'Tamu scan ini untuk membuka kamera dan mengambil foto kenangan',
            url: snapUrl,
            color: 'border-purple-500/40',
            titleColor: 'text-purple-300',
            bgColor: 'bg-purple-500/10',
        },
        {
            label: '🖼️ Lihat Foto / Live Album',
            description: 'Tamu scan ini untuk melihat semua foto yang sudah diupload',
            url: albumUrl,
            color: 'border-accent-yellow/40',
            titleColor: 'text-accent-yellow',
            bgColor: 'bg-accent-yellow/10',
        },
    ];

    return (
        <div className="min-h-screen bg-night p-4 md:p-8 print:bg-white print:p-0">
            {/* Header — hidden on print */}
            <div className="max-w-4xl mx-auto mb-8 print:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/admin/choose')} className="text-white/40 hover:text-white/70 text-sm mb-2 flex items-center gap-1 transition-colors">
                            ← Pilih Dashboard
                        </button>
                        <h1 className="text-3xl font-serif text-accent-yellow mb-1">QR Code Foto</h1>
                        <p className="text-white/50 text-sm">QR code untuk halaman kamera dan album tamu</p>
                    </div>
                    <button onClick={handlePrint} className="bg-accent-yellow hover:bg-accent-green text-night-900 font-bold px-5 py-2 rounded transition-all">
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Base URL setting — hidden on print */}
            <div className="max-w-4xl mx-auto mb-8 print:hidden">
                <div className="bg-night-800/50 border border-white/10 rounded-lg p-5">
                    <p className="text-white/60 text-sm mb-3">
                        <span className="text-white/40 mr-1">🔗</span>
                        Base URL yang tersimpan di database — dipakai untuk generate QR code.
                        Ganti ke URL deployment yang sudah di-publish agar QR tetap valid.
                    </p>
                    {!editing ? (
                        <div className="flex items-center gap-3">
                            <code className="flex-1 bg-night/60 border border-white/10 rounded px-4 py-2 text-accent-yellow text-sm font-mono truncate">
                                {loaded ? baseUrl : '⏳ Memuat...'}
                            </code>
                            <button onClick={() => setEditing(true)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-all shrink-0">
                                ✏️ Ubah
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="flex-1 bg-night/60 border border-accent-yellow/50 rounded px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent-yellow"
                                placeholder="https://your-app.replit.app"
                            />
                            <button onClick={handleSave} disabled={saving} className="bg-accent-yellow hover:bg-accent-green text-night-900 font-bold px-4 py-2 rounded text-sm transition-all shrink-0 disabled:opacity-50">
                                {saving ? '⏳' : '💾 Simpan'}
                            </button>
                            <button onClick={() => { setEditing(false); setEditUrl(baseUrl); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-all shrink-0">
                                Batal
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Cards */}
            <div ref={printRef} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-12 print:max-w-none print:p-8">
                {qrCards.map((card) => (
                    <div key={card.url} className={`${card.bgColor} border ${card.color} rounded-2xl p-8 flex flex-col items-center text-center print:border-2 print:border-gray-300 print:rounded-xl print:bg-white print:p-10`}>
                        <h2 className={`text-xl font-bold ${card.titleColor} mb-2 print:text-gray-900 print:text-2xl`}>
                            {card.label}
                        </h2>
                        <p className="text-white/50 text-sm mb-6 print:text-gray-500 print:mb-8">
                            {card.description}
                        </p>

                        {/* QR Code */}
                        <div className="bg-white p-5 rounded-xl shadow-lg mb-6 print:shadow-none print:p-4">
                            {loaded && (
                                <QRCode
                                    value={card.url}
                                    size={220}
                                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                    viewBox="0 0 256 256"
                                />
                            )}
                        </div>

                        {/* URL below QR */}
                        <code className="text-white/40 text-xs break-all px-2 print:text-gray-600 print:text-sm">
                            {card.url}
                        </code>
                    </div>
                ))}
            </div>

            {/* Print note */}
            <div className="max-w-4xl mx-auto mt-8 text-center print:hidden">
                <p className="text-white/30 text-sm">
                    Klik <strong className="text-white/50">🖨️ Print</strong> untuk mencetak QR code ini dan dipasang di venue.
                    QR akan terus valid selama base URL tidak berubah.
                </p>
            </div>
        </div>
    );
};

export default QRCodes;
