export const getApiUrl = () => {
    // If VITE_API_URL is set in environment, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // In development (localhost), default to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    
    // Fallback: If no API URL is set in production, this might fail or call same-origin
    // Ideally the user sets VITE_API_URL in Vercel
    return ''; 
};
