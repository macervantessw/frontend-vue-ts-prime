import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    _VUE_I18N_FULL_INSTALL_: true,
    _VUE_I18N_LEGACY_API_: false,
    _VUE_I18N_PROD_DEVTOOLS_: false,
  },
  plugins: [vue()],
});
