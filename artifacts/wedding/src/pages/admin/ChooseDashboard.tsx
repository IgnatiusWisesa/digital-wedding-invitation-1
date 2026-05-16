import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const desks = [
    {
        id: 'master',
        label: 'Master Dashboard',
        icon: '👑',
        description: 'Lihat semua tamu, statistik lengkap, import/export',
        path: '/admin/dashboard',
        color: 'border-accent-yellow/50 hover:border-accent-yellow',
        badge: 'text-accent-yellow',
    },
    {
        id: 'reg-1',
        label: 'Meja Registrasi 1',
        icon: '🪑',
        description: 'Scan QR & catat tamu yang check-in di meja ini',
        path: '/admin/reg/reg-1',
        color: 'border-blue-400/50 hover:border-blue-400',
        badge: 'text-blue-300',
    },
    {
        id: 'reg-2',
        label: 'Meja Registrasi 2',
        icon: '🪑',
        description: 'Scan QR & catat tamu yang check-in di meja ini',
        path: '/admin/reg/reg-2',
        color: 'border-purple-400/50 hover:border-purple-400',
        badge: 'text-purple-300',
    },
];

export const ChooseDashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');
    const username = localStorage.getItem('admin_username');

    useEffect(() => {
        if (!token) navigate('/admin/login');
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-night flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="text-5xl mb-4">💒</div>
                    <h1 className="text-3xl font-serif text-accent-yellow mb-2">Wisesa & Nirani</h1>
                    <p className="text-white/50 text-sm">Selamat datang, <span className="text-white/80">{username}</span></p>
                </div>

                <p className="text-white/60 text-center text-sm uppercase tracking-widest mb-6">Pilih Dashboard</p>

                <div className="space-y-4">
                    {desks.map((desk) => (
                        <button
                            key={desk.id}
                            onClick={() => navigate(desk.path)}
                            className={`w-full text-left bg-night-800/60 border ${desk.color} rounded-xl p-5 transition-all duration-200 hover:bg-night-800/90 hover:scale-[1.01] group`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{desk.icon}</span>
                                <div className="flex-1">
                                    <p className={`font-bold text-lg ${desk.badge}`}>{desk.label}</p>
                                    <p className="text-white/50 text-sm mt-0.5">{desk.description}</p>
                                </div>
                                <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => navigate('/admin/qrcodes')}
                            className="text-left bg-night-800/40 border border-white/10 hover:border-white/30 rounded-xl p-4 transition-all duration-200 hover:bg-night-800/70 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📱</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white/70 group-hover:text-white transition-colors text-sm">QR Kamera &amp; Album</p>
                                    <p className="text-white/40 text-xs mt-0.5 truncate">Print QR code foto</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/admin/photos')}
                            className="text-left bg-night-800/40 border border-white/10 hover:border-white/30 rounded-xl p-4 transition-all duration-200 hover:bg-night-800/70 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🖼️</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white/70 group-hover:text-white transition-colors text-sm">Manajemen Foto</p>
                                    <p className="text-white/40 text-xs mt-0.5 truncate">Lihat &amp; hapus foto tamu</p>
                                </div>
                            </div>
                        </button>
                    </div>
                    <button onClick={handleLogout} className="text-red-400/60 hover:text-red-400 text-sm transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};
