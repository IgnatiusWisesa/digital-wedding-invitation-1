import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Wish {
    name: string;
    note: string;
    attendanceStatus: string;
}

export const WishesList = () => {
    const [wishes, setWishes] = useState<Wish[]>([]);

    useEffect(() => {
        const fetchWishes = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const res = await axios.get(`${apiUrl}/api/rsvp/wishes`);
                if (Array.isArray(res.data)) {
                    setWishes(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch wishes", e);
            }
        };
        fetchWishes();
        // Poll every 30 seconds
        const interval = setInterval(fetchWishes, 30000);
        return () => clearInterval(interval);
    }, []);

    if (wishes.length === 0) return null;

    return (
        <div className="mt-12 w-full max-w-2xl mx-auto">
            <h3 className="font-serif text-2xl text-gold-300 mb-6 text-center">Wishes from Friends & Family</h3>
            <div className="bg-night-800/30 border border-gold-900/30 rounded-lg p-6 max-h-96 overflow-y-auto space-y-4 custom-scrollbar">
                {wishes.map((wish, idx) => (
                    <div key={idx} className="border-b border-gold-900/50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gold-200">{wish.name}</h4>
                            <span className={`text-[10px] px-2 py-1 rounded-full ${wish.attendanceStatus === 'Hadir' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {wish.attendanceStatus === 'Hadir' ? 'Attending' : 'Cannot Attend'}
                            </span>
                        </div>
                        <p className="text-gold-100/80 text-sm font-light italic">"{wish.note}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
