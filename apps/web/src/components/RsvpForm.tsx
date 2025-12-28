import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { TicketView } from './TicketView';

// Map URL paths to guest quotas
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
    const guestQuota = PATH_TO_QUOTA[location.pathname] || 1;

    const [formData, setFormData] = useState({
        name: '',
        attendanceChoice: 'Resepsi',
        attendanceStatus: 'Hadir',
        note: '',
        guestCount: 1
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<any>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/rsvp', {
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
                    RSVP Success!
                </div>
                {successData.attendanceStatus === 'Hadir' && successData.ticketToken && (
                    <TicketView name={successData.name} ticketToken={successData.ticketToken} />
                )}
                {successData.attendanceStatus === 'Tidak' && (
                    <p className="text-gray-300 text-center">Thank you for letting us know.</p>
                )}
                <div className="text-center space-y-3 mt-4">
                    <p className="text-gold-400 text-lg font-serif">
                        Thank you! We look forward to celebrating with you.
                    </p>
                    <p className="text-gray-400 text-sm">
                        {successData.attendanceStatus === 'Hadir'
                            ? 'Please save your ticket and show the QR code at the entrance.'
                            : 'We appreciate you letting us know.'}
                    </p>
                </div>
            </div>
        );
    }


    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto warm-card p-8 z-10 lantern-glow">
            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="name">
                    Name
                </label>
                <input
                    className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-tight focus:outline-none focus:border-lantern-glow placeholder-cream/40 focus:ring-2 focus:ring-lantern-glow/50 transition-all"
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif">
                    Attendance Status
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
                        <span className="ml-3 text-cream text-base">Attend</span>
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
                        <span className="ml-3 text-cream text-base">Cannot Attend</span>
                    </label>
                </div>
            </div>

            {/* Guest Count Selector - only show if attending */}
            {formData.attendanceStatus === 'Hadir' && (
                <div className="mb-6">
                    <label className="block text-lantern-light text-base font-semibold mb-3 font-serif">
                        Number of Guests
                    </label>
                    <p className="text-cream/70 text-sm mb-3">
                        You can bring up to {guestQuota} guest{guestQuota > 1 ? 's' : ''}
                    </p>
                    <select
                        name="guestCount"
                        value={formData.guestCount}
                        onChange={handleChange}
                        className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-tight focus:outline-none focus:border-lantern-glow focus:ring-2 focus:ring-lantern-glow/50 transition-all"
                    >
                        {Array.from({ length: guestQuota }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                                {num} guest{num > 1 ? 's' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}


            <div className={`mb-6 transition-all duration-300 ${formData.attendanceStatus === 'Tidak' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="attendanceChoice">
                    Event
                </label>
                <div className="relative">
                    <select
                        className="block appearance-none w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 pr-8 text-base leading-tight focus:outline-none focus:border-lantern-glow focus:ring-2 focus:ring-lantern-glow/50"
                        id="attendanceChoice"
                        name="attendanceChoice"
                        value={formData.attendanceChoice}
                        onChange={handleChange}
                    >
                        <option value="Resepsi">Resepsi</option>
                        <option value="Gereja">{import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</option>
                        <option value="Keduanya">Both</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-lantern-glow">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-lantern-light text-base font-semibold mb-3 font-serif" htmlFor="note">
                    Wishes & Messages (Optional)
                </label>
                <textarea
                    className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 text-base leading-relaxed focus:outline-none focus:border-lantern-glow placeholder-cream/40 focus:ring-2 focus:ring-lantern-glow/50 transition-all resize-none"
                    id="note"
                    name="note"
                    rows={4}
                    placeholder="Share your wishes for the couple..."
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
                {isLoading ? 'Submitting...' : 'Confirm RSVP'}
            </button>
        </form>
    );
};
