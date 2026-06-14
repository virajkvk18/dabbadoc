import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        section: "6rem",
        module: "3rem"
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 197, 94, 0.22)",
        warm: "0 0 42px rgba(249, 115, 22, 0.2)",
        "glow-sm": "0 0 20px rgba(129, 247, 89, 0.18)",
        "warm-sm": "0 0 20px rgba(253, 139, 0, 0.18)"
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)"
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" }
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-smooth both",
        "slide-up": "slide-up 0.4s ease-smooth both",
        "scale-in": "scale-in 0.2s ease-smooth both",
        shimmer: "shimmer 2s linear infinite",
        ping: "ping 1s cubic-bezier(0,0,0.2,1) infinite"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
