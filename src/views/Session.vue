<template>
  <div class="w-full h-full flex flex-column pt-0 gap-3">
    <section class="flex justify-content-between">
      <span>
        <h1 class="m-0 text-800">{{ selectedSession?.PatientName || selectedSession?.Name }} {{ selectedSession?.Surname || selectedSession?.PatientSurname }}</h1>
        <h3 class="m-0 text-600">{{ sessionDate() }}</h3>
      </span>
      <span class="flex align-items-end">
        <h3 class="m-0 text-600">{{ $t("visible-range") }}: {{ chartsStore.selectionRangeDuration }}</h3>
      </span>
    </section>
    <MinimapChart
      ref="miniMapChart"
      :state-events="sessionsStore.selectedSession?.Data.StateEvents"
      :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents"
      :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
      class="card card-small chart-container h-full w-full shadow-2 relative"
      style="max-height: 8rem; min-height: 8rem"
      @wheel.prevent="wheelHandler"
    />

    <StateChart
      v-if="sessionsStore.selectedSession"
      ref="stateChartRef"
      v-model:state-events="sessionsStore.selectedSession.Data.StateEvents"
      class="card card-small chart-container w-full shadow-2 relative"
      @wheel.prevent="wheelHandler"
      @event-changed="eventChanged"
    />
    <OxymetryChart
      ref="oxymetryChartRef"
      style="max-height: 15rem; min-height: 7rem"
      :files="zippedFiles"
      class="card chart-container h-full w-full shadow-2 relative"
      @wheel.prevent="wheelHandler"
    />
    <RespiratoryChart
      ref="respiratoryChartRef"
      :files="zippedFiles"
      :respiratory-events="sessionsStore.selectedSession?.Data.RespiratoryEvents || []"
      :movement-events="sessionsStore.selectedSession?.Data.MovementEvents || []"
      class="card chart-container h-full w-full shadow-2 relative"
      @wheel.prevent="wheelHandler"
    />
    <AudioChart
      ref="audioChartRef"
      :files="zippedFiles"
      :snoring-events="sessionsStore.selectedSession?.Data.SnoringEvents"
      style="max-height: 7rem; min-height: 4rem"
      class="card card-small chart-container h-full w-full shadow-2 relative"
      @wheel.prevent="wheelHandler"
    />

    <VideoPlayer v-if="!!videoLink" :options="videoOptions" style="height: 24rem; width: 32rem" />
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { getBytes } from "firebase/storage";
import { IChartApi, Range, Time } from "lightweight-charts";
import { onBeforeMount, onMounted, ref, computed } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS, DOWNSAMPLE_RATIO, RESPIRATORY_EVENTS } from "../constants";
import { storeToRefs } from "pinia";
import { syncronizeCrosshairs } from "../utilities/chart.utilities";
import { useChartsStore, useSessionsStore } from "../store";
import AudioChart from "../components/Charts/AudioChart.vue";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import JSZip from "jszip";
import MinimapChart from "../components/Charts/MinimapChart.vue";
import OxymetryChart from "../components/Charts/OxymetryChart.vue";
import RespiratoryChart from "../components/Charts/RespiratoryChart.vue";
import StateChart from "../components/Charts/StateChart.vue";
import VideoPlayer from "../components/Video/VideoPlayer.vue";
import { useMagicKeys, whenever } from "@vueuse/core";

dayjs.extend(duration);

const keys = useMagicKeys();
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
    audioChart?.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  respiratoryChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    stateChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    audioChart?.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
  });

  stateChart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    oxChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    respiratoryChart.timeScale().setVisibleLogicalRange(timeRange as Range<number>);
    audioChart?.timeScale().setVisibleLogicalRange(timeRange as Range<number>);

    const fromIndex = Math.floor(timeRange?.from as number);
    const toIndex = Math.floor(timeRange?.to as number);
    if (fromIndex - fromIndexRef.value > 200 || fromIndexRef.value - fromIndex > 200) {
      fromIndexRef.value = fromIndex;
      const from = miniMapChart.value?.getSeries()[0].data()[fromIndex];
      const to = miniMapChart.value?.getSeries()[0].data()[toIndex];

      if (chartsStore.allRendered && from?.time && to?.time) {
        miniMapChart.value?.drawSelectionBox({ from: from.time as Time, to: to.time as Time });
        chartsStore.selection = {
          range: {
            from: from.time as Time,
            to: to.time as Time,
          },
        };
      }
    }
  });

  audioChart?.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
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

whenever(keys.ArrowRight, () => {
  move(Number(chartsStore.selection.range.to) - Number(chartsStore.selection.range.from));
});

whenever(keys.ArrowLeft, () => {
  move(Number(chartsStore.selection.range.from) - Number(chartsStore.selection.range.to));
});

function move(increment: number) {
  if (Number(chartsStore.selection.range.from) + increment < chartsStore.timeAxis[0]) {
    const range = Number(chartsStore.selection.range.to) - Number(chartsStore.selection.range.from);
    chartsStore.selection.range.from = chartsStore.timeAxis[0] as Time;
    chartsStore.selection.range.to = (chartsStore.timeAxis[0] + range) as Time;
  } else if (Number(chartsStore.selection.range.to) + increment > chartsStore.timeAxis[chartsStore.timeAxis.length - 1]) {
    const range = Number(chartsStore.selection.range.to) - Number(chartsStore.selection.range.from);
    chartsStore.selection.range.to = chartsStore.timeAxis[chartsStore.timeAxis.length - 1] as Time;
    chartsStore.selection.range.from = (chartsStore.timeAxis[chartsStore.timeAxis.length - 1] - range) as Time;
  } else {
    chartsStore.selection.range.from = (Number(chartsStore.selection.range.from) + increment) as Time;
    chartsStore.selection.range.to = (Number(chartsStore.selection.range.to) + increment) as Time;
  }
}

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
  move(increment);
};

function eventChanged(eventRange: any) {
  sessionsStore.selectedSession?.Data.RespiratoryEvents?.forEach((event, index) => {
    if (event.startTime * 1000 > eventRange.from && event.endTime * 1000 < eventRange.to) {
      respiratoryChartRef.value?.changeEvent(event, RESPIRATORY_EVENTS.DISCARDABLE_AWAKE, index);
    }
  });
}
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
