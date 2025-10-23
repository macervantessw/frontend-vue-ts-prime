import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import VueDevTools from "vite-plugin-vue-devtools";

export default defineConfig(({ mode }) => {
  // Carga las variables del .env correspondiente (development o production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      _VUE_I18N_FULL_INSTALL_: true,
      _VUE_I18N_LEGACY_API_: false,
      _VUE_I18N_PROD_DEVTOOLS_: false,
    },
    plugins: [vue(), VueDevTools()],

    server: {
      port: 5173,
      proxy: {
        // Redirige /api → http://localhost:4000 durante el desarrollo
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
