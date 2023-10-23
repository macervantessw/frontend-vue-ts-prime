<template>
  <router-view />
  <!-- <Button label="Download Zip" @click="downloadZip" /> -->
  <Toast position="bottom-right" group="br" />
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useMessagesStore } from "./store";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const messagesStore = useMessagesStore();
document.documentElement.style.fontSize = "12px";

watch(
  () => messagesStore.toastMessage,
  (toastMessage) => {
    if (toastMessage.message) {
      if (!toastMessage.severity || (toastMessage.severity != "success" && toastMessage.severity != "error")) toastMessage.severity = "warn";
      toast.add({
        severity: toastMessage.severity,
        detail: toastMessage.message,
        group: "br",
        life: 6000,
        styleClass: "text-xl",
      });
    }
  },
);
</script>

<style>
html {
  height: 100%;
}
body {
  margin: 0;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  background-color: #ffffff;
  background-image: url("./assets/subtle-prism.svg");
  background-attachment: fixed;
  background-size: cover;
}
a {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
</style>
