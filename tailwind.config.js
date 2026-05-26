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
      boxShadow: {
        soft: "0 24px 80px rgba(37, 40, 36, 0.12)"
      }
    }
  },
  plugins: []
};
