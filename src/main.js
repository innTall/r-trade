import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "./style.css";
import App from "./App.vue";
import router from "./router/index.js";

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);
app.use(pinia).use(router).mount("#app");

// --- PWA auto-update ---
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true); // activate new SW
    window.location.reload(); // reload app
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  }
});