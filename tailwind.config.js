/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary Purple ──
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C084FC',
          400: '#A78BFA',
          500: '#8A65FF',
          600: '#7C3AED',
          700: '#6D28D9',
          DEFAULT: '#8A65FF',
          dark: '#7C3AED',
          light: '#C084FC',
        },
        // ── Accent Orange ──
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FFD28A',
          300: '#FFB066',
          400: '#FF9347',
          500: '#FF8C42',
          600: '#FF8A00',
          warm: '#FFD28A',
          DEFAULT: '#FF8C42',
          light: '#FF9347',
        },
        // ── Semantic / State Colors ──
        success: {
          DEFAULT: '#22C55E',
          bg: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FFFBEB',
        },
        error: {
          DEFAULT: '#EF4444',
          bg: '#FEF2F2',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: '#EFF6FF',
        },
        // ── Text Colors ──
        ink: {
          primary: '#1F1827',
          body: '#374151',
          secondary: '#6B7280',
          disabled: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        // ── Background ──
        bg: {
          main: '#F8F7FC',
          white: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#FFFFFF',
          overlay: 'rgba(31, 24, 39, 0.5)',
        },
        // ── Borders ──
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        divider: '#F3F4F6',
        // ── Neutrals ──
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // ── Legacy compatibility ──
        sunny: '#FFD93D',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '1.5'],
        sm: ['14px', '1.5'],
        base: ['16px', '1.5'],
        lg: ['20px', '1.25'],
        xl: ['24px', '1.25'],
        '2xl': ['28px', '1.25'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(31, 24, 39, 0.05)',
        md: '0 4px 6px -1px rgba(31, 24, 39, 0.07), 0 2px 4px -2px rgba(31, 24, 39, 0.05)',
        lg: '0 10px 15px -3px rgba(31, 24, 39, 0.08), 0 4px 6px -4px rgba(31, 24, 39, 0.04)',
        xl: '0 20px 25px -5px rgba(31, 24, 39, 0.08), 0 8px 10px -6px rgba(31, 24, 39, 0.04)',
        card: '0 4px 6px -1px rgba(31, 24, 39, 0.07), 0 2px 4px -2px rgba(31, 24, 39, 0.05)',
        'primary-glow': '0 0 0 3px rgba(138, 101, 255, 0.15)',
        'accent-glow': '0 4px 16px rgba(255, 140, 66, 0.35)',
        'primary-glow-lg': '0 8px 24px rgba(138, 101, 255, 0.35)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marker-pulse': 'marker-pulse 2s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'flip-in': 'flip-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'cta-pulse': 'cta-pulse 2s ease-in-out infinite',
        'float-anim': 'float-anim 4s ease-in-out infinite',
        'progress-fill': 'progress-fill 1.2s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0.85)', opacity: '0' },
        },
        'marker-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0', transform: 'scale(1.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-anim': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'flip-in': {
          '0%': { opacity: '0', transform: 'rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'rotateY(0deg)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.2) rotate(15deg)' },
        },
        'cta-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 140, 66, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(255, 140, 66, 0)' },
        },
        'progress-fill': {
          'from': { strokeDashoffset: '138.23' },
          'to': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
