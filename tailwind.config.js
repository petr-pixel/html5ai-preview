/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    900: '#050505',
                    800: '#0a0a0a',
                    700: '#0f1115',
                    600: '#1a1a1a',
                },
                accent: {
                    DEFAULT: '#f97316',
                    hover: '#ea580c',
                },
            },
            backdropBlur: {
                xl: '20px',
            },
        },
    },
    plugins: [],
}
