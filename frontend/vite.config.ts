import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

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
  }
})
