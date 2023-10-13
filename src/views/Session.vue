<template>
  <div class="w-full h-full p-3">
    <LineChart id="breath-rate-chart" height="200px" class="w-full" :file="file" :data="breathRateData" />
    <BrushChart id="brush-chart" class="w-full h-11rem" :file="file" :data="downsampledData" target="breathe-rate-chart" />
  </div>
</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, defineProps, onBeforeMount, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";
import { ASAP, DataPoint } from "downsample";
import LineChart from "../components/Charts/LineChart.vue";
import BrushChart from "../components/Charts/BrushChart.vue";
import JSZip from "jszip";

const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
let zippedFiles = null;
const timeAxisData = ref([] as number[]);
const downsampledData = ref([] as { x: number; y: number }[]);
const breathRateData = ref([] as number[][]);

onBeforeMount(() => {
  downloadFileAndUncompress().then(async (files) => {
    zippedFiles = files;
    if (!zippedFiles) return;

    const timeAxisUnzipped = await zippedFiles[SIGNALS.BASETIME].async("uint8array");
    timeAxisData.value = readDatFile(timeAxisUnzipped);

    getData(zippedFiles, timeAxisData.value, SIGNALS.BREATH_RATE).then((breathRate) => {
      breathRateData.value = breathRate;
      downsampledData.value = ASAP(breathRate as DataPoint[], 1000) as { x: number; y: number }[];
    });
  });
});

async function getData(files: Record<string, JSZip.JSZipObject>, timeAxis: number[], fileName: string) {
  const dataUnzipped = await files[fileName].async("uint8array");
  const data = readDatFile(dataUnzipped);
  return data.map((element, index) => {
    return [timeAxis[index], element];
  });
}

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  return zippedFiles;
}
</script>
<style></style>
