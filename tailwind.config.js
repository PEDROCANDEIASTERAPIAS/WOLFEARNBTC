/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        bitcoin: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F7931A',
          600: '#EA7A0C',
          700: '#C2570A',
          800: '#9A4108',
          900: '#7C3508',
          950: '#431C03',
        },
        ink: {
          50: '#F6F7F9',
          100: '#EDEEF1',
          200: '#D7DAE0',
          300: '#B0B6C2',
          400: '#828B9C',
          500: '#5F6878',
          600: '#4A5260',
          700: '#3C424E',
          800: '#2A2F38',
          900: '#1A1D24',
          950: '#0F1115',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-10px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(247,147,26,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(247,147,26,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pop': 'pop 0.4s ease-out',
        'float-up': 'float-up 1.2s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
