import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import QRCode from 'react-qr-code';
import { getApiUrl } from '../../config/api';

interface Guest {
    _id: string;
    name: string;
    attendanceStatus: string;
    attendanceChoice: string;
    note: string;
    adminNote?: string;
    guestCount?: number;
    guestCountReal?: number;
    angpauOption?: string;
    stickerNumber?: number;
    isCheckedIn?: boolean;
    checkedInAt?: string;
    checkInMethod?: string;
    checkInDesk?: string;
    ticketToken?: string;
    createdAt: string;
}

interface DeskStats {
    checkedIn: number;
    totalAttending: number;
    byEvent: { gereja: number; resepsi: number; keduanya: number };
}

const DESK_LABELS: Record<string, string> = {
    'reg-1': 'Meja Registrasi 1',
    'reg-2': 'Meja Registrasi 2',
};

export const RegDashboard = () => {
    const navigate = useNavigate();
    const { desk } = useParams<{ desk: string }>();
    const deskId = desk || 'reg-1';
    const deskLabel = DESK_LABELS[deskId] ?? `Meja ${deskId}`;

    const [guests, setGuests] = useState<Guest[]>([]);
    const [stats, setStats] = useState<DeskStats>({
        checkedIn: 0,
        totalAttending: 0,
        byEvent: { gereja: 0, resepsi: 0, keduanya: 0 },
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanResult, setScanResult] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showPhotoDrive, setShowPhotoDrive] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [selectedQrGuest, setSelectedQrGuest] = useState<Guest | null>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        attendanceStatus: 'Hadir',
        attendanceChoice: 'Resepsi',
        note: '',
        adminNote: '',
        guestCount: 1,
        guestCountReal: undefined as number | undefined,
        angpauOption: 'tanpa',
        isCheckedIn: false,
    });

    const token = localStorage.getItem('admin_token');
    const username = localStorage.getItem('admin_username');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) { navigate('/admin/login'); return; }
        fetchStats();
        fetchGuests();
    }, [page, search, token, deskId]);

    useEffect(() => {
        if (showScanner) initScanner();
        return () => {
            const el = document.getElementById('qr-reader-reg');
            if (el) el.innerHTML = '';
        };
    }, [showScanner]);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${getApiUrl()}/api/admin/stats?desk=${deskId}`, axiosConfig);
            setStats(res.data);
        } catch (err: any) {
            if (err.response?.status === 401) handleLogout();
        }
    };

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${getApiUrl()}/api/admin/guests?page=${page}&limit=20&desk=${deskId}&search=${encodeURIComponent(search)}`,
                axiosConfig
            );
            setGuests(res.data.guests);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err: any) {
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await axios.get(`${getApiUrl()}/api/admin/guests`, {
                ...axiosConfig,
                params: { page: 1, limit: 1000, desk: deskId },
            });
            const all: Guest[] = res.data.guests || [];
            if (all.length === 0) { alert('Tidak ada data tamu'); return; }
            const rows = all.map((g) => ({
                'Nama': g.name || '-',
                'Status': g.attendanceStatus || '-',
                'Acara': g.attendanceChoice || '-',
                'Tamu (RSVP)': g.guestCount || 1,
                'Tamu Real (Hari H)': g.guestCountReal ?? '-',
                'Angpau': g.angpauOption === 'kado' ? `Kado #${g.stickerNumber || '?'}` : g.angpauOption === 'transfer' ? 'Transfer' : 'Tanpa',
                'No. Stiker': g.stickerNumber || '-',
                'Wishes / Pesan': g.note || '-',
                'Catatan Admin': g.adminNote || '-',
                'Check-in': g.isCheckedIn ? 'Ya' : 'Tidak',
                'Meja Check-in': g.checkInDesk || '-',
                'Metode Check-in': g.checkInMethod || '-',
                'Waktu Check-in': g.checkedInAt ? new Date(g.checkedInAt).toLocaleString('id-ID') : '-',
                'Waktu RSVP': g.createdAt ? new Date(g.createdAt).toLocaleString('id-ID') : '-',
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Tamu');
            saveAs(
                new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
                    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `tamu-${deskId}-${new Date().toISOString().split('T')[0]}.xlsx`
            );
        } catch { alert('Gagal export data'); }
    };

    const initScanner = () => {
        const scanner = new Html5QrcodeScanner('qr-reader-reg', { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
        scanner.render(
            async (decodedText) => {
                setScanResult('Processing...');
                try {
                    const res = await axios.post(
                        `${getApiUrl()}/api/admin/checkin/scan`,
                        { qrData: decodedText, desk: deskId },
                        axiosConfig
                    );
                    setScanResult(res.data.success
                        ? `✅ ${res.data.guest.name} berhasil check-in!`
                        : `⚠️ ${res.data.message}`);
                    scanner.clear();
                    fetchStats();
                    fetchGuests();
                    setTimeout(() => { setShowScanner(false); setScanResult(''); }, 3000);
                } catch {
                    setScanResult('❌ Check-in gagal');
                }
            },
            () => {}
        );
    };

    const handleAddGuest = async () => {
        try {
            const res = await axios.post(`${getApiUrl()}/api/admin/guests`, formData, axiosConfig);
            if (res.data.success) {
                alert('Tamu berhasil ditambahkan!');
                setShowAddModal(false);
                setFormData({ name: '', attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi', note: '', adminNote: '', guestCount: 1, guestCountReal: undefined, angpauOption: 'tanpa', isCheckedIn: false });
                fetchGuests(); fetchStats();
            }
        } catch (err: any) { alert(err.response?.data?.message || 'Gagal menambah tamu'); }
    };

    const handleEditGuest = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData({
            name: guest.name,
            attendanceStatus: guest.attendanceStatus,
            attendanceChoice: guest.attendanceChoice,
            note: guest.note || '',
            adminNote: guest.adminNote || '',
            guestCount: guest.guestCount || 1,
            guestCountReal: guest.guestCountReal ?? guest.guestCount ?? 1,
            angpauOption: guest.angpauOption || 'tanpa',
            isCheckedIn: guest.isCheckedIn || false,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedGuest) return;
        try {
            const res = await axios.patch(`${getApiUrl()}/api/admin/guests/${selectedGuest._id}`, {
                attendanceStatus: formData.attendanceStatus,
                attendanceChoice: formData.attendanceChoice,
                note: formData.note,
                adminNote: formData.adminNote,
                guestCount: formData.guestCount,
                guestCountReal: formData.guestCountReal ?? null,
                angpauOption: formData.angpauOption,
                isCheckedIn: formData.isCheckedIn,
            }, axiosConfig);
            if (res.data.success) {
                alert('Data tamu berhasil diupdate!');
                setShowEditModal(false); setSelectedGuest(null);
                fetchGuests(); fetchStats();
            }
        } catch (err: any) { alert(err.response?.data?.message || 'Gagal update tamu'); }
    };

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/photos`);
            setPhotos(await res.json());
        } catch { }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!window.confirm('Hapus foto ini?')) return;
        try {
            const res = await axios.post(`${getApiUrl()}/api/photos/${photoId}/delete`, { id: photoId });
            if (res.status === 200 || res.status === 201) setPhotos(photos.filter(p => p._id !== photoId));
        } catch { alert('Gagal menghapus foto'); }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        navigate('/admin/login');
    };

    const ceremonyLabel = import.meta.env.VITE_CEREMONY_LABEL || 'Gereja';

    return (
        <div className="min-h-screen bg-night p-4 md:p-8">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/admin/choose')} className="text-white/40 hover:text-white/70 text-sm mb-2 flex items-center gap-1 transition-colors">
                            ← Pilih Dashboard
                        </button>
                        <h1 className="text-3xl font-serif text-accent-yellow mb-2">{deskLabel}</h1>
                        <p className="text-white/60">Welcome, {username}</p>
                    </div>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded border border-red-500/50 transition-all">
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats row 1 */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-night-800/50 border border-accent-yellow/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">✅ Check-in di Meja Ini</div>
                    <div className="text-3xl font-bold text-accent-yellow">{stats.checkedIn}</div>
                </div>
                <div className="bg-night-800/50 border border-green-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">🎉 Total Tamu Hadir (Global)</div>
                    <div className="text-3xl font-bold text-green-400">{stats.totalAttending}</div>
                </div>
            </div>

            {/* Stats row 2 — by event at this desk */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-night-800/50 border border-blue-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">⛪ {ceremonyLabel} (meja ini)</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.byEvent.gereja}</div>
                </div>
                <div className="bg-night-800/50 border border-purple-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">🎉 Resepsi (meja ini)</div>
                    <div className="text-3xl font-bold text-purple-400">{stats.byEvent.resepsi}</div>
                </div>
                <div className="bg-night-800/50 border border-pink-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">💒 Keduanya (meja ini)</div>
                    <div className="text-3xl font-bold text-pink-400">{stats.byEvent.keduanya}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <input
                    type="text"
                    placeholder="Cari nama tamu..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full md:w-96 bg-night-800/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                />
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowAddModal(true)} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded font-medium transition-all">
                        ➕ Add Guest
                    </button>
                    <button
                        onClick={() => setShowScanner(!showScanner)}
                        className="bg-accent-yellow hover:bg-accent-green text-night-900 px-5 py-2 rounded font-medium transition-all"
                    >
                        📷 {showScanner ? 'Tutup Scanner' : 'Scan QR'}
                    </button>
                    <button onClick={() => { fetchPhotos(); setShowPhotoDrive(true); }} className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded font-medium transition-all">
                        🖼️ Photo Drive
                    </button>
                    <button onClick={handleExport} className="bg-accent-green hover:bg-accent-green-dark text-night-900 px-5 py-2 rounded font-medium transition-all">
                        📊 Export Excel
                    </button>
                </div>
            </div>

            {/* QR Scanner */}
            {showScanner && (
                <div className="max-w-7xl mx-auto mb-6 bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <h3 className="text-xl text-accent-yellow mb-4">Scan QR Tamu — {deskLabel}</h3>
                    <div id="qr-reader-reg" className="w-full max-w-md mx-auto"></div>
                    {scanResult && <div className="mt-4 text-center text-lg text-white">{scanResult}</div>}
                </div>
            )}

            {/* Guest Table */}
            <div className="max-w-7xl mx-auto bg-night-800/50 border border-accent-green/30 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-accent-yellow/10 border-b border-accent-green/30">
                            <tr>
                                <th className="text-left p-4 text-accent-yellow font-medium w-10">#</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Nama</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Status</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Acara</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Tamu</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Angpau</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Pesan</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Catatan Admin</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Check-in</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className="text-center p-8 text-white/60">Loading...</td></tr>
                            ) : guests.length === 0 ? (
                                <tr><td colSpan={10} className="text-center p-8 text-white/60">Tidak ada tamu ditemukan</td></tr>
                            ) : (
                                guests.map((guest, idx) => (
                                    <tr
                                        key={guest._id}
                                        className={`border-b border-accent-green/10 transition-colors ${
                                            guest.checkInDesk === deskId
                                                ? 'bg-accent-yellow/5 hover:bg-accent-yellow/10'
                                                : 'hover:bg-accent-green/5'
                                        }`}
                                    >
                                        <td className="p-4 text-white/50 text-sm font-mono">{(page - 1) * 20 + idx + 1}</td>
                                        <td className="p-4 text-white">{guest.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${guest.attendanceStatus === 'Hadir' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {guest.attendanceStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/80">{guest.attendanceChoice}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                                                {guest.guestCountReal !== undefined
                                                    ? <><span className="line-through opacity-50">{guest.guestCount || 1}</span> → {guest.guestCountReal}</>
                                                    : <>{guest.guestCount || 1}</>
                                                } 👥
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {!guest.angpauOption || guest.angpauOption === 'tanpa'
                                                ? <span className="text-white/40 text-sm">–</span>
                                                : guest.angpauOption === 'transfer'
                                                    ? <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">Transfer</span>
                                                    : <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 font-mono font-bold">🎁 #{guest.stickerNumber}</span>
                                            }
                                        </td>
                                        <td className="p-4 text-white/60 text-sm max-w-xs truncate">{guest.note || '–'}</td>
                                        <td className="p-4 text-white/60 text-sm max-w-xs truncate">{guest.adminNote || '–'}</td>
                                        <td className="p-4">
                                            {guest.checkedInAt ? (
                                                <div className="text-sm">
                                                    <div className="text-green-400">✓ Ya</div>
                                                    <div className="text-white/40 text-xs">{new Date(guest.checkedInAt).toLocaleString()}</div>
                                                    <div className="text-white/40 text-xs">{guest.checkInDesk || guest.checkInMethod}</div>
                                                </div>
                                            ) : <span className="text-white/40">–</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditGuest(guest)} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded text-sm transition-all">
                                                    ✏️ Edit
                                                </button>
                                                {guest.ticketToken && (
                                                    <button onClick={() => { setSelectedQrGuest(guest); setShowQrModal(true); }} className="bg-accent-yellow/20 hover:bg-accent-yellow/40 text-accent-yellow px-3 py-1 rounded text-sm transition-all">
                                                        📱 QR
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 flex justify-center gap-2 border-t border-accent-green/30">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-accent-green/20 text-accent-yellow rounded disabled:opacity-50 hover:bg-accent-green/30 transition-all">
                            Previous
                        </button>
                        <span className="px-4 py-2 text-white">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-accent-green/20 text-accent-yellow rounded disabled:opacity-50 hover:bg-accent-green/30 transition-all">
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add Guest Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-night-800 border border-accent-green/30 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-serif text-accent-yellow mb-6">Tambah Tamu</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/80 mb-2">Nama</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow" placeholder="Nama tamu" />
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Status Kehadiran</label>
                                <select value={formData.attendanceStatus} onChange={(e) => setFormData({ ...formData, attendanceStatus: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="Hadir">Hadir</option>
                                    <option value="Tidak">Tidak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Acara</label>
                                <select value={formData.attendanceChoice} onChange={(e) => setFormData({ ...formData, attendanceChoice: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="Gereja">{ceremonyLabel}</option>
                                    <option value="Resepsi">Resepsi</option>
                                    <option value="Keduanya">Keduanya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Jumlah Tamu</label>
                                <input type="number" min={1} value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow" />
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Angpau / Gift</label>
                                <select value={formData.angpauOption} onChange={(e) => setFormData({ ...formData, angpauOption: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="tanpa">Tanpa Angpao</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="kado">Kado / Amplop</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Wishes (opsional)</label>
                                <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow h-20" placeholder="Pesan dari tamu..." />
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Catatan Admin (opsional)</label>
                                <textarea value={formData.adminNote} onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow h-20" placeholder="Catatan internal..." />
                            </div>
                            <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                                <input type="checkbox" checked={formData.isCheckedIn} onChange={(e) => setFormData({ ...formData, isCheckedIn: e.target.checked })} className="w-4 h-4" />
                                <span>Langsung check-in</span>
                            </label>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleAddGuest} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-all">Tambah</button>
                                <button onClick={() => { setShowAddModal(false); setFormData({ name: '', attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi', note: '', adminNote: '', guestCount: 1, guestCountReal: undefined, angpauOption: 'tanpa', isCheckedIn: false }); }} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-3 px-4 rounded transition-all">Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Guest Modal */}
            {showEditModal && selectedGuest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-night-800 border border-accent-green/30 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-serif text-accent-yellow mb-6">Edit: {selectedGuest.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/80 mb-2">Status Kehadiran</label>
                                <select value={formData.attendanceStatus} onChange={(e) => setFormData({ ...formData, attendanceStatus: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="Hadir">Hadir</option>
                                    <option value="Tidak">Tidak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Acara</label>
                                <select value={formData.attendanceChoice} onChange={(e) => setFormData({ ...formData, attendanceChoice: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="Gereja">{ceremonyLabel}</option>
                                    <option value="Resepsi">Resepsi</option>
                                    <option value="Keduanya">Keduanya</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-white/50 mb-2 text-sm">Tamu (RSVP asli)</label>
                                    <input type="number" value={formData.guestCount} disabled className="w-full bg-night/20 text-white/40 border border-white/10 rounded py-2 px-3 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2 text-sm">Tamu real (hari H)</label>
                                    <input type="number" min={1} value={formData.guestCountReal ?? ''} onChange={(e) => setFormData({ ...formData, guestCountReal: e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1) })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-3 focus:outline-none focus:border-accent-yellow" placeholder="–" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Angpau / Gift</label>
                                <select value={formData.angpauOption} onChange={(e) => setFormData({ ...formData, angpauOption: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow">
                                    <option value="tanpa">Tanpa Angpao</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="kado">Kado / Amplop</option>
                                </select>
                                {formData.angpauOption === 'kado' && selectedGuest?.stickerNumber && (
                                    <p className="mt-2 text-amber-400 text-sm font-mono">Stiker: #{selectedGuest.stickerNumber}</p>
                                )}
                                {formData.angpauOption === 'kado' && !selectedGuest?.stickerNumber && (
                                    <p className="mt-2 text-amber-400/70 text-xs">Nomor stiker baru akan ditetapkan saat disimpan.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-white/60 mb-1 text-sm">Wishes (dari tamu)</label>
                                <div className="w-full bg-night/30 text-white/70 border border-white/10 rounded py-2 px-4 text-sm min-h-[3rem] italic">
                                    {formData.note || <span className="text-white/30">– (tidak ada wishes) –</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Catatan Admin</label>
                                <textarea value={formData.adminNote} onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })} className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow h-20" placeholder="Catatan internal admin..." />
                            </div>
                            <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                                <input type="checkbox" checked={formData.isCheckedIn} onChange={(e) => setFormData({ ...formData, isCheckedIn: e.target.checked })} className="w-4 h-4" />
                                <span>Mark as checked-in</span>
                            </label>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleSaveEdit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-all">Simpan</button>
                                <button onClick={() => { setShowEditModal(false); setSelectedGuest(null); }} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-3 px-4 rounded transition-all">Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR View Modal */}
            {showQrModal && selectedQrGuest && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
                    <div className="bg-night-800 border border-accent-yellow/30 rounded-lg p-8 max-w-sm w-full text-center">
                        <h2 className="text-2xl font-serif text-accent-yellow mb-2">Tiket Tamu</h2>
                        <p className="text-white/60 mb-6">{selectedQrGuest.name}</p>
                        <div className="bg-white p-4 inline-block rounded-lg shadow-xl mb-6">
                            {selectedQrGuest.ticketToken ? (
                                <QRCode value={selectedQrGuest.ticketToken} size={200} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} viewBox="0 0 256 256" />
                            ) : (
                                <div className="w-[200px] h-[200px] flex items-center justify-center text-night text-sm italic">No ticket token</div>
                            )}
                        </div>
                        <p className="text-white/40 text-sm mb-8">QR code untuk check-in di pintu masuk.</p>
                        <button onClick={() => { setShowQrModal(false); setSelectedQrGuest(null); }} className="w-full bg-accent-yellow hover:bg-accent-green text-night font-bold py-3 px-6 rounded-lg transition-all">
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Photo Drive Modal */}
            {showPhotoDrive && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70] p-4">
                    <div className="bg-night-800 border border-purple-500/30 rounded-lg p-8 max-w-5xl w-full h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-accent-yellow">Photo Drive Gallery</h2>
                            <button onClick={() => setShowPhotoDrive(false)} className="text-white/60 hover:text-white">✕ Tutup</button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {photos.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-white/40 italic">Belum ada foto yang diupload.</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {photos.map((photo) => (
                                        <div key={photo._id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                            <img src={photo.url || `${getApiUrl()}/uploads/${photo.filename}`} alt="Guest Memory" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => handleDeletePhoto(photo._id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full" title="Hapus Foto">🗑️</button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[10px] text-white/60 truncate">{new Date(photo.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                            <p className="text-white/40 text-sm">Total: {photos.length} foto</p>
                            <button onClick={() => setShowPhotoDrive(false)} className="bg-night/50 hover:bg-night border border-white/20 text-white px-6 py-2 rounded">Selesai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegDashboard;
