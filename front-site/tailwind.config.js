/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,pages,contexts,hooks,utils,services}/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#22C55E', // Verde Esmeralda Vibrante
        'brand-secondary': '#16A34A', // Verde Escuro Complementar
        'brand-accent': '#FBBF24', // Amarelo Âmbar para Destaques
        'background-main': '#F7F9FC', // Fundo Principal (Branco levemente acinzentado/azulado)
        'background-card': '#FFFFFF', // Fundo para Cards e Seções
        'text-headings': '#1F2937', // Títulos (Cinza Escuro)
        'text-body': '#4B5563', // Corpo do Texto (Cinza Médio)
        'text-muted': '#9CA3AF', // Textos Secundários (Cinza Claro)
        'text-on-brand': '#FFFFFF', // Texto sobre cores da marca
        'border-light': '#E5E7EB', // Bordas sutis
        'border-medium': '#D1D5DB', // Bordas de inputs
      }
    },
  },
  plugins: [],
}