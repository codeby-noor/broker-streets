module.exports = {
  darkMode: 'media',
  content: [
    './src/**/*.{js,jsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 20px 60px rgba(15, 23, 42, 0.18)',
        card: '0 10px 30px rgba(15, 32, 19, 0.12)',
        'card-hover': '0 25px 50px rgba(15, 32, 19, 0.14)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(29,87,51,0.26), transparent 45%), linear-gradient(180deg, rgba(18,44,31,0.92) 0%, rgba(15,32,19,0.72) 100%)'
      },
      colors: {
        primary: '#154d32',
        'primary-dark': '#103f28',
        background: '#F5F6F7',
        text: '#102122',
        ink: '#102122',
        muted: '#556470',
        cream: '#ffffff',
        sage: '#154d32',
        'sage-dark': '#103f28',
        clay: '#B78F28',
        accent: '#B78F28',
        accentSoft: '#E3C77D',
        success: '#22C55E',
        danger: '#DC2626',
        surface: '#F8FAFC',
        panel: '#F1F5F9',
        glass: 'rgba(255,255,255,0.08)',
        'dark-bg': '#0F1115',
        'dark-card': '#1A1D23',
        'dark-border': '#2A2E37',
        'dark-text': '#E8EAED',
        'dark-muted': '#9CA3AF'
      }
    }
  },
  plugins: []
};
