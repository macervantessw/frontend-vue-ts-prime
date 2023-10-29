<template>
  <div class="w-full h-full flex flex-column p-2 gap-3">
    <!-- <LineChart id="oxymetry_chart" height="250px" class="w-full" :file="file" :data="oxymetryChartData" :name="$t('Oxymetry view')" @wheel="handleWheel" />
    <LineChart id="respiratory_chart" height="250px" class="w-full" :file="file" :data="respiratoryData" :name="$t('Respiratory view')" @wheel="handleWheel" />
    <BrushChart id="brush-chart" class="w-full h-11rem" :file="file" :data="brushData" target="breathe-rate-chart" @wheel="handleWheel" /> -->
    <div class="chart-container h-20rem">
      <OxymetryChart ref="oxymetryChart" :files="zippedFiles" />
    </div>
    <div class="chart-container h-20rem">
      <RespiratoryChart ref="respiratoryChart" :files="zippedFiles" />
    </div>
    <div class="chart-container h-10rem">
      <MinimapChart ref="miniMapChart" />
    </div>
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, defineProps, onBeforeMount, onMounted, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";
//import { ASAP, DataPoint } from "downsample";
// import { CHART_MOVEMENT } from "../constants";
// import { useMagicKeys, whenever } from "@vueuse/core";
import { useChartsStore } from "../store";
import JSZip from "jszip";

import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import { IChartApi, ISeriesApi, Range } from "lightweight-charts";
import MinimapChart from "../components/Charts/MinimapChart.vue";

const oxymetryChart = ref();
const respiratoryChart = ref();

onMounted(() => {
  const oxChart: IChartApi = oxymetryChart.value?.getChart();
  const resChart: IChartApi = respiratoryChart.value?.getChart();

  oxChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    resChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  resChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  function getCrosshairDataPoint(series: ISeriesApi<"Line">, param: any) {
    if (!param.time) {
      return null;
    }
    const dataPoint = param.seriesData.get(series);
    return dataPoint || null;
  }

  function syncCrosshair(chart: IChartApi, series: ISeriesApi<"Line">, dataPoint: any) {
    if (dataPoint) {
      chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
      return;
    }
    chart.clearCrosshairPosition();
  }
  oxChart.subscribeCrosshairMove((param) => {
    const mainSeries1 = oxymetryChart.value?.getSeries()[0];
    const mainSeries2 = respiratoryChart.value?.getSeries()[0];
    const dataPoint = getCrosshairDataPoint(mainSeries1, param);
    syncCrosshair(resChart, mainSeries2, dataPoint);
  });
  resChart.subscribeCrosshairMove((param) => {
    const mainSeries1 = oxymetryChart.value?.getSeries()[0];
    const mainSeries2 = respiratoryChart.value?.getSeries()[0];
    const dataPoint = getCrosshairDataPoint(mainSeries2, param);
    syncCrosshair(oxChart, mainSeries1, dataPoint);
  });
});
// const { current } = useMagicKeys();
// const keys = useMagicKeys();
const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
const zippedFiles = ref({} as { [key: string]: JSZip.JSZipObject });

// const downsampledData = ref([] as Data[]);
// const breathRateData = ref([] as Data[]);

// const brushData = ref([] as Data[]);
// const basalOximetryData = ref([] as Data[]);
// const hrData = ref([] as Data[]);
// const oxymetryData = ref([] as Data[]);
const chartsStore = useChartsStore();

onBeforeMount(() => {
  downloadFileAndUncompress().then(async (files) => {
    if (files) zippedFiles.value = files;
    if (!zippedFiles.value) return;

    const timeAxisUnzipped = await zippedFiles.value[SIGNALS.BASETIME].async("uint8array");
    const timeAxis: number[] = readDatFile(timeAxisUnzipped);
    timeAxis.splice(-10);
    chartsStore.timeAxis = timeAxis;
    // .filter((_e, index) => index % 10 === 0);

    // brushData.value = timeAxis.map((element) => ({ x: element, y: 0 }));

    // getData(zippedFiles, timeAxis, SIGNALS.HR).then((data) => (hrData.value = data));
    // getData(zippedFiles, timeAxis, SIGNALS.OXIMETRY).then((data) => (oxymetryData.value = data));
    // getData(zippedFiles, timeAxis, SIGNALS.BASAL_OXIMETRY).then((data) => (basalOximetryData.value = data));
  });
});

// whenever(keys.ArrowRight, () => {
//   if (current.has("shift") && current.has("control")) move(chartsStore.selection.max - chartsStore.selection.min);
//   else move(CHART_MOVEMENT);
// });

// whenever(keys.ArrowLeft, () => {
//   if (current.has("shift") && current.has("control")) move((chartsStore.selection.max - chartsStore.selection.min) * -1);
//   else move(-CHART_MOVEMENT);
// });

// function move(quantity: number) {
//   if (!chartsStore.selection.min) chartsStore.selection.min = chartsStore.xaxis.min;
//   if (!chartsStore.selection.max) chartsStore.selection.max = chartsStore.xaxis.max;
//   chartsStore.selection = {
//     min: chartsStore.selection.min + quantity,
//     max: chartsStore.selection.max + quantity,
//   };
// }

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  return zippedFiles;
}
</script>
<style></style>
