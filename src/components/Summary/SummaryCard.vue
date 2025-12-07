<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="summary-card p-4 shadow-1 flex flex-column text-xl font-semibold text-700 w-full sm:w-auto"
  >
    <h2 class="mt-0 font-bold text-3xl text-primary">
      {{ title }}
    </h2>
    <slot />
  </div>
</template>

<style>
.summary-card {
  /* Necesario para que los elementos con position:absolute
     dentro (como tu icono y tooltip) se posicionen bien */
  position: relative;

  /* Para que el tooltip no se corte si sale fuera del card */
  overflow: visible;
}
</style>
