/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        normal: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
        dikkat: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
        supheli: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      },
    },
  },
  plugins: [],
};
