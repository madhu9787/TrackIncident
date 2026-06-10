// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/madhu/OneDrive/Desktop/release-incident-correlator%20(1)/release-incident-correlator/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
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
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          proxyTimeout: 6e5,
          timeout: 6e5
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYWRodVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciAoMSlcXFxccmVsZWFzZS1pbmNpZGVudC1jb3JyZWxhdG9yXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYWRodVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciAoMSlcXFxccmVsZWFzZS1pbmNpZGVudC1jb3JyZWxhdG9yXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9tYWRodS9PbmVEcml2ZS9EZXNrdG9wL3JlbGVhc2UtaW5jaWRlbnQtY29ycmVsYXRvciUyMCgxKS9yZWxlYXNlLWluY2lkZW50LWNvcnJlbGF0b3IvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIGBtb2RlYCBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA1MTczLFxyXG4gICAgICBob3N0OiB0cnVlLCAvLyBCaW5kIHRvIGFsbCBpbnRlcmZhY2VzIFx1MjAxNCBmaXhlcyBXZWJTb2NrZXQgSE1SIGJlaGluZCBwcm94aWVzL1ZNc1xyXG4gICAgICBobXI6IHtcclxuICAgICAgICAvLyBFeHBsaWNpdGx5IHRlbGwgdGhlIGNsaWVudCB0byBjb25uZWN0IEhNUiBvbiB0aGUgc2FtZSBob3N0L3BvcnQgYXMgdGhlIHBhZ2UsXHJcbiAgICAgICAgLy8gcHJldmVudGluZyB0aGUgdG9rZW4tYXV0aCBXZWJTb2NrZXQgZmFpbHVyZXMgc2VlbiBpbiBzb21lIG5ldHdvcmsgY29uZmlndXJhdGlvbnMuXHJcbiAgICAgICAgY2xpZW50UG9ydDogNTE3MyxcclxuICAgICAgfSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJyxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXHJcbiAgICAgICAgICBwcm94eVRpbWVvdXQ6IDYwMF8wMDAsXHJcbiAgICAgICAgICB0aW1lb3V0OiA2MDBfMDAwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdmLFNBQVMsY0FBYyxlQUFlO0FBQ3RoQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsSUFDaEMsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBO0FBQUEsTUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBLFFBR0gsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVEsSUFBSSxnQkFBZ0I7QUFBQSxVQUM1QixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsVUFDNUMsY0FBYztBQUFBLFVBQ2QsU0FBUztBQUFBLFFBQ1g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
