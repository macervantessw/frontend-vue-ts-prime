<template>
  <div class="w-full h-full flex flex-column p-4 pt-6 gap-3">
    <div class="card card-small chart-container w-full shadow-2">
      <StateChart ref="stateChartRef" :state-events="sessionsStore.selectedSession?.Data.StateEvents" class="w-full" />
    </div>
    <div class="card chart-container h-full w-full shadow-2">
      <OxymetryChart ref="oxymetryChartRef" :files="zippedFiles" class="w-full" />
    </div>
    <div class="card chart-container h-full w-full shadow-2">
      <RespiratoryChart ref="respiratoryChartRef" :files="zippedFiles" :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents" class="w-full" />
    </div>
    <div class="card card-small chart-container h-full w-full shadow-2">
      <AudioChart ref="audioChartRef" :files="zippedFiles" :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents" class="w-full" />
    </div>
    <div class="card card-small chart-container h-full w-full shadow-2">
      <MinimapChart
        ref="miniMapChart"
        :state-events="sessionsStore.selectedSession?.Data.StateEvents"
        :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents"
        :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
        class="w-full"
      />
    </div>
    <!-- <div>
      <VideoPlayer :options="videoOptions" />
    </div> -->
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { IChartApi, Range, Time } from "lightweight-charts";
import { onBeforeMount, onMounted, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";
import { getBytes } from "firebase/storage";
import { syncronizeCrosshairs } from "../utilities/chart.utilities";
import { useChartsStore, useSessionsStore } from "../store";
import AudioChart from "../components/Charts/AudioChart.vue";
import JSZip from "jszip";
import MinimapChart from "../components/Charts/MinimapChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import StateChart from "../components/Charts/StateChart.vue";

const audioChartRef = ref();
const fromIndexRef = ref(-999);
const miniMapChart = ref();
const oxymetryChartRef = ref();
const respiratoryChartRef = ref();
// const respiratoryEvents = ref([] as Event[]);
const sessionsStore = useSessionsStore();
const stateChartRef = ref();
// const stateEvents = ref([] as Event[]);
// const snoringEvents = ref([] as Event[]);
// const videoOptions = ref({
//   autoplay: false,
//   controls: true,
//   height: "250",
//   sources: [
//     {
//       src: "https://vjs.zencdn.net/v/oceans.mp4",
//       type: "video/mp4",
//     },
//   ],
// });
onMounted(() => {
  const oxChart: IChartApi = oxymetryChartRef.value?.getChart();
  const respiratoryChart: IChartApi = respiratoryChartRef.value?.getChart();
  const stateChart: IChartApi = stateChartRef.value?.getChart();
  const audioChart: IChartApi = audioChartRef.value?.getChart();

  oxChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    respiratoryChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    stateChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    audioChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  respiratoryChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    stateChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    audioChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    const fromIndex = Math.floor(timeRange?.from as number);
    const toIndex = Math.floor(timeRange?.to as number);

    if (fromIndex - fromIndexRef.value > 200 || fromIndexRef.value - fromIndex > 200) {
      fromIndexRef.value = fromIndex;
      const from = miniMapChart.value?.getSeries()[0].data()[fromIndex];
      const to = miniMapChart.value?.getSeries()[0].data()[toIndex];

      if (from?.time && to?.time) miniMapChart.value?.drawBox({ from: from.time as Time, to: to.time as Time });
    }
  });

  stateChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    respiratoryChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    audioChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  audioChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    respiratoryChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    stateChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  syncronizeCrosshairs(
    oxymetryChartRef.value,
    respiratoryChartRef.value,
    stateChartRef.value,
    audioChartRef.value,
    SIGNALS.OXIMETRY,
    SIGNALS.AIR_FLOW,
    SIGNALS.STATE,
    SIGNALS.AUDIO,
  );
});

const zippedFiles = ref({} as { [key: string]: JSZip.JSZipObject });
const chartsStore = useChartsStore();

onBeforeMount(() => {
  downloadFileAndUncompress().then(async (files) => {
    if (files) zippedFiles.value = files;
    if (!zippedFiles.value) return;

    const timeAxisUnzipped = await zippedFiles.value[SIGNALS.BASETIME].async("uint8array");
    const timeAxis: number[] = readDatFile(timeAxisUnzipped);
    timeAxis.splice(-2000);
    chartsStore.timeAxis = timeAxis.filter((_, index) => index % 3 === 0);
    chartsStore.reducedTimeAxis = timeAxis.filter((_, index) => index % 10 === 0);
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
  if (!sessionsStore.selectedSession) return;
  const file = await sessionsStore.fetchSessionFile(sessionsStore.selectedSession.DeviceId, sessionsStore.selectedSession.SessionId);
  if (!file) return;
  const bytes = await getBytes(file);
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
  height: 100%;
  max-height: 20rem;
  min-height: 10rem;
  flex-grow: 20;
}
.card-small {
  max-height: 10rem;
  min-height: 5rem;
  flex-grow: 10;
}
</style>
