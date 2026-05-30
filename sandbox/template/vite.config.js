import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    strictPort: true,
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**"],
    },
    hmr: {
      protocol: "ws",
      clientPort: 80,
      overlay: false,
      timeout: 30000,
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client"],
    esbuildOptions: {
      target: "es2020",
    },
  },
})
