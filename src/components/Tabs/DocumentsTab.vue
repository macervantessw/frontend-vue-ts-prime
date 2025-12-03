<template>
  <div class="documents-tab">

    <!-- INPUT OCULTO QUE RECIBE EL REF DESDE EL PADRE -->
    <input
      ref="pdfInput"
      type="file"
      accept="application/pdf"
      style="display:none"
      @change="$emit('onPdfSelected', $event)"
    />

    <!-- BOTÓN QUE ACTIVA EL INPUT -->
    <Button
      label="Subir documento"
      icon="pi pi-upload"
      class="border-round-3xl"
      :loading="uploadingPdf"
      @click="$emit('triggerPdfSelect')"
    />
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";

const props = defineProps({
  uploadingPdf: Boolean,
  pdfInput: Object
});

const emit = defineEmits(["triggerPdfSelect", "onPdfSelected"]);
</script>

<style>
.documents-tab {
  padding: 1rem;
}
</style>
