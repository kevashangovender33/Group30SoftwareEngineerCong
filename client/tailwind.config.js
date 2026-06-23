/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#d1dbec',
          bright: '#f8f9ff',
          'container-lowest': '#ffffff',
          'container-low': '#eef4ff',
          container: '#e5eeff',
          'container-high': '#dfe9fa',
          'container-highest': '#d9e3f4',
          tint: '#3d5ca2',
          variant: '#d9e3f4',
        },
        primary: {
          DEFAULT: '#001a48',
          container: '#002d72',
          fixed: '#dae2ff',
          'fixed-dim': '#b1c5ff',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#7a97e2',
          fixed: '#001946',
          'fixed-variant': '#224489',
        },
        secondary: {
          DEFAULT: '#3a608f',
          container: '#a4c9fe',
          fixed: '#d3e3ff',
          'fixed-dim': '#a4c9fe',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#2d5482',
          fixed: '#001c38',
          'fixed-variant': '#1f4875',
        },
        'on-surface': {
          DEFAULT: '#121c28',
          variant: '#444651',
        },
        outline: {
          DEFAULT: '#747782',
          variant: '#c4c6d2',
        },
        'inverse-surface': '#27313e',
        'inverse-on-surface': '#eaf1ff',
        'inverse-primary': '#b1c5ff',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        tertiary: {
          DEFAULT: '#1a1d1e',
          container: '#2f3233',
          fixed: '#e1e3e4',
          'fixed-dim': '#c5c7c8',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'data-tabular': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      spacing: {
        gutter: '16px',
        'margin-desktop': '32px',
        'margin-mobile': '16px',
        'container-max': '1440px',
      },
      maxWidth: {
        'container-max': '1440px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
