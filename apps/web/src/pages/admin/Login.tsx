import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const navigate = useNavigate();

    // Handle redirect in useEffect when login succeeds
    useEffect(() => {
        if (loginSuccess) {
            console.log('useEffect: loginSuccess is true, redirecting to dashboard...');
            window.location.replace('/admin/dashboard');
        }
    }, [loginSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('=== LOGIN ATTEMPT STARTED ===');
        console.log('Username:', username);
        console.log('Password length:', password.length);

        setError('');
        setLoading(true);

        try {
            console.log('Sending POST request to /api/admin/login...');
            const response = await axios.post('/api/admin/login', {
                username,
                password
            });

            console.log('Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data && response.data.access_token) {
                console.log('Access token found:', response.data.access_token.substring(0, 20) + '...');

                try {
                    localStorage.setItem('admin_token', response.data.access_token);
                    localStorage.setItem('admin_username', response.data.username);
                    console.log('Tokens stored in localStorage');

                    // Verify tokens were actually saved
                    const savedToken = localStorage.getItem('admin_token');
                    const savedUsername = localStorage.getItem('admin_username');

                    console.log('Verification - Token saved?', savedToken ? 'YES' : 'NO');
                    console.log('Verification - Username saved?', savedUsername ? 'YES' : 'NO');

                    if (!savedToken) {
                        console.error('ERROR: Token was not saved to localStorage!');
                        setError('Failed to save login session. Please check browser settings.');
                        setLoading(false);
                        return;
                    }

                    console.log('Setting loginSuccess to true...');
                    setLoginSuccess(true);
                } catch (err) {
                    console.error('localStorage error:', err);
                    setError('Failed to save login session. localStorage may be disabled.');
                    setLoading(false);
                }
            } else {
                console.error('No access token in response:', response.data);
                setError('Login failed: Invalid response from server');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('=== LOGIN ERROR ===');
            console.error('Error object:', err);
            console.error('Error message:', err.message);
            console.error('Error response:', err.response);
            console.error('Error response data:', err.response?.data);
            console.error('Error response status:', err.response?.status);
            setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-night flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-night-800/50 backdrop-blur-sm border border-accent-green/30 rounded-xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-serif text-accent-yellow mb-2">Admin Dashboard</h1>
                        <p className="text-white/60">Wedding Invitation Management</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-3 px-4 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-night/50 text-white border border-accent-green/50 rounded py-3 px-4 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-yellow hover:bg-accent-green text-night-900 font-bold py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
