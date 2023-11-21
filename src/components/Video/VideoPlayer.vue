<script lang="ts" setup>
import videojs from "video.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

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
</script>
<template>
  <video ref="videoPlayer" class="video-js"></video>
</template>
<style></style>
