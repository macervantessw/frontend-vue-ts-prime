<script lang="ts" setup>
import Button from "primevue/button";

const emit = defineEmits(["zoomIn", "zoomOut"]);
</script>
<template>
  <div class="zoom-buttons flex flex-column">
    <Button icon="pi pi-plus" text raised @click="emit('zoomIn')" />
    <Button icon="pi pi-minus" text raised @click="emit('zoomOut')" />
  </div>
</template>
<style>
.zoom-buttons .p-button {
  width: 2rem;
  height: 2rem;
  margin: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-size: 1rem;
}
.zoom-buttons .pi {
  font-size: 0.75rem;
}
</style>
