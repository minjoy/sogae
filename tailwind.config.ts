import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 따뜻한 핑크-코랄 계열 (메인)
        primary: {
          50: '#fef6f6',
          100: '#fdeaea',
          200: '#fbd1d1',
          300: '#f7acac',
          400: '#f27d7d',
          500: '#e85555',
          600: '#d43838',
          700: '#b22c2c',
          800: '#942828',
          900: '#7c2727',
        },
        // 차분한 블루 (보조)
        secondary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dcfe',
          300: '#7cc0fd',
          400: '#36a2fa',
          500: '#0c88eb',
          600: '#0069c9',
          700: '#0154a3',
          800: '#064886',
          900: '#0b3c6f',
        },
        // 따뜻한 베이지 (배경)
        warm: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#ebe7df',
          300: '#ddd6c9',
          400: '#c9bfad',
          500: '#b5a791',
          600: '#9a8a73',
          700: '#7e7160',
          800: '#695f51',
          900: '#584f45',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Cafe24Danjunghae',
          'Pretendard',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
