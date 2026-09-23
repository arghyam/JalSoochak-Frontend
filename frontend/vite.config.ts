import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Mirrors the nginx security headers onto `vite preview`.
 *
 * Production serves the build through nginx, which attaches a CSP; `vite dev` and
 * `vite preview` attach nothing. That gap is how a CSP violation (gtag.js blocked by a
 * `script-src` missing googletagmanager.com) reached production without failing locally.
 *
 * Parsed from security-headers.conf rather than duplicated, so the two cannot drift.
 * Applied to `preview` only — it serves the real production bundle. `dev` is deliberately
 * left alone: HMR and React Refresh need 'unsafe-inline'/'unsafe-eval' and a ws: connection,
 * so a dev-shaped policy would be a different policy, and passing it would prove nothing.
 */
function readNginxSecurityHeaders(): Record<string, string> {
  const confPath = path.resolve(__dirname, './security-headers.conf')

  try {
    const conf = fs.readFileSync(confPath, 'utf8')
    const headers: Record<string, string> = {}

    // Horizontal whitespace only: `\s` would match newlines, letting `^\s*` span lines and
    // scan the file quadratically under the `m` flag.
    for (const [, name, value] of conf.matchAll(/^[ \t]*add_header[ \t]+(\S+)[ \t]+"([^"]*)"/gm)) {
      headers[name] = value
    }

    if (Object.keys(headers).length === 0) {
      console.warn(`[vite] No add_header directives found in ${confPath}; preview is unprotected.`)
    }

    return headers
  } catch (error) {
    // Never fail the build over a preview-only nicety.
    console.warn(`[vite] Could not read ${confPath}; preview runs without security headers.`, error)
    return {}
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/app': path.resolve(__dirname, './src/app'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/assets': path.resolve(__dirname, './src/assets'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Isolate echarts (zrender is bundled inside it) into a single
            // async chunk (~1.1 MB). Only loads when a chart-bearing page mounts.
            if (
              id.includes('/node_modules/echarts/') ||
              id.includes('/node_modules/echarts-for-react/')
            )
              return 'vendor-charts'

            // Isolate firebase so the lazy import() in shared/lib/analytics stays lazy.
            // Without this branch the catch-all below folds it into the eager `vendor`
            // chunk, shipping the SDK to dev and staging where analytics is disabled.
            if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/'))
              return 'vendor-firebase'

            // Bucket all remaining node_modules into a single stable vendor
            // chunk. Defining manualChunks disables Vite's automatic vendor
            // splitting, so an explicit catch-all is required. Splitting this
            // further (react/chakra/i18n) causes circular chunk warnings from
            // Rollup's CJS interop helper being placed in the wrong bucket.
            if (id.includes('/node_modules/')) return 'vendor'
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      headers: readNginxSecurityHeaders(),
    },
  }
})
