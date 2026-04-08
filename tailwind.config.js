/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        surface2: '#F0F2F5',
        border: 'rgba(0,0,0,0.06)',
        'text-primary': '#1A1A2E',
        'text-muted': '#6B7280',
        accent: {
          green: '#10B981',
          blue: '#0066FF',
          orange: '#FF7A3D',
          gray: '#8A9098',
        },
        'footer-bg': '#111827',
        // Building type colors
        'bt-lowrise': '#93C5FD',
        'bt-midrise': '#34D399',
        'bt-highrise': '#A78BFA',
        'bt-loft': '#FB923C',
        'bt-luxury': '#F472B6',
        'bt-precon': '#FBBF24',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '14px',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
