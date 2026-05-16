import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import App from '../App';
import { InviteContext, InviteData } from '../context/InviteContext';
import { getApiUrl } from '../config/api';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const API_URL = getApiUrl();
    axios.get(`${API_URL}/api/invite/${token}`)
      .then(r => setInvite(r.data))
      .catch(() => setError('Link undangan tidak valid atau sudah kadaluarsa.'));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-6xl">🏮</div>
          <p className="text-cream/60 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="text-cream/50 animate-pulse">Memuat undangan...</div>
      </div>
    );
  }

  return (
    <InviteContext.Provider value={invite}>
      <App />
    </InviteContext.Provider>
  );
};
