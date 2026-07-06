import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

/**
 * `base` is what all built asset URLs get prefixed with. Set via the
 * `PUBLIC_BASE` env var so CI can point it at `/fifa-rankings/` for
 * GitHub Pages while `pnpm dev` and local `pnpm build` keep `/`.
 */

/**
 * Emits a small `version.json` next to `index.html` at build time. The
 * client fetches it on an interval and — when the returned timestamp
 * differs from the one baked into the running bundle — shows a
 * "New version available" banner so users on long-lived tabs don't
 * stay on a stale build.
 */
function versionJson(): Plugin {
  return {
    name: 'app-version-json',
    generateBundle() {
      const buildTimestamp = process.env.VITE_BUILD_TIMESTAMP?.trim() ?? ''
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildTimestamp }, null, 2) + '\n',
      })
    },
  }
}

export default defineConfig({
  base: process.env.PUBLIC_BASE ?? '/',
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    versionJson(),
  ],
})
