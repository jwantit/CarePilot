/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cp: {
          bg: "var(--bg-main)",
          card: "var(--bg-card)",
          header: "var(--bg-header)",
          text: "var(--text-main)",
          muted: "var(--text-muted)",
          border: "var(--border-main)",
          accent: "var(--accent-teal)",
          input: "var(--input-bg)",
        },
        // teal 강조색을 CSS 변수로 통일 → 라이트/다크 동일한 초록
        teal: {
          300: "var(--accent-teal)",
          400: "var(--accent-teal)",
          500: "var(--accent-teal)",
          600: "var(--accent-teal)",
          700: "var(--accent-teal)",
        },
      },
    },
  },
  plugins: [],
};
