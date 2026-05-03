import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F5F0E8",
        foreground: "#050505",
        ritual: {
          cream: "#F5F0E8",
          ink: "#050505",
          muted: "#6C675F",
          line: "#DDD3C4",
          surface: "#FFFDF8",
          soft: "#EEE6DA",
          green: "#2F795A"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 18px 60px -42px rgba(5, 5, 5, 0.45)"
      }
    }
  },
  plugins: [animate]
};

export default config;
