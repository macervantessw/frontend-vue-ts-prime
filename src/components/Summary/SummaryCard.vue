<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div class="summary-card p-4 col-12 md:col-6 lg:col-4 shadow-1 flex flex-column text-xl font-semibold text-700">
    <h2 class="mt-0 font-bold text-3xl text-primary">{{ title }}</h2>
    <slot />
  </div>
</template>
<style></style>
