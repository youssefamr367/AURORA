// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const configDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, "");
  const backendUrl = env.BACKEND_URL || "http://localhost:5000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": backendUrl,
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
    base: "/",
  };
});
