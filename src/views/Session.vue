<template>
  <div class="w-full h-full p-3">
    <!-- <LineChart id="breath-rate-chart" height="200px" class="w-full" :file="file" :data="breathRateData" /> -->
    <LineChart id="respiratory_chart" height="200px" class="w-full" :file="file" :data="respiratoryData" />
    <BrushChart id="brush-chart" class="w-full h-11rem" :file="file" :data="brushData" target="breathe-rate-chart" />
  </div>
</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, computed, defineProps, onBeforeMount, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { MAX_SAMPLES, SIGNALS } from "../constants";
import { ASAP, DataPoint } from "downsample";
import LineChart from "../components/Charts/LineChart.vue";
import BrushChart from "../components/Charts/BrushChart.vue";
import JSZip from "jszip";
import { Data, Series } from "../interfaces";

const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
let zippedFiles = null;

// const downsampledData = ref([] as Data[]);
// const breathRateData = ref([] as Data[]);
const movementData = ref([] as Data[]);
const airFlowData = ref([] as Data[]);
const basalAirFlowData = ref([] as Data[]);
const brushData = ref([] as Data[]);

const respiratoryData = computed(() => {
  if (!basalAirFlowData.value.length || !airFlowData.value.length || !movementData.value.length) return [] as Series[];
  return [
    { name: "Basal Air flow", data: basalAirFlowData.value },
    { name: "Air flow", data: airFlowData.value },
    { name: "Movement", data: movementData.value },
  ] as Series[];
});

onBeforeMount(() => {
  downloadFileAndUncompress().then(async (files) => {
    zippedFiles = files;
    if (!zippedFiles) return;

    const timeAxisUnzipped = await zippedFiles[SIGNALS.BASETIME].async("uint8array");
    const timeAxis: number[] = readDatFile(timeAxisUnzipped);
    const timeAxisData = timeAxis.map((element) => {
      return [element, 0];
    });
    brushData.value = ASAP(timeAxisData as DataPoint[], 1000) as { x: number; y: number }[];

    // getData(zippedFiles, timeAxis, SIGNALS.BREATH_RATE).then((breathRate) => {
    //   breathRateData.value = breathRate;
    // });

    getData(zippedFiles, timeAxis, SIGNALS.AIR_FFLOW).then((data) => {
      airFlowData.value = ASAP(data as DataPoint[], MAX_SAMPLES) as { x: number; y: number }[];
    });
    getData(zippedFiles, timeAxis, SIGNALS.BASAL_AIR_FLOW).then((data) => {
      basalAirFlowData.value = ASAP(data as DataPoint[], MAX_SAMPLES) as { x: number; y: number }[];
    });
    getData(zippedFiles, timeAxis, SIGNALS.MOVEMENT).then((data) => {
      movementData.value = ASAP(data as DataPoint[], MAX_SAMPLES) as { x: number; y: number }[];
    });
  });
});

async function getData(files: Record<string, JSZip.JSZipObject>, timeAxis: number[], fileName: string) {
  const dataUnzipped = await files[fileName].async("uint8array");
  const data = readDatFile(dataUnzipped);
  return data.map((element, index) => {
    return { x: timeAxis[index], y: element };
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
