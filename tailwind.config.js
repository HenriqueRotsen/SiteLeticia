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
        olive: {
          50: "#f6f0ea",
          100: "#ead8c8",
          200: "#d3b295",
          300: "#b7845f",
          400: "#965a34",
          500: "#7a4224",
          600: "#63321d",
          700: "#4f2819",
          800: "#3f2117",
          900: "#321c15"
        },
        graphite: "#252824",
        porcelain: "#fbfaf5",
        linen: "#f2eee4"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Cambria", "serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(37, 40, 36, 0.12)",
        card: "0 1px 2px rgba(37, 40, 36, 0.04), 0 4px 16px rgba(37, 40, 36, 0.06)",
        "card-hover": "0 4px 6px rgba(37, 40, 36, 0.05), 0 12px 32px rgba(37, 40, 36, 0.08)"
      }
    }
  },
  plugins: []
};
