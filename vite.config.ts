import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

/**
 * `base` is what all built asset URLs get prefixed with. Set via the
 * `PUBLIC_BASE` env var so CI can point it at `/fifa-rankings/` for
 * GitHub Pages while `pnpm dev` and local `pnpm build` keep `/`.
 */
export default defineConfig({
  base: process.env.PUBLIC_BASE ?? '/',
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
})
