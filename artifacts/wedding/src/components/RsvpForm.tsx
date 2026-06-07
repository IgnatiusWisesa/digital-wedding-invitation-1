import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { TicketView } from './TicketView';
import { getApiUrl } from '../config/api';
import { useInvite } from '../context/InviteContext';

// Map URL paths to guest quotas (used when no invite context)
const PATH_TO_QUOTA: Record<string, number> = {
    '/': 1,
    '/two': 2,
    '/three': 3,
    '/four': 4,
    '/five': 5,
    '/six': 6,
    '/seven': 7,
    '/eight': 8,
    '/nine': 9,
    '/ten': 10,
    '/eleven': 11,
    '/twelve': 12,
    '/thirteen': 13,
    '/fourteen': 14,
    '/fifteen': 15,
    '/sixteen': 16,
    '/seventeen': 17,
    '/eighteen': 18,
    '/nineteen': 19,
    '/twenty': 20,
};

export const RsvpForm: React.FC = () => {
    const location = useLocation();
    const invite = useInvite();

    // Quota: use invite quota if available, else path-based
    const guestQuota = invite ? invite.quota : (PATH_TO_QUOTA[location.pathname] || 1);

    // Default event choice: if invite locks to single event, use it; else 'Resepsi'
    const defaultChoice = invite
        ? (invite.event === 'Keduanya' ? 'Resepsi' : invite.event)
        : 'Resepsi';

    const [formData, setFormData] = useState({
        name: invite?.name || '',
        attendanceChoice: defaultChoice,
        attendanceStatus: 'Hadir',
        note: '',
        guestCount: guestQuota,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<any>(null);
    const [existingRsvp, setExistingRsvp] = useState<any>(null);
    const [checkingExisting, setCheckingExisting] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Sync name/choice if invite loads asynchronously (shouldn't happen, but safety net)
    useEffect(() => {
        if (invite) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || invite.name,
                attendanceChoice: invite.event === 'Keduanya' ? prev.attendanceChoice : invite.event,
            }));
        }
    }, [invite]);

    // Cek apakah tamu sudah pernah RSVP sebelumnya
    useEffect(() => {
        if (!invite?.name) return;
        const API_URL = getApiUrl();
        setCheckingExisting(true);
        axios.get(`${API_URL}/api/rsvp/lookup?name=${encodeURIComponent(invite.name)}`)
            .then(r => {
                if (r.data.found) setExistingRsvp(r.data.rsvp);
            })
            .catch(() => {})
            .finally(() => setCheckingExisting(false));
    }, [invite?.name]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const API_URL = getApiUrl();
            const response = await axios.post(`${API_URL}/api/rsvp`, {
                ...formData,
                guestQuota,
                guestCount: formData.attendanceStatus === 'Hadir' ? formData.guestCount : 1
            });
            if (response.data.success) {
                setSuccessData(response.data.rsvp);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
                <div className="bg-gold-500 text-night px-6 py-3 rounded-full font-bold shadow-lg">
                    RSVP Berhasil!
                </div>
                {successData.attendanceStatus === 'Hadir' && successData.ticketToken && (
                    <TicketView name={successData.name} ticketToken={successData.ticketToken} />
                )}
                {successData.attendanceStatus === 'Tidak' && (
                    <p className="text-gray-300 text-center">Terima kasih sudah memberi tahu kami.</p>
                )}
                <div className="text-center space-y-3 mt-4">
                    <p className="text-gold-400 text-lg font-serif">
                        Terima kasih! Kami menantikan kehadiran Anda.
                    </p>
                    <p className="text-gray-400 text-sm">
                        {successData.attendanceStatus === 'Hadir'
                            ? 'Simpan tiket Anda dan tunjukkan QR code di pintu masuk.'
                            : 'Kami menghargai pemberitahuan Anda.'}
                    </p>
                </div>
            </div>
        );
    }

    // Tamu sudah pernah RSVP — tampilkan status & tiket mereka (kecuali sedang mode edit)
    if (!checkingExisting && existingRsvp && !editMode) {
        return (
            <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
                {existingRsvp.attendanceStatus === 'Hadir' && existingRsvp.ticketToken && (
                    <TicketView name={existingRsvp.name} ticketToken={existingRsvp.ticketToken} />
                )}

                {existingRsvp.attendanceStatus === 'Tidak' && (
                    <div className="text-center space-y-3 px-4">
                        <p className="text-cream/80">
                            Halo <span className="text-lantern-light font-semibold">{existingRsvp.name}</span>,
                            Anda sebelumnya mengonfirmasi <strong>tidak hadir</strong>.
                        </p>
                        <p className="text-cream/50 text-sm">Terima kasih sudah memberi tahu kami.</p>
                    </div>
                )}

                <button
                    onClick={() => setEditMode(true)}
                    className="text-cream/40 hover:text-cream/70 text-sm underline underline-offset-2 transition-colors"
                >
                    Ubah RSVP
                </button>
            </div>
        );
    }

    // Determine available event options based on invite
    const eventOptions = !invite
        ? [
            { value: 'Resepsi', label: 'Resepsi' },
            { value: 'Gereja', label: 'Gereja' },
            { value: 'Keduanya', label: 'Keduanya' },
        ]
        : invite.event === 'Keduanya'
            ? [
                { value: 'Resepsi', label: 'Resepsi' },
                { value: 'Gereja', label: 'Gereja' },
                { value: 'Keduanya', label: 'Keduanya' },
            ]
            : [{ value: invite.event, label: invite.event }]; // single locked option

    const eventLocked = invite && invite.event !== 'Keduanya';

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto warm-card p-8 relative z-10 lantern-glow">
            {/* Tombol kembali ke tiket saat mode edit */}
            {editMode && existingRsvp && (
                <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-2 text-cream/50 hover:text-cream text-sm mb-6 transition-colors"
                >
                    ← Kembali ke Tiket Saya
                </button>
            )}
            {/* Name */}
            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="name">
                    {invite ? 'Nama' : 'Name'}
                </label>
                <input
                    className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-tight focus:outline-none focus:border-lantern-glow placeholder-cream/40 focus:ring-2 focus:ring-lantern-glow/50 transition-all"
                    id="name"
                    name="name"
                    type="text"
                    placeholder={invite ? 'Nama Anda' : 'Enter your name'}
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Attendance */}
            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif">
                    {invite ? 'Konfirmasi Kehadiran' : 'Attendance Status'}
                </label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="attendanceStatus"
                            value="Hadir"
                            checked={formData.attendanceStatus === 'Hadir'}
                            onChange={handleChange}
                            className="form-radio text-lantern-glow focus:ring-lantern-glow bg-garden-night border-lantern-glow/50 w-5 h-5"
                        />
                        <span className="ml-3 text-cream text-base">Hadir</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="attendanceStatus"
                            value="Tidak"
                            checked={formData.attendanceStatus === 'Tidak'}
                            onChange={handleChange}
                            className="form-radio text-lantern-glow focus:ring-lantern-glow bg-garden-night border-lantern-glow/50 w-5 h-5"
                        />
                        <span className="ml-3 text-cream text-base">Tidak Hadir</span>
                    </label>
                </div>
            </div>

            {/* Guest Count — only if attending */}
            {formData.attendanceStatus === 'Hadir' && (
                <div className="mb-6">
                    <label className="block text-lantern-light text-base font-semibold mb-3 font-serif">
                        {invite ? 'Jumlah Tamu' : 'Number of Guests'}
                    </label>
                    <p className="text-cream/70 text-sm mb-3">
                        {invite
                            ? `Maksimal ${guestQuota} tamu`
                            : `You can bring up to ${guestQuota} guest${guestQuota > 1 ? 's' : ''}`}
                    </p>
                    <select
                        name="guestCount"
                        value={formData.guestCount}
                        onChange={handleChange}
                        className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-tight focus:outline-none focus:border-lantern-glow focus:ring-2 focus:ring-lantern-glow/50 transition-all"
                    >
                        {Array.from({ length: guestQuota }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                                {num} {invite ? 'tamu' : `guest${num > 1 ? 's' : ''}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Event */}
            <div className={`mb-6 transition-all duration-300 ${formData.attendanceStatus === 'Tidak' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="attendanceChoice">
                    {invite ? 'Acara' : 'Event'}
                </label>
                <div className="relative">
                    <select
                        className={`block appearance-none w-full bg-garden-night/70 text-cream border-2 rounded-lg py-3 px-4 pr-8 text-base leading-tight focus:outline-none focus:ring-2 focus:ring-lantern-glow/50 transition-all ${
                            eventLocked
                                ? 'border-white/20 text-cream/70 cursor-not-allowed bg-garden-night/40'
                                : 'border-lantern-glow/40 focus:border-lantern-glow'
                        }`}
                        id="attendanceChoice"
                        name="attendanceChoice"
                        value={formData.attendanceChoice}
                        onChange={handleChange}
                        disabled={!!eventLocked}
                    >
                        {eventOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {!eventLocked && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-lantern-glow">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Wishes */}
            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="note">
                    {invite ? 'Pesan & Ucapan (Opsional)' : 'Wishes & Messages (Optional)'}
                </label>
                <textarea
                    className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-relaxed focus:outline-none focus:border-lantern-glow placeholder-cream/40 focus:ring-2 focus:ring-lantern-glow/50 transition-all resize-none"
                    id="note"
                    name="note"
                    rows={4}
                    placeholder={invite ? 'Sampaikan ucapan untuk kedua mempelai...' : 'Share your wishes for the couple...'}
                    value={formData.note}
                    onChange={handleChange}
                />
            </div>

            {error && (
                <div className="mb-4 p-4 bg-sunset-rose/20 border border-sunset-rose/50 rounded-lg text-cream text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-lantern-glow to-lantern-gold hover:from-lantern-gold hover:to-lantern-glow text-garden-dark font-bold py-4 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base lantern-glow"
            >
                {isLoading ? (invite ? 'Mengirim...' : 'Submitting...') : (invite ? 'Konfirmasi RSVP' : 'Confirm RSVP')}
            </button>
        </form>
    );
};
