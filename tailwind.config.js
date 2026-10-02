/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Flavoria Gold / Amber ──────────────────────────────────────
        gold: {
          50:  '#fdf8ed',
          100: '#faefcf',
          200: '#f5dca0',
          300: '#eec468',
          400: '#e6a93a',
          500: '#c8922a',  // PRIMARY BRAND GOLD
          600: '#a97020',
          700: '#865219',
          800: '#6b3f17',
          900: '#593418',
        },
        // ── Cream / Warm Background ────────────────────────────────────
        cream: {
          50:  '#fdfcfa',
          100: '#f9f5f0',  // main bg
          200: '#f2ebe0',
          300: '#e7d9c6',
          400: '#d5c2a1',
          500: '#b8997a',
        },
        // ── Warm Dark (text) ───────────────────────────────────────────
        dark: {
          50:  '#f7f3ee',
          100: '#e8ddd0',
          200: '#c9b89e',
          300: '#a89070',
          400: '#7a6248',
          500: '#5a4430',
          600: '#3d2d1d',
          700: '#271c10',
          800: '#1a1208',  // headings
          900: '#0e0904',
        },
        // ── Keep old qashqar for dashboard / driver pages (not touched) ─
        qashqar: {
          50:  '#f0faf9',
          100: '#d5f2f0',
          200: '#aee4e0',
          300: '#7ed0cb',
          400: '#4fb5b0',
          500: '#329994',
          600: '#247a76',
          700: '#1e625f',
          800: '#0f4846',
          900: '#0a3533',
          950: '#041f1e',
        },
        saffron: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        sand: {
          50:  '#faf8f5',
          100: '#f4efe6',
          200: '#e8e0d1',
          300: '#d6c6ad',
          800: '#4a3f2f',
          900: '#2e251a',
        },
      },
      fontFamily: {
        serif:  ['Playfair Display', 'Georgia', 'serif'],
        sans:   ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft':     '0 4px 20px -2px rgba(139, 98, 48, 0.08)',
        'elevated': '0 12px 32px -4px rgba(139, 98, 48, 0.14)',
        'card':     '0 2px 16px 0 rgba(139, 98, 48, 0.09)',
        'card-hover': '0 8px 40px -4px rgba(139, 98, 48, 0.20)',
        'gold':     '0 4px 20px -4px rgba(200, 146, 42, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'cream-gradient': 'linear-gradient(135deg, #f9f5f0 0%, #f2ebe0 100%)',
        'gold-gradient':  'linear-gradient(135deg, #c8922a 0%, #e6a93a 100%)',
        'dark-gradient':  'linear-gradient(135deg, #1a1208 0%, #3d2d1d 100%)',
        'hero-overlay':   'linear-gradient(105deg, #f9f5f0 0%, #f9f5f0 55%, transparent 100%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'float':     'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
