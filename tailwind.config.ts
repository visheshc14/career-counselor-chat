// tailwind.config.ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/layouts/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}", // catch-all
  ],
  theme: {
    extend: {},
  },
  plugins: [typography, forms],
};

export default config;