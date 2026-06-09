// vite.config.js
import { defineConfig } from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // Bind to all interfaces — fixes WebSocket HMR behind proxies/VMs
    hmr: {
      // Explicitly tell the client to connect HMR on the same host/port as the page,
      // preventing the token-auth WebSocket failures seen in some network configurations.
      clientPort: 5173
    },
    proxy: {
      // All frontend calls to /api/... are forwarded to the FastAPI backend.
      // The /api prefix is stripped, so /api/upload/incidents → /upload/incidents.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        // Keep the proxy alive long enough for multi-incident AI analysis runs.
        // Each incident can take 3-15s per AI call × up to 3 candidates = 9-45s per incident.
        // With 10 incidents that's potentially 450s — set a safe 600s (10 min) ceiling.
        proxyTimeout: 6e5,
        timeout: 6e5
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYWRodVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciAoMSlcXFxccmVsZWFzZS1pbmNpZGVudC1jb3JyZWxhdG9yXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYWRodVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciAoMSlcXFxccmVsZWFzZS1pbmNpZGVudC1jb3JyZWxhdG9yXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9tYWRodS9PbmVEcml2ZS9EZXNrdG9wL3JlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciUyMCgxKS9yZWxlYXNlLWluY2lkZW50LWNvcnJlbGF0b3IvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgaG9zdDogdHJ1ZSwgLy8gQmluZCB0byBhbGwgaW50ZXJmYWNlcyBcdTIwMTQgZml4ZXMgV2ViU29ja2V0IEhNUiBiZWhpbmQgcHJveGllcy9WTXNcbiAgICBobXI6IHtcbiAgICAgIC8vIEV4cGxpY2l0bHkgdGVsbCB0aGUgY2xpZW50IHRvIGNvbm5lY3QgSE1SIG9uIHRoZSBzYW1lIGhvc3QvcG9ydCBhcyB0aGUgcGFnZSxcbiAgICAgIC8vIHByZXZlbnRpbmcgdGhlIHRva2VuLWF1dGggV2ViU29ja2V0IGZhaWx1cmVzIHNlZW4gaW4gc29tZSBuZXR3b3JrIGNvbmZpZ3VyYXRpb25zLlxuICAgICAgY2xpZW50UG9ydDogNTE3MyxcbiAgICB9LFxuICAgIHByb3h5OiB7XG4gICAgICAvLyBBbGwgZnJvbnRlbmQgY2FsbHMgdG8gL2FwaS8uLi4gYXJlIGZvcndhcmRlZCB0byB0aGUgRmFzdEFQSSBiYWNrZW5kLlxuICAgICAgLy8gVGhlIC9hcGkgcHJlZml4IGlzIHN0cmlwcGVkLCBzbyAvYXBpL3VwbG9hZC9pbmNpZGVudHMgXHUyMTkyIC91cGxvYWQvaW5jaWRlbnRzLlxuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgICAgLy8gS2VlcCB0aGUgcHJveHkgYWxpdmUgbG9uZyBlbm91Z2ggZm9yIG11bHRpLWluY2lkZW50IEFJIGFuYWx5c2lzIHJ1bnMuXG4gICAgICAgIC8vIEVhY2ggaW5jaWRlbnQgY2FuIHRha2UgMy0xNXMgcGVyIEFJIGNhbGwgXHUwMEQ3IHVwIHRvIDMgY2FuZGlkYXRlcyA9IDktNDVzIHBlciBpbmNpZGVudC5cbiAgICAgICAgLy8gV2l0aCAxMCBpbmNpZGVudHMgdGhhdCdzIHBvdGVudGlhbGx5IDQ1MHMgXHUyMDE0IHNldCBhIHNhZmUgNjAwcyAoMTAgbWluKSBjZWlsaW5nLlxuICAgICAgICBwcm94eVRpbWVvdXQ6IDYwMF8wMDAsXG4gICAgICAgIHRpbWVvdXQ6ICAgICAgNjAwXzAwMCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnZixTQUFTLG9CQUFvQjtBQUM3Z0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBRXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBLE1BR0gsWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBO0FBQUEsTUFHTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJNUMsY0FBYztBQUFBLFFBQ2QsU0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
