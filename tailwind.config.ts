import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        acai: {
          50: "#f8f3fc",
          100: "#eddcf7",
          200: "#ddbaef",
          300: "#c78be4",
          400: "#b05ed6",
          500: "#9836c6", 
          600: "#7c22a7",
          700: "#631887",
          800: "#4f156b",
          900: "#421557",
          950: "#2d0b40",
        },
        berry: {
          400: "#e35d9c",
          500: "#d43d84",
          600: "#b52469",
        },
        cream: "#fffcf7",
        gold: "#FFC107",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(42, 14, 72, 0.25)",
        card: "0 4px 20px -4px rgba(42, 14, 72, 0.15)",
        glow: "0 0 0 4px rgba(127, 47, 201, 0.15)",
      },
      backgroundImage: {
        "acai-gradient": "linear-gradient(135deg, #631887 0%, #9836c6 100%)",
        "acai-radial": "radial-gradient(circle at 30% 20%, #c78be4 0%, #4f156b 60%)",
      },
      animation: {
        "fade-up": "fadeUp .5s ease forwards",
        "scale-in": "scaleIn .2s ease forwards",
        float: "float 6s ease-in-out infinite",
        "cart-bump": "cartBump .3s ease-in-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        cartBump: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
