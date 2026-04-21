/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand colors
                primary: '#00AAFF',      // Primary brand blue
                dark: '#00395D',         // Dark navy blue
                'light-bg': '#E5F4FF',   // Light blue background
            },
            backgroundColor: {
                primary: '#00AAFF',
                dark: '#00395D',
                'light-bg': '#E5F4FF',
            },
            textColor: {
                primary: '#00AAFF',
                dark: '#00395D',
            },
            borderColor: {
                primary: '#00AAFF',
                dark: '#00395D',
            },
            ringColor: {
                primary: '#00AAFF',
                dark: '#00395D',
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Oxygen',
                    'Ubuntu',
                    'Cantarell',
                    'Fira Sans',
                    'Droid Sans',
                    'Helvetica Neue',
                    'sans-serif',
                ],
            },
            spacing: {
                // Standard spacing based on 4px base unit
                0: '0',
                1: '4px',
                2: '8px',
                3: '12px',
                4: '16px',
                6: '24px',
                8: '32px',
                12: '48px',
                16: '64px',
            },
            boxShadow: {
                'light': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            transitionDuration: {
                '100': '100ms',
                '200': '200ms',
                '300': '300ms',
            },
            borderRadius: {
                'sm': '4px',
                'md': '6px',
                'lg': '8px',
                'xl': '12px',
            },
        },
    },
    plugins: [],
}