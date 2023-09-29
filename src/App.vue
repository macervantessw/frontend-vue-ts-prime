<template>
  <Button label="Download Zip" @click="downloadZip" />
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { downloadFile } from "./utilities/file.utilities";
document.documentElement.style.fontSize = "12px";

function downloadZip() {
  downloadFile("https://getsamplefiles.com/download/zip/sample-1.zip");
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
