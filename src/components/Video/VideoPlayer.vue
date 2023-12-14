<script lang="ts" setup>
import videojs from "video.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { useChartsStore } from "../../store";

const chartsStore = useChartsStore();
const props = defineProps({
  options: {
    type: Object,
    default: () => ({}),
  },
});

const videoPlayer = ref();
const player = ref<Player>();

onMounted(() => {
  const options = {
    ...props.options,
  };
  player.value = videojs(videoPlayer.value, options);
});

onBeforeUnmount(() => {
  if (player.value) {
    player.value.dispose();
  }
});

watch(
  () => chartsStore.currentTime,
  (currentTime: number) => {
    if (player.value) {
      player.value.currentTime(currentTime);
    }
  },
);
</script>
<template>
  <video ref="videoPlayer" class="video-js"></video>
</template>
<style></style>
