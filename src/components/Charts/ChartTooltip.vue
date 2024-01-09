<script lang="ts" setup>
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});
</script>
<template>
  <div ref="tooltip" class="tooltip" :style="{ display: show ? 'block' : 'none' }">
    <slot></slot>
  </div>
</template>
<style>
.tooltip {
  width: 96px;
  height: 85%;
  position: absolute;
  padding: 8px;
  box-sizing: border-box;
  font-size: 12px;
  text-align: left;
  z-index: 1000;
  top: 0px;
  left: 12px;
  display: none;
  pointer-events: none;
  color: black;
  border-radius: 4px 4px 0px 0px;
  border-bottom: none;
  border-color: rgba(239, 83, 80, 1);
  box-shadow: 0 2px 5px 0 rgba(117, 134, 150, 0.45);
  font-family: -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(2px);
}
</style>
