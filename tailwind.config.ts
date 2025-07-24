import type { Config } from "tailwindcss"

// FULL REWRITE:
const config: Config = {
  // Make sure we include "src/app/**/*" so that Tailwind picks up classes in src/app/components/ui
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

// Export default for Next.js ESM usage
export default config
