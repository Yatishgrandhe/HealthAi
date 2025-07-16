/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        healthai: {
          blue: "#0066CC",
          darkBlue: "#004499",
          lightBlue: "#3399FF",
          black: "#000000",
          darkGray: "#1A1A1A",
          gray: "#333333",
          lightGray: "#666666",
          white: "#FFFFFF",
          silver: "#C0C0C0",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        heading: ["Inter", "Montserrat", "Poppins", "sans-serif"],
        body: ["Inter", "Roboto", "sans-serif"],
      },
      backgroundImage: {
        'healthai-gradient': 'linear-gradient(135deg, #0066CC 0%, #004499 50%, #000000 100%)',
        'healthai-blue-gradient': 'linear-gradient(135deg, #0066CC 0%, #3399FF 100%)',
        'healthai-dark-gradient': 'linear-gradient(135deg, #000000 0%, #1A1A1A 50%, #333333 100%)',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '10%, 30%': { transform: 'scale(1.1)' },
          '20%, 40%': { transform: 'scale(0.95)' },
        },
        fadein: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slidein: {
          '0%': { transform: 'translateY(40px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 102, 204, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 102, 204, 0.8)' },
        },
      },
      animation: {
        heartbeat: 'heartbeat 1.5s infinite',
        fadein: 'fadein 1s ease-in',
        slidein: 'slidein 0.8s cubic-bezier(0.4,0,0.2,1)',
        glow: 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}; 