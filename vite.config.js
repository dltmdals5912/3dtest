// vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['.gitpod.io'],   // Gitpod 프록시 허용
  },
});
