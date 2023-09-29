import { createApp } from "vue";
import App from "./App.vue";
import VueApexCharts from "vue3-apexcharts";
import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";
import "primevue/resources/primevue.min.css";
import "primevue/resources/themes/soho-light/theme.css";
import "primeflex/primeflex.css";
import Ripple from "primevue/ripple";

const app = createApp(App);
app.use(VueApexCharts);
app.use(PrimeVue, { ripple: true });
app.directive("ripple", Ripple);
app.mount("#app");
