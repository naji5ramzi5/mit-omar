import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--popover))",
      foreground: "hsl(var(--popover-foreground))",
    },
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))",
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
    },
    destructive: {
      DEFAULT: "hsl(var(--destructive))",
      foreground: "hsl(var(--destructive-foreground))",
    },
    mutedForeground: "hsl(var(--muted-foreground))",
    // Brand colors with full shade palette
    brand: {
      50: "#FFFDF5",
      100: "#F7F4EB",
      200: "#E4E0D0",
      300: "#D0CCB8",
      400: "#BBA895",
      500: "#A79482", // --brand-orange base
      600: "#8D7A64", // --brand-orange dark
      700: "#735F54", // --brand-orange darker
      800: "#59453D", // --brand-orange extra dark
      900: "#453430", // --brand-orange darkest
      950: "#2D201E",
    },
    // Primary brand red
    brandRed: {
      50: "#FFF0F0",
      100: "#FFE0E0",
      200: "#E5C0C0",
      300: "#D5A0A0",
      400: "#B88080",
      500: "#9A6060", // --brand-red base
      600: "#804545", // --brand-red dark
      700: "#663A3A",
      800: "#4D3030",
      900: "#332525",
      950: "#1A1515",
    },
    warm: {
      50: "#FFFbf5",
      100: "#FFf5f0",
      200: "#FFe0d5",
      300: "#FFd0c5",
      400: "#FFc0b5",
      500: "#FFa095", // --warm base
      600: "#E08075",
      700: "#C06055",
      800: "#A04540",
      900: "#803530",
    },
    // Gradients defined as colors
    gradient: {
      primary: "hsl(var(--gradient-primary))",
      secondary: "hsl(var(--gradient-secondary))",
    },
  },
  // Improved box-shadow scale
  boxShadow: {
    // Original shadows
    glow: "0 0 20px rgba(249, 115, 22, 0.3), 0 0 40px rgba(249, 115, 22, 0.1)",
    "glow-lg": "0 0 30px rgba(249, 115, 22, 0.4), 0 0 60px rgba(249, 115, 22, 0.15)",
    card: "0 4px 20px rgba(0, 0, 0, 0.05)",
    "card-hover": "0 12px 40px rgba(0, 0, 0, 0.1)",

    // New professional shadows
    "card-3d": "0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
    "card-3d-hover":
      "0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
    input: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
    modal: "0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)",
    floating:
      "0 10px 25px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.08)",
    "floating-lg":
      "0 25px 50px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)",

    // Elevated shadows for dark mode
    elevated: "0 4px 20px rgba(0, 0, 0, 0.15)",
    "elevated-hover":
      "0 20px 40px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.15)",

    // Soft shadows for cards
    soft: "0 2px 10px rgba(0, 0, 0, 0.05)",
    "soft-hover":
      "0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)",
    // Focus ring
    "focus-ring": "0 0 0 3px color-mix(in srgb, var(--primary), transparent 50%)",
    "focus-ring-outline": "0 0 0 2px var(--primary), 0 0 0 4px color-mix(in srgb, var(--primary), transparent 80%)",
  },
  // Improved border-radius scale
  borderRadius: {
    none: "0",
    sm: "calc(var(--radius) - 4px)",
    DEFAULT: "var(--radius)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",
    xl: "calc(var(--radius) + 4px)",
    "2xl": "calc(var(--radius) + 8px)",
    full: "9999px",
  },
  // Typography scale - professional clamp() values
  typography: {
    // Typography plugin if enabled
    // We will use custom CSS classes instead
  },
  // Improved animations
  keyframes: {
    // Add new keyframes here
    "accordion-down": {
      from: { height: "0" },
      to: { height: "var(--radix-accordion-height)" },
    },
    "accordion-up": {
      from: { height: "var(--radix-accordion-height)" },
      to: { height: "0" },
    },
    fadeIn: {
      from: { opacity: "0" },
      to: { opacity: "1" },
    },
    fadeInUp: {
      from: { opacity: "0", transform: "translateY(10px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    fadeInDown: {
      from: { opacity: "0", transform: "translateY(-10px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    fadeInLeft: {
      from: { opacity: "0", transform: "translateX(-10px)" },
      to: { opacity: "1", transform: "translateX(0)" },
    },
    fadeInRight: {
      from: { opacity: "0", transform: "translateX(10px)" },
      to: { opacity: "1", transform: "translateX(0)" },
    },
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.5" },
    },
    "spin-slow": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
    "shimmer": {
      "0%": { backgroundPosition: "-200% 0" },
      "100%": { backgroundPosition: "200% 0" },
    },
    "gradient-shift": {
      "0%": { backgroundPosition: "0% 50%" },
      "50%": { backgroundPosition: "100% 50%" },
      "100%": { backgroundPosition: "0% 50%" },
    },
    "float": {
      "0%, 100%": { transform: "translateY(0px)" },
      "50%": { transform: "translateY(-8px)" },
    },
    "border-beam": {
      "100%": { "offset-distance": "100%" },
    }
  },
  animation: {
    accordionDown: "accordion-down 0.2s ease-out",
    accordionUp: "accordion-up 0.2s ease-out",
    fadeIn: "fadeIn 0.5s ease-out forwards",
    fadeInUp: "fadeInUp 0.6s ease-out forwards",
    fadeInDown: "fadeInDown 0.5s ease-out forwards",
    fadeInLeft: "fadeInLeft 0.6s ease-out forwards",
    fadeInRight: "fadeInRight 0.6s ease-out forwards",
    pulse: "pulse 2s ease-in-out infinite",
    "spin-slow": "spin-slow 8s linear infinite",
    shimmer: "shimmer 2s infinite linear",
    "gradient-shift": "gradient-shift 4s ease infinite",
    float: "float 3s ease-in-out infinite",
    "bounce-slow": "bounce 3s ease-in-out infinite",
  },
    },
  },
  // Custom plugin configurations
  plugins: [
    tailwindcssAnimate,
    // Add custom plugin here if needed
  ],
};

export default config;