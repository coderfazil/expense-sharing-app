const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    outDir: path.resolve(__dirname, "client-dist"),
    emptyOutDir: true,
  },
});
