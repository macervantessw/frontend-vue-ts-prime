<template>
  <div class="w-full h-full p-3">
    <BreathRateChart id="breath-rate-chart" class="w-full h-11rem" :file="file" :data="data" />
  </div>
</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, defineProps, onBeforeMount, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";

import BreathRateChart from "../components/Charts/BreathRateChart.vue";

const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
let zippedFiles = null;
const timeAxisData = ref([] as number[]);
const data = ref([] as number[][]);

onBeforeMount(() => {
  downloadFileAndUncompress().then((files) => {
    zippedFiles = files;
    if (!zippedFiles) return;

    const promises = [] as Promise<Uint8Array>[];
    promises.push(zippedFiles[SIGNALS.BASETIME].async("uint8array"));
    promises.push(zippedFiles[SIGNALS.BREATH_RATE].async("uint8array"));

    Promise.all(promises).then((values) => {
      timeAxisData.value = readDatFile(values[0]);
      //chartOptions.value.xaxis.categories = timeAxisData.value.slice(0, 1000);
      const breathRateData = readDatFile(values[1]);
      data.value = breathRateData.map((element, index) => {
        return [timeAxisData.value[index], element];
      });
    });
  });
});

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  return zippedFiles;
}
</script>
<style></style>
