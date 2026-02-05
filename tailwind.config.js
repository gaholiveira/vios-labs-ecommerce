/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
    "./src/utils/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#0a3323", // Verde Profundo
          offwhite: "#f2f2f0", // Fundo Sophisticado
          softblack: "#1a1a1a", // Letras Suaves
          gold: "#C9A961", // Metallic Gold - Acentos de luxo
          champagne: "#F7E7CE", // Champagne - Background elegante
        },
      },
    },
  },
  plugins: [],
};
