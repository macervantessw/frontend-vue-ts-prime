<template>
  <div ref="chartContainer" class="lw-chart relative"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import { BaselineData, BaselineStyleOptions, DeepPartial, IChartApi, ISeriesApi, SeriesOptionsCommon, Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData } from "../../utilities/file.utilities";
import { CHART_OPTIONS, SIGNALS, LINE_OPTIONS, VISIBLE_MINUTES } from "../../constants";
import JSZip from "jszip";
import { Event, Serie } from "../../interfaces";
import { showSnoringEvents } from "../../utilities/chart.utilities";

const chartsStore = useChartsStore();
const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
  snoringEvents: {
    type: Object as PropType<Event[] | undefined>,
    required: true,
  },
});
let series: Serie<"Baseline">[] = [];
let chart: IChartApi | null = null;

const chartContainer = ref();

const getChart = () => {
  return chart;
};

const getSeries = () => {
  return series;
};

defineExpose({ getChart, getSeries });

onMounted(() => {
  chart = createChart(chartContainer.value, CHART_OPTIONS);
});

onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  if (series) {
    series = [];
  }
});

watch(
  () => chartsStore.timeAxis,
  async () => {
    const promises: Promise<void>[] = [];
    promises.push(
      generateLineSeries(SIGNALS.AUDIO, "Audio", {
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: -2000,
            maxValue: 2000,
          },
        }),
        lineWidth: 1,
        baseValue: { type: "price", price: 0 },
        topLineColor: "rgba(21, 124, 183,1)",
        topFillColor1: "rgba(21, 124, 183,1)",
        topFillColor2: "rgba(21, 124, 183,1)",
        bottomLineColor: "rgba(21, 124, 183,1)",
        bottomFillColor1: "rgba(21, 124, 183,1)",
        bottomFillColor2: "rgba(21, 124, 183,1)",
      }),
    );
    promises.push(
      generateLineSeries(
        SIGNALS.AUDIO,
        "Audio",
        {
          autoscaleInfoProvider: () => ({
            priceRange: {
              minValue: -2000,
              maxValue: 2000,
            },
          }),
          lineWidth: 1,
          baseValue: { type: "price", price: 0 },
          topLineColor: "rgba(21, 124, 183,1)",
          topFillColor1: "rgba(21, 124, 183,1)",
          topFillColor2: "rgba(21, 124, 183,1)",
          bottomLineColor: "rgba(21, 124, 183,1)",
          bottomFillColor1: "rgba(21, 124, 183,1)",
          bottomFillColor2: "rgba(21, 124, 183,1)",
        },
        true,
      ),
    );

    Promise.all(promises).then(() => {
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + VISIBLE_MINUTES * 60 * 1000) as UTCTimestamp,
      });

      const audioSeries = series.find((s) => s.id === SIGNALS.AUDIO)?.serie;

      const autoScaleInfoProvider = {
        priceRange: {
          minValue: -2000,
          maxValue: 2000,
        },
      };

      if (audioSeries) {
        audioSeries.applyOptions({
          autoscaleInfoProvider: () => autoScaleInfoProvider,
        });
        audioSeries.priceScale().applyOptions({
          autoScale: true,
          scaleMargins: {
            top: 0,
            bottom: 0.1,
          },
          invertScale: true,
        });
      }
    });
  },
);
function generateLineSeries(signal: string, name: string, options: DeepPartial<BaselineStyleOptions & SeriesOptionsCommon>, invertValues = false): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal, invertValues).then((data) => {
      const serie = chart?.addBaselineSeries({ ...LINE_OPTIONS, ...options });
      serie?.setData(data as any);
      series?.push({ name: name, serie: serie as ISeriesApi<"Baseline">, id: signal });
      showSnoringEvents(chart, serie, data as BaselineData<Time>[], props.snoringEvents);
      resolve();
    });
  });
}
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
