<template>
  <div class="w-full h-full flex flex-column p-2 gap-3">
    <div class="card chart-container h-20rem shadow-2">
      <OxymetryChart ref="oxymetryChart" :files="zippedFiles" />
    </div>
    <div class="card chart-container h-20rem shadow-2">
      <RespiratoryChart ref="respiratoryChart" :files="zippedFiles" />
    </div>
    <div class="card chart-container h-10rem shadow-2">
      <MinimapChart ref="miniMapChart" :state-events="stateEvents" />
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
import { useChartsStore, useSessionsStore, useUsersStore } from "../store";
import JSZip from "jszip";

import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import { IChartApi, ISeriesApi, Range } from "lightweight-charts";
import MinimapChart from "../components/Charts/MinimapChart.vue";
import { Event, Session } from "../interfaces";

const oxymetryChart = ref();
const respiratoryChart = ref();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const sessionInfo = ref({} as Session);
const stateEvents = ref([] as Event[]);

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
    if (!oxymetryChart.value?.getSeries()[0] || !respiratoryChart.value?.getSeries()[0]) return;
    const mainSeries1 = oxymetryChart.value?.getSeries()[0].serie;
    const mainSeries2 = respiratoryChart.value?.getSeries()[0].serie;
    const dataPoint = getCrosshairDataPoint(mainSeries1, param);
    syncCrosshair(resChart, mainSeries2, dataPoint);
  });
  resChart.subscribeCrosshairMove((param) => {
    if (!oxymetryChart.value?.getSeries()[0] || !respiratoryChart.value?.getSeries()[0]) return;
    const mainSeries1 = oxymetryChart.value?.getSeries()[0].serie;
    const mainSeries2 = respiratoryChart.value?.getSeries()[0].serie;
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
  patientId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
});
const zippedFiles = ref({} as { [key: string]: JSZip.JSZipObject });
const chartsStore = useChartsStore();

onBeforeMount(() => {
  sessionsStore.fetchSessionInfo(usersStore.userId, props.patientId, props.sessionId).then((session: Session) => {
    sessionInfo.value = session;
    stateEvents.value = session?.Data?.StateEvents;
  });
  downloadFileAndUncompress().then(async (files) => {
    if (files) zippedFiles.value = files;
    if (!zippedFiles.value) return;

    const timeAxisUnzipped = await zippedFiles.value[SIGNALS.BASETIME].async("uint8array");
    const timeAxis: number[] = readDatFile(timeAxisUnzipped);
    timeAxis.splice(-2000);
    chartsStore.timeAxis = timeAxis;
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
<style>
.card {
  background: var(--surface-card);
  padding: 5px;
  border-radius: 4px;
}
</style>
