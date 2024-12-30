import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['@stacks/connect-react', '@stacks/network', '@stacks/transactions']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})