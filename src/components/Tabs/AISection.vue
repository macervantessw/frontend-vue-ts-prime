<template>
  <div class="mt-5">
    <h2>{{ $t("Asistente IA") }}</h2>

    <Button
      label="Generar análisis con IA"
      icon="pi pi-brain"
      class="border-round-3xl mt-3"
      @click="$emit('openAIReport')"
    />
  </div>
</template>

<script setup>
import Button from "primevue/button";

defineEmits(["openAIReport"]);
</script>
