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
        env.DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD ?? '5'
      ),
      __DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY__: JSON.stringify(
        env.DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY ?? '55'
      ),
      __MAP_LEGEND_THRESHOLD_GTE_90__: JSON.stringify(env.MAP_LEGEND_THRESHOLD_GTE_90 ?? '90'),
      __MAP_LEGEND_THRESHOLD_GTE_70__: JSON.stringify(env.MAP_LEGEND_THRESHOLD_GTE_70 ?? '70'),
      __MAP_LEGEND_THRESHOLD_GTE_50__: JSON.stringify(env.MAP_LEGEND_THRESHOLD_GTE_50 ?? '50'),
      __MAP_LEGEND_THRESHOLD_GTE_30__: JSON.stringify(env.MAP_LEGEND_THRESHOLD_GTE_30 ?? '30'),
      __MAP_LEGEND_THRESHOLD_GTE_0__: JSON.stringify(env.MAP_LEGEND_THRESHOLD_GTE_0 ?? '0'),
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
