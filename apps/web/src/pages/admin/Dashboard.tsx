import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Guest {
    _id: string;
    name: string;
    attendanceStatus: string;
    attendanceChoice: string;
    note: string;
    isCheckedIn?: boolean;
    checkedInAt?: string;
    checkInMethod?: string;
    createdAt: string;
}

interface Stats {
    total: number;
    attending: number;
    notAttending: number;
    checkedIn: number;
    totalGuestCount?: number;
    byEvent?: {
        gereja: number;
        resepsi: number;
        keduanya: number;
    };
}

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        attending: 0,
        notAttending: 0,
        checkedIn: 0,
        totalGuestCount: 0,
        byEvent: { gereja: 0, resepsi: 0, keduanya: 0 }
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanResult, setScanResult] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [formData, setFormData] = useState({ name: '', attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi', note: '', isCheckedIn: false });
    const username = localStorage.getItem('admin_username');

    const token = localStorage.getItem('admin_token');
    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    useEffect(() => {
        console.log('=== DASHBOARD COMPONENT MOUNTED ===');
        console.log('Token from localStorage:', token ? 'EXISTS' : 'NULL');
        if (token) {
            fetchStats();
            fetchGuests();
        }
    }, [page, search, token]);

    useEffect(() => {
        if (showScanner) {
            initScanner();
        }
        return () => {
            // Cleanup scanner when component unmounts
            const scannerElement = document.getElementById('qr-reader');
            if (scannerElement) {
                scannerElement.innerHTML = '';
            }
        };
    }, [showScanner]);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/admin/stats', axiosConfig);
            setStats(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/admin/guests?page=${page}&limit=20&search=${search}`, axiosConfig);
            setGuests(response.data.guests);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error: any) {
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            console.log('=== EXCEL EXPORT STARTED ===');

            // Fetch all guests data as JSON
            const response = await axios.get('/api/admin/guests', {
                ...axiosConfig,
                params: { page: 1, limit: 1000 } // Get all guests
            });

            console.log('Guest data received:', response.data);
            const guests = response.data.guests || [];

            if (guests.length === 0) {
                alert('No guests to export');
                return;
            }

            // Prepare data for Excel
            const excelData = guests.map((guest: any) => ({
                'Name': guest.name || '-',
                'Attendance Status': guest.attendanceStatus || '-',
                'Event': guest.attendanceChoice || '-',
                'Note': guest.note || '-',
                'Checked In': guest.isCheckedIn ? 'Yes' : 'No',
                'Ticket Code': guest.ticketCode || '-',
                'Created At': guest.createdAt ? new Date(guest.createdAt).toLocaleString() : '-'
            }));

            console.log('Excel data prepared:', excelData.length, 'rows');

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');

            // Generate filename
            const filename = `wedding-guests-${new Date().toISOString().split('T')[0]}.xlsx`;

            // Generate Excel file as array buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Create blob
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Use FileSaver to download with proper filename
            saveAs(blob, filename);

            console.log('=== EXCEL EXPORT COMPLETED ===');
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        }
    };

    const initScanner = () => {
        const scanner = new Html5QrcodeScanner('qr-reader', {
            qrbox: { width: 250, height: 250 },
            fps: 5,
        }, false);

        scanner.render(
            async (decodedText) => {
                setScanResult('Processing...');
                try {
                    const response = await axios.post('/api/admin/checkin/scan',
                        { qrData: decodedText },
                        axiosConfig
                    );
                    if (response.data.success) {
                        setScanResult(`✅ ${response.data.guest.name} checked in successfully!`);
                        fetchStats();
                        fetchGuests();
                    } else {
                        setScanResult(`⚠️ ${response.data.message}`);
                    }
                    scanner.clear();
                    setTimeout(() => {
                        setShowScanner(false);
                        setScanResult('');
                    }, 3000);
                } catch (error) {
                    setScanResult('❌ Check-in failed');
                }
            },
            (error) => {
                // Ignore scan errors
            }
        );
    };

    const handleAddGuest = async () => {
        try {
            const response = await axios.post('/api/admin/guests', formData, axiosConfig);
            if (response.data.success) {
                alert(`Guest added successfully! ${response.data.guest.ticketToken ? 'Ticket generated.' : ''}`);
                setShowAddModal(false);
                setFormData({ name: '', attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi', note: '', isCheckedIn: false });
                fetchGuests();
                fetchStats();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add guest');
        }
    };

    const handleEditGuest = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData({
            name: guest.name,
            attendanceStatus: guest.attendanceStatus,
            attendanceChoice: guest.attendanceChoice,
            note: guest.note || '',
            isCheckedIn: guest.isCheckedIn || false
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedGuest) return;
        try {
            const response = await axios.patch(`/api/admin/guests/${selectedGuest._id}`, {
                attendanceStatus: formData.attendanceStatus,
                attendanceChoice: formData.attendanceChoice,
                note: formData.note,
                isCheckedIn: formData.isCheckedIn
            }, axiosConfig);
            if (response.data.success) {
                alert('Guest updated successfully!');
                setShowEditModal(false);
                setSelectedGuest(null);
                fetchGuests();
                fetchStats();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update guest');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-night p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif text-accent-yellow mb-2">Admin Dashboard</h1>
                        <p className="text-white/60">Welcome, {username}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded border border-red-500/50 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">Total RSVPs</div>
                    <div className="text-3xl font-bold text-accent-yellow">{stats.total}</div>
                </div>
                <div className="bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">Attending</div>
                    <div className="text-3xl font-bold text-green-400">{stats.attending}</div>
                </div>
                <div className="bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">Not Attending</div>
                    <div className="text-3xl font-bold text-red-400">{stats.notAttending}</div>
                </div>
                <div className="bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">Checked In</div>
                    <div className="text-3xl font-bold text-accent-yellow">{stats.checkedIn}</div>
                </div>
            </div>

            {/* Event Breakdown Stats */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-night-800/50 border border-blue-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">⛪ {import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.byEvent?.gereja || 0}</div>
                </div>
                <div className="bg-night-800/50 border border-purple-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">🎉 Resepsi</div>
                    <div className="text-3xl font-bold text-purple-400">{stats.byEvent?.resepsi || 0}</div>
                </div>
                <div className="bg-night-800/50 border border-pink-500/30 rounded-lg p-6">
                    <div className="text-white/60 text-sm mb-2">💒 Keduanya</div>
                    <div className="text-3xl font-bold text-pink-400">{stats.byEvent?.keduanya || 0}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full md:w-96 bg-night-800/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium transition-all"
                    >
                        ➕ Add Guest
                    </button>
                    <button
                        onClick={() => setShowScanner(!showScanner)}
                        className="bg-accent-yellow hover:bg-accent-green text-night-900 px-6 py-2 rounded font-medium transition-all"
                    >
                        📷 {showScanner ? 'Close Scanner' : 'Scan QR'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-accent-green hover:bg-accent-green-dark text-night-900 px-6 py-2 rounded font-medium transition-all"
                    >
                        📊 Export Excel
                    </button>
                </div>
            </div>

            {/* QR Scanner */}
            {showScanner && (
                <div className="max-w-7xl mx-auto mb-6 bg-night-800/50 border border-accent-green/30 rounded-lg p-6">
                    <h3 className="text-xl text-accent-yellow mb-4">QR Code Scanner</h3>
                    <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
                    {scanResult && (
                        <div className="mt-4 text-center text-lg text-white">{scanResult}</div>
                    )}
                </div>
            )}

            {/* Guest Table */}
            <div className="max-w-7xl mx-auto bg-night-800/50 border border-accent-green/30 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-accent-yellow/10 border-b border-accent-green/30">
                            <tr>
                                <th className="text-left p-4 text-accent-yellow font-medium">Name</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Status</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Event</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Guests</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Note</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Checked In</th>
                                <th className="text-left p-4 text-accent-yellow font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-white/60">Loading...</td>
                                </tr>
                            ) : guests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-white/60">No guests found</td>
                                </tr>
                            ) : (
                                guests.map((guest) => (
                                    <tr key={guest._id} className="border-b border-accent-green/10 hover:bg-accent-green/5">
                                        <td className="p-4 text-white">{guest.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${guest.attendanceStatus === 'Hadir'
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                {guest.attendanceStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/80">{guest.attendanceChoice}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                                                {(guest as any).guestCount || 1} 👥
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/60 text-sm max-w-xs truncate">{guest.note || '-'}</td>
                                        <td className="p-4">
                                            {guest.checkedInAt ? (
                                                <div className="text-sm">
                                                    <div className="text-green-400">✓ Yes</div>
                                                    <div className="text-white/40 text-xs">
                                                        {new Date(guest.checkedInAt).toLocaleString()}
                                                    </div>
                                                    <div className="text-white/40 text-xs">
                                                        via {guest.checkInMethod}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-white/40">No</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleEditGuest(guest)}
                                                className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded text-sm transition-all"
                                            >
                                                ✏️ Edit
                                            </button>
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
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-accent-green/20 text-accent-yellow rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-green/30 transition-all"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-white">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-accent-green/20 text-accent-yellow rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-green/30 transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add Guest Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-night-800 border border-accent-green/30 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-serif text-accent-yellow mb-6">Add New Guest</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/80 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                                    placeholder="Guest name"
                                />
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Attendance Status</label>
                                <select
                                    value={formData.attendanceStatus}
                                    onChange={(e) => setFormData({ ...formData, attendanceStatus: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                                >
                                    <option value="Hadir">Hadir</option>
                                    <option value="Tidak">Tidak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Event</label>
                                <select
                                    value={formData.attendanceChoice}
                                    onChange={(e) => setFormData({ ...formData, attendanceChoice: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                                >
                                    <option value="Gereja">{import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</option>
                                    <option value="Resepsi">Resepsi</option>
                                    <option value="Keduanya">Keduanya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Note (Optional)</label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow h-24"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isCheckedIn}
                                        onChange={(e) => setFormData({ ...formData, isCheckedIn: e.target.checked })}
                                        className="w-4 h-4 rounded border-accent-green/50 bg-night/50 text-accent-yellow focus:ring-accent-yellow"
                                    />
                                    <span>Check-in guest immediately</span>
                                </label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddGuest}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-all"
                                >
                                    Add Guest
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setFormData({ name: '', attendanceStatus: 'Hadir', attendanceChoice: 'Resepsi', note: '', isCheckedIn: false });
                                    }}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-3 px-4 rounded transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Guest Modal */}
            {showEditModal && selectedGuest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-night-800 border border-accent-green/30 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-serif text-accent-yellow mb-6">Edit Guest: {selectedGuest.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/80 mb-2">Attendance Status</label>
                                <select
                                    value={formData.attendanceStatus}
                                    onChange={(e) => setFormData({ ...formData, attendanceStatus: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                                >
                                    <option value="Hadir">Hadir</option>
                                    <option value="Tidak">Tidak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Event</label>
                                <select
                                    value={formData.attendanceChoice}
                                    onChange={(e) => setFormData({ ...formData, attendanceChoice: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow"
                                >
                                    <option value="Gereja">{import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</option>
                                    <option value="Resepsi">Resepsi</option>
                                    <option value="Keduanya">Keduanya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/80 mb-2">Note</label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-2 px-4 focus:outline-none focus:border-accent-yellow h-24"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isCheckedIn}
                                        onChange={(e) => setFormData({ ...formData, isCheckedIn: e.target.checked })}
                                        className="w-4 h-4 rounded border-accent-green/50 bg-night/50 text-accent-yellow focus:ring-accent-yellow"
                                    />
                                    <span>Mark as checked-in</span>
                                </label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-all"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedGuest(null);
                                    }}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-3 px-4 rounded transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
