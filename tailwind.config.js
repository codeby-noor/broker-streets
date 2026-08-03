module.exports = {
  content: [
    './src/**/*.{js,jsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 20px 60px rgba(15, 23, 42, 0.18)',
        card: '0 10px 30px rgba(48, 47, 42, 0.06)',
        'card-hover': '0 20px 42px rgba(48, 47, 42, 0.12)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 45%), linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.82) 100%)'
      },
      colors: {
        primary: '#3A7BD0',
        background: '#FFFEFE',
        text: '#0F172A',
        ink: '#17324D',
        muted: '#5B6B7A',
        cream: '#FFFEFE',
        sage: '#3A7BD0',
        'sage-dark': '#2F68B5',
        clay: '#3A7BD0',
        success: '#22C55E',
        danger: '#EF4444',
        surface: '#111827',
        panel: '#1f2937',
        glass: 'rgba(255,255,255,0.08)',
        accent: '#7c3aed',
        accentSoft: '#a78bfa'
      }
    }
  },
  plugins: []
};
