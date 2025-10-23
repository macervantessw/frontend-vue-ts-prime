import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import VueApexCharts from "vue3-apexcharts";
import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";
import "primevue/resources/primevue.min.css";
import "./assets/theme-light.css";
import "primeflex/primeflex.css";
import Ripple from "primevue/ripple";
import i18n from "./i18n";
import { createPinia } from "pinia";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import DialogService from "primevue/dialogservice";
import Toast from "primevue/toast"; // ✅ <--- ESTA ES LA LÍNEA CLAVE

const app = createApp(App);
const pinia = createPinia();

app.use(VueApexCharts);
app.use(PrimeVue, { ripple: true });
app.use(i18n);
app.use(pinia);
app.use(ToastService);
app.use(router);
app.use(DialogService);
app.directive("ripple", Ripple);
app.directive("tooltip", Tooltip);

// ✅ registra el componente Toast globalmente
app.component("Toast", Toast);

app.mount("#app");
