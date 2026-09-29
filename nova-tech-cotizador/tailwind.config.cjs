module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1877E8',
        dark: '#081426',
        app: '#0A182E',
        card: '#10233E',
        cardhover: '#14294A',
        cardborder: '#1C3557',
        divider: '#16294A',
        muted: '#8FA6C4',
        dim: '#5B7295',
        surface: '#0C1E36',
        bg: '#0A182E',
        text: '#E6EDF7',
        accent: '#1877E8',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#E11D48',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['"Chakra Petch"', 'sans-serif'],
        body: ['"Chakra Petch"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
