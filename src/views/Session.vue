<template>
  <div class="w-full h-full flex flex-column p-2 gap-3">
    <LineChart id="oxymetry_chart" height="250px" class="w-full" :file="file" :data="oxymetryChartData" :name="$t('Oxymetry view')" @wheel="handleWheel" />
    <LineChart id="respiratory_chart" height="250px" class="w-full" :file="file" :data="respiratoryData" :name="$t('Respiratory view')" @wheel="handleWheel" />
    <BrushChart id="brush-chart" class="w-full h-11rem" :file="file" :data="brushData" target="breathe-rate-chart" @wheel="handleWheel" />
  </div>
</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, computed, defineProps, onBeforeMount, ref } from "vue";
import { readDatFile, uncompressFile, getData } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";
//import { ASAP, DataPoint } from "downsample";
import LineChart from "../components/Charts/LineChart.vue";
import BrushChart from "../components/Charts/BrushChart.vue";
import { Data, Series } from "../interfaces";
import { CHART_MOVEMENT } from "../constants";
import { useMagicKeys, whenever } from "@vueuse/core";
import { useChartsStore } from "../store";

const { current } = useMagicKeys();
const keys = useMagicKeys();
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
const basalOximetryData = ref([] as Data[]);
const hrData = ref([] as Data[]);
const oxymetryData = ref([] as Data[]);
const chartsStore = useChartsStore();
const respiratoryData = computed(() => {
  if (!basalAirFlowData.value.length || !airFlowData.value.length || !movementData.value.length) return [] as Series[];
  return [
    { name: "Basal Air flow", data: basalAirFlowData.value },
    { name: "Air flow", data: airFlowData.value },
    { name: "Movement", data: movementData.value },
  ] as Series[];
});

const oxymetryChartData = computed(() => {
  if (!hrData.value.length || !oxymetryData.value.length || !basalOximetryData.value.length) return [] as Series[];
  return [
    { name: "Basal Oxymetry", data: basalOximetryData.value },
    { name: "Oxymetry", data: oxymetryData.value },
    { name: "Heart rate", data: hrData.value },
  ] as Series[];
});

onBeforeMount(() => {
  downloadFileAndUncompress().then(async (files) => {
    zippedFiles = files;
    if (!zippedFiles) return;

    const timeAxisUnzipped = await zippedFiles[SIGNALS.BASETIME].async("uint8array");
    const timeAxis: number[] = readDatFile(timeAxisUnzipped).filter((_e, index) => index % 10 === 0);

    brushData.value = timeAxis.map((element) => ({ x: element, y: 0 }));

    getData(zippedFiles, timeAxis, SIGNALS.AIR_FLOW).then((data) => (airFlowData.value = data));
    getData(zippedFiles, timeAxis, SIGNALS.BASAL_AIR_FLOW).then((data) => (basalAirFlowData.value = data));
    getData(zippedFiles, timeAxis, SIGNALS.MOVEMENT).then((data) => (movementData.value = data));
    getData(zippedFiles, timeAxis, SIGNALS.HR).then((data) => (hrData.value = data));
    getData(zippedFiles, timeAxis, SIGNALS.OXIMETRY).then((data) => (oxymetryData.value = data));
    getData(zippedFiles, timeAxis, SIGNALS.BASAL_OXIMETRY).then((data) => (basalOximetryData.value = data));
  });
});

whenever(keys.ArrowRight, () => {
  if (current.has("shift") && current.has("control")) move(chartsStore.xaxis.max - chartsStore.xaxis.min);
  else move(CHART_MOVEMENT);
});

whenever(keys.ArrowLeft, () => {
  if (current.has("shift") && current.has("control")) move((chartsStore.xaxis.max - chartsStore.xaxis.min) * -1);
  else move(-CHART_MOVEMENT);
});

function move(quantity: number) {
  chartsStore.xaxis = {
    min: chartsStore.xaxis.min + quantity,
    max: chartsStore.xaxis.max + quantity,
  };
}

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  return zippedFiles;
}

function handleWheel(event: WheelEvent) {
  const { deltaY } = event;
  if (deltaY > 0) {
    move(deltaY * 20);
  } else {
    move(deltaY * 20);
  }
}
</script>
<style></style>
