import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          hover: 'rgb(var(--surface-hover) / <alpha-value>)',
          active: 'rgb(var(--surface-active) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
          secondary: 'rgb(var(--foreground-secondary) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        'border-default': 'rgb(var(--border-default) / <alpha-value>)',
        input: {
          DEFAULT: 'rgb(var(--input-bg) / <alpha-value>)',
          border: 'rgb(var(--input-border) / <alpha-value>)',
        },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        sidebar: {
          bg: 'rgb(var(--sidebar-bg) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
        },
        nav: {
          active: 'rgb(var(--nav-active-bg) / <alpha-value>)',
          hover: 'rgb(var(--nav-hover-bg) / <alpha-value>)',
        },
        placeholder: 'rgb(var(--placeholder) / <alpha-value>)',
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        perf: {
          elite: 'rgb(var(--perf-elite) / <alpha-value>)',
          high: 'rgb(var(--perf-high) / <alpha-value>)',
          medium: 'rgb(var(--perf-medium) / <alpha-value>)',
          low: 'rgb(var(--perf-low) / <alpha-value>)',
        },
        'chart-5': 'rgb(var(--chart-5) / <alpha-value>)',
        /* shadcn/ui (HSL) */
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
    },
  },
  safelist: [
    'bg-perf-elite', 'bg-perf-high', 'bg-perf-medium', 'bg-perf-low',
    'text-perf-elite', 'text-perf-high', 'text-perf-medium', 'text-perf-low',
    'border-perf-elite', 'border-perf-high', 'border-perf-medium', 'border-perf-low',
  ],
  plugins: [require('tailwindcss-animate')],
};
export default config;
