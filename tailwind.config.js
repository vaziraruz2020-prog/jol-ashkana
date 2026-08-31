/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B3B',
          dark: '#E85D04',
          soft: '#FFE1D4',
        },
        fresh: {
          DEFAULT: '#2ECC71',
          dark: '#239B56',
          soft: '#D8F6E5',
        },
        cream: '#FFF8F3',
        ink: '#1C1917',
        mute: '#78716C',
        line: '#E7E0D8',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 28px rgba(28, 25, 23, 0.08)',
        pop: '0 16px 40px rgba(255, 107, 59, 0.18)',
      },
      maxWidth: {
        app: '1100px',
      },
    },
  },
  plugins: [],
};
