/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Garden Party - Lights of Hope Theme
                garden: {
                    dark: '#1A1A1A',      // Dark garden backdrop
                    night: '#2D2D2D',     // Evening sky
                    forest: '#2D5016',    // Deep forest green
                    sage: '#9CAF88',      // Sage foliage
                },
                lantern: {
                    glow: '#F4A460',      // Warm amber glow
                    light: '#FFF8DC',     // Firefly yellow
                    gold: '#D4AF37',      // Rich gold
                },
                sunset: {
                    peach: '#FFE5B4',     // Soft peach
                    rose: '#B76E79',      // Rose gold
                    purple: '#4A3C5E',    // Twilight purple
                },
                cream: {
                    DEFAULT: '#FFFEF0',   // Cream text
                    warm: '#FFF8F0',      // Warm cream
                },
                // Legacy colors for compatibility
                night: {
                    DEFAULT: '#1A1A1A',
                    800: '#2D2D2D',
                    900: '#0f0f0f',
                },
                accent: {
                    yellow: '#F4A460',
                    green: '#9CAF88',
                    'green-dark': '#2D5016',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
                script: ['Great Vibes', 'cursive'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'twinkle': 'twinkle 3s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px #F4A460, 0 0 10px #F4A460' },
                    '100%': { boxShadow: '0 0 10px #F4A460, 0 0 20px #F4A460, 0 0 30px #F4A460' },
                },
                twinkle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
            },
        },
    },
    plugins: [],
}
