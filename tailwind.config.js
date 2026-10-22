/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Tokens do manual: #FFFFFF, #ECE3D8, #A3968E, #BD9B72
        gold: {
          DEFAULT: "#BD9B72",
          50: "#F8F3EC",
          100: "#F0E6D6",
          200: "#E1CDB0",
          300: "#D1B48B",
          400: "#BD9B72",
          500: "#A8875F",
          600: "#8C6E4A",
          700: "#6B5440",
          800: "#4A3C32",
          900: "#322C28"
        },
        taupe: {
          DEFAULT: "#A3968E",
          50: "#F4F1EF",
          100: "#E7E1DC",
          200: "#D0C6BF",
          300: "#B8ABA3",
          400: "#A3968E",
          500: "#8A7E77",
          600: "#6F655F",
          700: "#554D49",
          800: "#3C3633",
          900: "#2A2624"
        },
        // Alias histórico (olive-*) remapeado para o ouro/taupe do manual
        olive: {
          50: "#F7F2EC",
          100: "#ECE3D8",
          200: "#D9CBBC",
          300: "#C9B396",
          400: "#BD9B72",
          500: "#A8875F",
          600: "#8C6E4A",
          700: "#6B5440",
          800: "#4A3C32",
          900: "#322C28"
        },
        graphite: "#2F2A27",
        porcelain: "#FFFFFF",
        linen: "#ECE3D8",
        // Superfícies da landing (off-white quente e areia do hero)
        ivory: "#FBF9F6",
        cream: "#F6F1EA",
        sand: "#EDE5DA"
      },
      fontFamily: {
        // Gotham Book (corpo)
        sans: ["var(--font-sans)", "Gotham", "ui-sans-serif", "system-ui", "sans-serif"],
        // Gentium Plus (títulos)
        display: ["var(--font-display)", "Gentium Plus", "Georgia", "Cambria", "serif"],
        // Gotham Bold (destaques)
        highlight: ["var(--font-sans)", "Gotham", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(47, 42, 39, 0.10)",
        card: "0 1px 2px rgba(47, 42, 39, 0.04), 0 4px 16px rgba(47, 42, 39, 0.06)",
        "card-hover": "0 4px 6px rgba(47, 42, 39, 0.05), 0 12px 32px rgba(47, 42, 39, 0.08)"
      }
    }
  },
  plugins: []
};
