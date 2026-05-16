import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Lanterns } from '../components/Lanterns';
import { Stars } from '../components/Stars';
import { AudioPlayer, AudioPlayerRef } from '../components/AudioPlayer';
import { TicketView } from '../components/TicketView';
import { weddingConfig } from '../config/wedding';
import { getApiUrl } from '../config/api';

interface InvitePayload {
  name: string;
  quota: number;
  event: string;
  note: string;
}

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const audioPlayerRef = useRef<AudioPlayerRef | null>(null);

  // RSVP form state
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir');
  const [guestCount, setGuestCount] = useState(1);
  const [attendanceChoice, setAttendanceChoice] = useState('');
  const [wishes, setWishes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    const API_URL = getApiUrl();
    axios.get(`${API_URL}/api/invite/${token}`)
      .then(r => {
        setInvite(r.data);
        setAttendanceChoice(r.data.event || 'Resepsi');
        setGuestCount(r.data.quota || 1);
      })
      .catch(() => setError('Link undangan tidak valid atau sudah kadaluarsa.'));
  }, [token]);

  const handleEnter = () => {
    setShowSplash(false);
    if (audioPlayerRef.current) audioPlayerRef.current.play();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setIsLoading(true);
    setSubmitError('');
    try {
      const API_URL = getApiUrl();
      const response = await axios.post(`${API_URL}/api/rsvp`, {
        name: invite.name,
        attendanceChoice,
        attendanceStatus,
        note: wishes,
        guestQuota: invite.quota,
        guestCount: attendanceStatus === 'Hadir' ? guestCount : 1,
      });
      if (response.data.success) setSuccessData(response.data.rsvp);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Error state
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

  // Loading invite
  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="text-cream/50 animate-pulse">Memuat undangan...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-cream font-sans selection:bg-orange-500 selection:text-white pb-20 ${showSplash ? 'h-screen overflow-hidden' : ''}`}>
      {/* Splash screen */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 via-gray-950 to-black flex items-center justify-center">
          <div className="text-center space-y-8 p-8 animate-fade-in-down">
            <div className="relative flex justify-center items-center mb-6">
              <div className="absolute w-40 h-40 md:w-56 md:h-56 bg-accent-yellow/40 blur-[50px] rounded-full"></div>
              <img
                src="/asset/logo.png"
                alt="Logo"
                className="relative z-10 w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-[0_0_40px_rgba(255,223,0,1)]"
              />
            </div>
            <div className="mb-4">
              <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] border-y border-white/50 py-3 px-6 inline-block">
                Lights of Hope
              </span>
            </div>
            <h1 className="font-script text-6xl md:text-8xl text-white drop-shadow-2xl" style={{
              fontFamily: '"Great Vibes", cursive',
              textShadow: '0 0 30px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname}
            </h1>
            <p className="text-lantern-light/80 text-lg">
              Kepada Yth. <span className="font-semibold text-accent-yellow">{invite.name}</span>
            </p>
            {invite.note && (
              <p className="text-cream/60 text-sm italic max-w-xs mx-auto">"{invite.note}"</p>
            )}
            <button
              onClick={handleEnter}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-accent-yellow to-accent-green text-night-900 rounded-full font-semibold uppercase tracking-wider hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Buka Undangan
            </button>
          </div>
        </div>
      )}

      <AudioPlayer ref={audioPlayerRef} onReady={(ref) => { audioPlayerRef.current = ref; }} />
      <Stars />
      <div className="fixed inset-0 pointer-events-none z-0">
        <Lanterns />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-orange-900/10 pointer-events-none"></div>
      </div>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20 text-center">
        <div className="animate-fade-in-down p-8">
          <div className="mb-6">
            <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] border-y border-white/50 py-3 px-6 inline-block">
              Lights of Hope
            </span>
          </div>
          <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-2xl mb-6" style={{
            fontFamily: '"Great Vibes", cursive',
            textShadow: '0 0 30px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname}
          </h1>
          <div className="text-white text-lg md:text-xl font-light tracking-widest">
            <p>{weddingConfig.date.day}, {weddingConfig.date.full}</p>
          </div>
          <div className="mt-8 px-6 py-4 bg-black/30 rounded-2xl border border-accent-yellow/20 inline-block">
            <p className="text-cream/70 text-sm uppercase tracking-widest mb-1">Kepada Yth.</p>
            <p className="text-accent-yellow text-xl font-semibold">{invite.name}</p>
            {invite.note && <p className="text-cream/50 text-sm italic mt-1">"{invite.note}"</p>}
          </div>
        </div>
        <div className="absolute bottom-24 animate-bounce text-lantern-glow/70">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Event info */}
      <section className="relative z-20 max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-3xl text-accent-brown mb-8">Detail Acara</h2>
        <div className="grid gap-4">
          {(invite.event === 'Keduanya' || invite.event === 'Gereja') && (
            <div className="warm-card p-6">
              <p className="text-accent-yellow text-sm uppercase tracking-widest mb-1">⛪ {import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</p>
              <p className="text-cream font-semibold">{weddingConfig.ceremony.venue}</p>
              <p className="text-cream/60 text-sm">{weddingConfig.date.full} · {weddingConfig.ceremony.time}</p>
            </div>
          )}
          {(invite.event === 'Keduanya' || invite.event === 'Resepsi') && (
            <div className="warm-card p-6">
              <p className="text-accent-yellow text-sm uppercase tracking-widest mb-1">🎉 Resepsi</p>
              <p className="text-cream font-semibold">{weddingConfig.reception.venue}</p>
              <p className="text-cream/60 text-sm">{weddingConfig.date.full} · {weddingConfig.reception.time}</p>
            </div>
          )}
        </div>
      </section>

      {/* RSVP */}
      <section className="relative z-20 max-w-lg mx-auto px-4 py-8">
        <h2 className="font-serif text-4xl text-center text-accent-brown mb-8">RSVP</h2>

        {successData ? (
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="bg-gold-500 text-night px-6 py-3 rounded-full font-bold shadow-lg">RSVP Berhasil!</div>
            {successData.attendanceStatus === 'Hadir' && successData.ticketToken && (
              <TicketView name={successData.name} ticketToken={successData.ticketToken} />
            )}
            {successData.attendanceStatus === 'Tidak' && (
              <p className="text-gray-300 text-center">Terima kasih sudah memberi tahu kami.</p>
            )}
            <p className="text-gold-400 text-lg font-serif text-center">
              Terima kasih! Kami menantikan kehadiran Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="warm-card p-8 space-y-6 lantern-glow">
            {/* Name — read only */}
            <div>
              <label className="block text-lantern-light text-base font-semibold mb-2 font-serif">Nama</label>
              <input
                type="text"
                value={invite.name}
                disabled
                className="w-full bg-garden-night/30 text-cream/60 border-2 border-white/10 rounded-lg py-3 px-4 cursor-not-allowed"
              />
            </div>

            {/* Attendance */}
            <div>
              <label className="block text-lantern-light text-base font-semibold mb-3 font-serif">Konfirmasi Kehadiran</label>
              <div className="flex space-x-4">
                {['Hadir', 'Tidak'].map(v => (
                  <label key={v} className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value={v}
                      checked={attendanceStatus === v}
                      onChange={() => setAttendanceStatus(v)}
                      className="form-radio text-lantern-glow w-5 h-5"
                    />
                    <span className="ml-3 text-cream">{v === 'Hadir' ? 'Hadir' : 'Tidak Hadir'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Guest count — only if attending */}
            {attendanceStatus === 'Hadir' && invite.quota > 1 && (
              <div>
                <label className="block text-lantern-light text-base font-semibold mb-2 font-serif">Jumlah Tamu</label>
                <p className="text-cream/60 text-sm mb-2">Maksimal {invite.quota} tamu</p>
                <select
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 focus:outline-none focus:border-lantern-glow"
                >
                  {Array.from({ length: invite.quota }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} tamu</option>
                  ))}
                </select>
              </div>
            )}

            {/* Event — show if both, otherwise locked */}
            {invite.event === 'Keduanya' ? (
              <div>
                <label className="block text-lantern-light text-base font-semibold mb-2 font-serif">Acara</label>
                <select
                  value={attendanceChoice}
                  onChange={e => setAttendanceChoice(e.target.value)}
                  className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 focus:outline-none focus:border-lantern-glow"
                >
                  <option value="Gereja">{import.meta.env.VITE_CEREMONY_LABEL || 'Gereja'}</option>
                  <option value="Resepsi">Resepsi</option>
                  <option value="Keduanya">Keduanya</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-lantern-light text-base font-semibold mb-2 font-serif">Acara</label>
                <input
                  type="text"
                  value={attendanceChoice}
                  disabled
                  className="w-full bg-garden-night/30 text-cream/60 border-2 border-white/10 rounded-lg py-3 px-4 cursor-not-allowed"
                />
              </div>
            )}

            {/* Wishes */}
            <div>
              <label className="block text-lantern-light text-base font-semibold mb-2 font-serif">Pesan & Ucapan (Opsional)</label>
              <textarea
                rows={4}
                value={wishes}
                onChange={e => setWishes(e.target.value)}
                placeholder="Sampaikan ucapan untuk kedua mempelai..."
                className="w-full bg-garden-night/70 text-cream border-2 border-lantern-glow/40 rounded-lg py-3 px-4 focus:outline-none focus:border-lantern-glow placeholder-cream/40 resize-none"
              />
            </div>

            {submitError && (
              <div className="p-4 bg-sunset-rose/20 border border-sunset-rose/50 rounded-lg text-cream text-sm">{submitError}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-lantern-glow to-lantern-gold hover:from-lantern-gold hover:to-lantern-glow text-garden-dark font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed lantern-glow"
            >
              {isLoading ? 'Mengirim...' : 'Konfirmasi RSVP'}
            </button>
          </form>
        )}
      </section>

      <footer className="relative z-10 text-center py-8 mt-16 border-t border-accent-brown/20">
        <p className="text-gray-600 text-xs">
          Made with love by {weddingConfig.couple.groom.nickname} & {weddingConfig.couple.bride.nickname} © 2025
        </p>
      </footer>
    </div>
  );
};
