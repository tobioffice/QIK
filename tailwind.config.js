/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Dark mode backgrounds
                background: '#0A0A12',
                surface: '#12121C',
                'surface-light': '#1A1A28',
                'surface-elevated': '#1F1F30',

                // Primary gradient colors
                primary: '#7C3AED',
                'primary-light': '#A78BFA',
                'primary-dark': '#5B21B6',

                // Accent colors
                accent: '#06B6D4',
                'accent-light': '#22D3EE',

                // Status colors
                success: '#10B981',
                'success-light': '#34D399',
                warning: '#F59E0B',
                'warning-light': '#FBBF24',
                error: '#EF4444',
                'error-light': '#F87171',

                // Text colors
                'text-primary': '#FFFFFF',
                'text-secondary': '#A1A1AA',
                'text-muted': '#52525B',

                // Glass/Border
                border: 'rgba(255, 255, 255, 0.08)',
                'border-light': 'rgba(255, 255, 255, 0.12)',
                glass: 'rgba(255, 255, 255, 0.05)',
                'glass-heavy': 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                sans: ['Inter_400Regular'],
                medium: ['Inter_500Medium'],
                semibold: ['Inter_600SemiBold'],
                bold: ['Inter_700Bold'],
            },
            borderRadius: {
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(124, 58, 237, 0.4)',
                'glow-accent': '0 0 20px rgba(6, 182, 212, 0.4)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
        },
    },
    plugins: [],
};
