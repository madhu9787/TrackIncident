import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // Bind to all interfaces — fixes WebSocket HMR behind proxies/VMs
    hmr: {
      // Explicitly tell the client to connect HMR on the same host/port as the page,
      // preventing the token-auth WebSocket failures seen in some network configurations.
      clientPort: 5173,
    },
    proxy: {
      // All frontend calls to /api/... are forwarded to the FastAPI backend.
      // The /api prefix is stripped, so /api/upload/incidents → /upload/incidents.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Keep the proxy alive long enough for multi-incident AI analysis runs.
        // Each incident can take 3-15s per AI call × up to 3 candidates = 9-45s per incident.
        // With 10 incidents that's potentially 450s — set a safe 600s (10 min) ceiling.
        proxyTimeout: 600_000,
        timeout:      600_000,
      },
    },
  },
});
