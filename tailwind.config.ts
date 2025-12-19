import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        turbulence: {
          smooth: "#10b981",
          light: "#fbbf24",
          moderate: "#f97316",
          severe: "#ef4444",
          extreme: "#991b1b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
