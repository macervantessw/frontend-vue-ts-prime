<template>
  <div class="w-full h-full flex flex-column p-4 pt-0 gap-3">
    <div>
      <h1 class="m-0 text-800">{{ selectedSession?.PatientName || selectedSession?.Name }} {{ selectedSession?.Surname || selectedSession?.PatientSurname }}</h1>
      <h3 class="m-0 text-600">{{ sessionDate() }}</h3>
    </div>
    <div class="card card-small chart-container w-full shadow-2">
      <StateChart ref="stateChartRef" :state-events="sessionsStore.selectedSession?.Data.StateEvents" class="w-full h-full relative" @wheel.prevent="wheelHandler" />
    </div>
    <div class="card chart-container h-full w-full shadow-2">
      <OxymetryChart ref="oxymetryChartRef" :files="zippedFiles" class="w-full h-full relative" @wheel.prevent="wheelHandler" />
    </div>
    <div class="card chart-container h-full w-full shadow-2">
      <RespiratoryChart
        ref="respiratoryChartRef"
        :files="zippedFiles"
        :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents"
        class="w-full h-full relative"
        @wheel.prevent="wheelHandler"
      />
    </div>
    <div class="card card-small chart-container h-full w-full shadow-2">
      <AudioChart
        ref="audioChartRef"
        :files="zippedFiles"
        :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
        class="w-full h-full relative"
        @wheel.prevent="wheelHandler"
      />
    </div>
    <div class="card card-small chart-container h-full w-full shadow-2">
      <MinimapChart
        ref="miniMapChart"
        :state-events="sessionsStore.selectedSession?.Data.StateEvents"
        :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents"
        :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
        class="w-full h-full relative"
        @wheel.prevent="wheelHandler"
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
import { SIGNALS, DOWNSAMPLE_RATIO } from "../constants";
import { getBytes } from "firebase/storage";
import { syncronizeCrosshairs } from "../utilities/chart.utilities";
import { useChartsStore, useSessionsStore } from "../store";
import AudioChart from "../components/Charts/AudioChart.vue";
import JSZip from "jszip";
import MinimapChart from "../components/Charts/MinimapChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import StateChart from "../components/Charts/StateChart.vue";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";

const audioChartRef = ref();
const fromIndexRef = ref(-999);
const miniMapChart = ref();
const oxymetryChartRef = ref();
const respiratoryChartRef = ref();
// const respiratoryEvents = ref([] as Event[]);
const sessionsStore = useSessionsStore();
const stateChartRef = ref();
const { selectedSession } = storeToRefs(sessionsStore);
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
const sessionDate = () => {
  const date = dayjs.unix(Number(selectedSession.value?.SessionId));
  return date.format("DD/MM/YYYY HH:mm");
};
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

      if (from?.time && to?.time) {
        miniMapChart.value?.drawBox({ from: from.time as Time, to: to.time as Time });
        chartsStore.selection = {
          range: {
            from: from.time as Time,
            to: to.time as Time,
          },
        };
      }
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
    chartsStore.timeAxis = timeAxis.filter((_, index) => index % DOWNSAMPLE_RATIO === 0);
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

const wheelHandler = (e: any) => {
  const increment = e.deltaY * 50;
  chartsStore.selection.range.from = (Number(chartsStore.selection.range.from) + increment) as Time;
  chartsStore.selection.range.to = (Number(chartsStore.selection.range.to) + increment) as Time;
};
</script>
<style>
.card {
  background: #ffffff00;
  border-radius: 4px;
  height: 100%;
  max-height: 20rem;
  min-height: 10rem;
  flex-grow: 20;
  backdrop-filter: blur(6px);
}
.card-small {
  max-height: 10rem;
  min-height: 5rem;
  flex-grow: 10;
}
</style>
