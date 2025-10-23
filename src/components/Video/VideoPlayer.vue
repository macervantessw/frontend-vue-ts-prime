<script lang="ts" setup>
import videojs from "video.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type Player from "video.js/dist/types/player";
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
const isMinimized = ref(false);

onMounted(() => {
  const options = {
    ...props.options,
  };
  player.value = videojs(videoPlayer.value, options);
  player.value.on("enterpictureinpicture", () => {
    isMinimized.value = true;
  });

  player.value.on("leavepictureinpicture", () => {
    isMinimized.value = false;
  });
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
  <div ref="videoContainer" :class="{ minimized: isMinimized }">
    <video ref="videoPlayer" class="video-js" :class="{ minimized: isMinimized }"></video>
  </div>
</template>
<style>
.minimized {
  width: 30rem !important;
  height: 30px !important;
  min-height: 0;
}
.video-js {
  width: 100%;
  height: 100%;
}
</style>
