<template>
  <div class="clinical-tab">
    <ClinicalForm :sessionId="sessionId" />
  </div>
</template>

<script setup lang="ts">
import ClinicalForm from "../../views/ClinicalForm.vue";

const props = defineProps({
  sessionId: {
    type: String,
    required: true,
  },
});
</script>

<style>
.clinical-tab {
  padding: 1rem;
}
</style>
