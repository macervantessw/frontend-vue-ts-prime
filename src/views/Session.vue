<template>
  <div class="w-full h-full flex flex-column p-4 pt-0 gap-3">
    <div>
      <h1 class="m-0 text-800">{{ selectedSession?.PatientName || selectedSession?.Name }} {{ selectedSession?.Surname || selectedSession?.PatientSurname }}</h1>
      <h3 class="m-0 text-600">{{ sessionDate() }}</h3>
    </div>
    <div class="card card-small chart-container w-full shadow-2">
      <StateChart ref="stateChartRef" :state-events="sessionsStore.selectedSession?.Data.StateEvents" class="w-full h-full relative" @wheel.prevent="wheelHandler" />
    </div>
    <div class="card chart-container h-full w-full shadow-2" style="max-height: 15rem; min-height: 7rem">
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
    <div class="card card-small chart-container h-full w-full shadow-2" style="max-height: 7rem; min-height: 4rem">
      <AudioChart
        ref="audioChartRef"
        :files="zippedFiles"
        :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
        class="w-full h-full relative"
        @wheel.prevent="wheelHandler"
      />
    </div>
    <div class="card card-small chart-container h-full w-full shadow-2" style="max-height: 7rem; min-height: 4rem">
      <MinimapChart
        ref="miniMapChart"
        :state-events="sessionsStore.selectedSession?.Data.StateEvents"
        :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents"
        :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
        class="w-full h-full relative"
        @wheel.prevent="wheelHandler"
      />
    </div>

    <VideoPlayer v-if="!!videoLink" :options="videoOptions" style="height: 24rem; width: 32rem" />
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { getBytes } from "firebase/storage";
import { IChartApi, Range, Time } from "lightweight-charts";
import { onBeforeMount, onMounted, ref, computed } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS, DOWNSAMPLE_RATIO } from "../constants";
import { storeToRefs } from "pinia";
import { syncronizeCrosshairs } from "../utilities/chart.utilities";
import { useChartsStore, useSessionsStore } from "../store";
import AudioChart from "../components/Charts/AudioChart.vue";
import dayjs from "dayjs";
import JSZip from "jszip";
import MinimapChart from "../components/Charts/MinimapChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import StateChart from "../components/Charts/StateChart.vue";
import VideoPlayer from "../components/Video/VideoPlayer.vue";

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
const videoLink = ref(undefined as string | undefined);
const videoOptions = computed(() => {
  return {
    autoplay: false,
    fill: true,
    controls: true,
    height: "250",
    sources: [
      {
        src: videoLink.value,
        type: "video/mp4",
      },
    ],
  };
});

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
  if (selectedSession.value) {
    sessionsStore.fetchSessionVideo(selectedSession.value.DeviceId, selectedSession.value?.SessionId, selectedSession.value?.userId).then((link) => {
      videoLink.value = link;
    });
  }
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
  const file = await sessionsStore.fetchSessionFile(
    sessionsStore.selectedSession.DeviceId,
    sessionsStore.selectedSession.SessionId,
    sessionsStore.selectedSession.userId,
  );
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
