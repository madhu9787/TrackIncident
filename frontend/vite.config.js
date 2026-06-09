import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          proxyTimeout: 600_000,
          timeout: 600_000,
        },
      },
    },
  };
});
