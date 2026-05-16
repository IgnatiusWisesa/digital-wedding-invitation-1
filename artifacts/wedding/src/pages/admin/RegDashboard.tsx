import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getApiUrl } from '../../config/api';

interface CheckedInGuest {
    _id: string;
    name: string;
    guestCount?: number;
    guestCountReal?: number;
    angpauOption?: string;
    stickerNumber?: number;
    checkedInAt?: string;
    attendanceChoice?: string;
}

interface ScanResult {
    success: boolean;
    message: string;
    guest?: CheckedInGuest;
}

const DESK_LABELS: Record<string, string> = {
    'reg-1': 'Meja Registrasi 1',
    'reg-2': 'Meja Registrasi 2',
};

const DESK_COLORS: Record<string, string> = {
    'reg-1': 'text-blue-300',
    'reg-2': 'text-purple-300',
};

export const RegDashboard = () => {
    const { desk } = useParams<{ desk: string }>();
    const deskId = desk || 'reg-1';
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    const [guests, setGuests] = useState<CheckedInGuest[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'confirm' | 'done'>('idle');
    const [scannedGuest, setScannedGuest] = useState<CheckedInGuest | null>(null);
    const [scanMessage, setScanMessage] = useState('');
    const [angpauOption, setAngpauOption] = useState<'tanpa' | 'transfer' | 'kado'>('tanpa');
    const [guestCountReal, setGuestCountReal] = useState<number>(1);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (!token) { navigate('/admin/login'); return; }
        if (!DESK_LABELS[deskId]) { navigate('/admin/choose'); return; }
        fetchGuests();
    }, [deskId, token]);

    useEffect(() => {
        if (showScanner && scanState === 'scanning') {
            initScanner();
        }
        return () => {
            if (scannerRef.current) {
                try { scannerRef.current.clear(); } catch { }
                scannerRef.current = null;
            }
        };
    }, [showScanner, scanState]);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const res = await axios.get(`${API_URL}/api/admin/guests?desk=${deskId}&limit=100`, axiosConfig);
            setGuests(res.data.guests || []);
        } catch (e: any) {
            if (e.response?.status === 401) navigate('/admin/login');
        } finally {
            setLoading(false);
        }
    };

    const initScanner = () => {
        const el = document.getElementById('reg-qr-reader');
        if (!el) return;
        el.innerHTML = '';
        const scanner = new Html5QrcodeScanner('reg-qr-reader', { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
        scannerRef.current = scanner;
        scanner.render(
            async (decodedText) => {
                try { scanner.clear(); } catch { }
                scannerRef.current = null;
                setScanState('confirm');
                setScanMessage('');
                try {
                    const API_URL = getApiUrl();
                    const res = await axios.post(
                        `${API_URL}/api/admin/checkin/scan`,
                        { qrData: decodedText, desk: deskId },
                        axiosConfig
                    );
                    if (res.data.success) {
                        const g = res.data.guest;
                        setScannedGuest(g);
                        setGuestCountReal(g.guestCount || 1);
                        setAngpauOption('tanpa');
                        setScanState('confirm');
                    } else {
                        setScanMessage(res.data.message || 'Check-in gagal');
                        setScanState('done');
                    }
                } catch {
                    setScanMessage('❌ Gagal memproses QR');
                    setScanState('done');
                }
            },
            () => { }
        );
    };

    const handleConfirm = async () => {
        if (!scannedGuest) return;
        try {
            const API_URL = getApiUrl();
            await axios.patch(
                `${API_URL}/api/admin/guests/${scannedGuest._id}`,
                { guestCountReal, angpauOption },
                axiosConfig
            );
        } catch { }
        fetchGuests();
        setScanState('done');
        setScanMessage(`✅ ${scannedGuest.name} berhasil check-in!`);
        setScannedGuest(null);
    };

    const openScanner = () => {
        setShowScanner(true);
        setScanState('scanning');
        setScanMessage('');
        setScannedGuest(null);
    };

    const closeScanner = () => {
        if (scannerRef.current) { try { scannerRef.current.clear(); } catch { } scannerRef.current = null; }
        setShowScanner(false);
        setScanState('idle');
    };

    const deskLabel = DESK_LABELS[deskId];
    const deskColor = DESK_COLORS[deskId] || 'text-white';

    return (
        <div className="min-h-screen bg-night p-4 md:p-8">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/admin/choose')} className="text-white/40 hover:text-white/70 text-sm mb-2 flex items-center gap-1 transition-colors">
                            ← Kembali
                        </button>
                        <h1 className={`text-2xl font-serif ${deskColor}`}>{deskLabel}</h1>
                        <p className="text-white/50 text-sm">{guests.length} tamu check-in di meja ini</p>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_username'); navigate('/admin/login'); }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded border border-red-500/50 transition-all text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Scan Button */}
            <div className="max-w-3xl mx-auto mb-6">
                <button
                    onClick={showScanner ? closeScanner : openScanner}
                    className="w-full bg-accent-yellow hover:bg-accent-green text-night-900 font-bold py-4 rounded-xl text-lg transition-all shadow-lg"
                >
                    {showScanner ? '✕ Tutup Scanner' : '📷 Scan QR Tamu'}
                </button>
            </div>

            {/* Scanner Area */}
            {showScanner && (
                <div className="max-w-3xl mx-auto mb-6 bg-night-800/50 border border-accent-green/30 rounded-xl p-6">
                    {scanState === 'scanning' && (
                        <>
                            <h3 className="text-accent-yellow text-center mb-4 font-medium">Arahkan kamera ke QR code tamu</h3>
                            <div id="reg-qr-reader" className="w-full max-w-sm mx-auto"></div>
                        </>
                    )}

                    {scanState === 'confirm' && scannedGuest && (
                        <div className="text-center space-y-5">
                            <div className="text-4xl">👤</div>
                            <div>
                                <p className="text-white/60 text-sm">Tamu ditemukan</p>
                                <p className="text-2xl font-serif text-white mt-1">{scannedGuest.name}</p>
                                <p className="text-white/50 text-sm mt-1">{scannedGuest.attendanceChoice} · {scannedGuest.guestCount} tamu (RSVP)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">Jumlah Tamu Hadir</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={guestCountReal}
                                        onChange={(e) => setGuestCountReal(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-3 focus:outline-none focus:border-accent-yellow text-center text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider block mb-1">Angpau</label>
                                    <select
                                        value={angpauOption}
                                        onChange={(e) => setAngpauOption(e.target.value as any)}
                                        className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-3 focus:outline-none focus:border-accent-yellow"
                                    >
                                        <option value="tanpa">Tanpa</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="kado">Kado 🎁</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button onClick={handleConfirm} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all">
                                    ✓ Konfirmasi Check-in
                                </button>
                                <button onClick={closeScanner} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all">
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}

                    {scanState === 'done' && (
                        <div className="text-center space-y-4 py-4">
                            <p className="text-xl text-white">{scanMessage}</p>
                            <button onClick={openScanner} className="bg-accent-yellow hover:bg-accent-green text-night-900 px-8 py-3 rounded-lg font-bold transition-all">
                                📷 Scan Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Check-in List */}
            <div className="max-w-3xl mx-auto bg-night-800/50 border border-accent-green/30 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-accent-green/20">
                    <h2 className="text-white font-medium">Tamu yang Check-in di Meja Ini</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-white/40">Memuat...</div>
                ) : guests.length === 0 ? (
                    <div className="p-8 text-center text-white/40">Belum ada tamu yang check-in di meja ini</div>
                ) : (
                    <div className="divide-y divide-accent-green/10">
                        {guests.map((guest, idx) => (
                            <div key={guest._id} className="px-6 py-4 flex items-center gap-4 hover:bg-accent-green/5 transition-colors">
                                <span className="text-white/30 text-sm font-mono w-7 shrink-0">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{guest.name}</p>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        {guest.attendanceChoice}
                                        {' · '}
                                        {guest.guestCountReal !== undefined
                                            ? <><span className="line-through opacity-50">{guest.guestCount}</span> → {guest.guestCountReal}</>
                                            : guest.guestCount
                                        } 👥
                                        {guest.checkedInAt && (
                                            <> · {new Date(guest.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</>
                                        )}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {!guest.angpauOption || guest.angpauOption === 'tanpa' ? (
                                        <span className="text-white/30 text-xs">–</span>
                                    ) : guest.angpauOption === 'transfer' ? (
                                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">Transfer</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 font-mono font-bold">🎁 #{guest.stickerNumber}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Refresh */}
            <div className="max-w-3xl mx-auto mt-4 text-center">
                <button onClick={fetchGuests} className="text-white/30 hover:text-white/60 text-sm transition-colors">
                    ↻ Refresh daftar
                </button>
            </div>
        </div>
    );
};
