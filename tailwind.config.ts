import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rave: {
          black: "#030305",
          deep: "#07070D",
          panel: "#0B0B12",
          panel2: "#111119",
          red: "#FF173D",
          red2: "#FF304F",
          magenta: "#FF0A78",
          purple: "#8B2CFF",
          blue: "#2E6BFF",
          white: "#FFFFFF",
          muted: "#A6A6B2",
        },
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderColor: {
        'rave-border': 'rgba(255,255,255,0.12)',
      },
      maxWidth: {
        'container': '1280px',
      },
    },
  },
  plugins: [],
};
export default config;
