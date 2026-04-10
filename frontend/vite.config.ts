import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      __SERVER_MODE__: JSON.stringify(env.JALSOOCHAK_SERVER_MODE ?? ''),
      __TENANT_ID__: JSON.stringify(env.JALSOOCHAK_TENANT_ID ?? ''),
      __DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD__: JSON.stringify(
        env.VITE_DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD ?? '5'
      ),
      __DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY__: JSON.stringify(
        env.VITE_DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY ?? '55'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/app': path.resolve(__dirname, './src/app'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/assets': path.resolve(__dirname, './src/assets'),
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
