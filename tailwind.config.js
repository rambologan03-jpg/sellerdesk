/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                purple: {
                    50: '#faf5fb',
                    100: '#f3e8f7',
                    200: '#e8d1f0',
                    300: '#d5aae3',
                    400: '#bc78d1',
                    500: '#a050bc',
                    600: '#8b35a1',
                    700: '#7B2D8B',
                    800: '#622473',
                    900: '#521f5f',
                    950: '#340a40',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
