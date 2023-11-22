<template>
  <div ref="chartContainer" class="lw-chart"></div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, defineProps, PropType } from "vue";
import {
  CreatePriceLineOptions,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineStyleOptions,
  SeriesOptionsCommon,
  TimeChartOptions,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData } from "../../utilities/file.utilities";
import { SIGNALS, CHART_OPTIONS, LINE_OPTIONS, VISIBLE_MINUTES } from "../../constants";
import { Serie } from "../../interfaces";
import JSZip from "jszip";

const chartsStore = useChartsStore();
const props = defineProps({
  files: {
    type: Object as PropType<Record<string, JSZip.JSZipObject>>,
    required: true,
  },
});

let series: Serie<"Line">[] = [];
let chart: IChartApi | null = null;
const chartContainer = ref();

const getChart = () => {
  return chart;
};
const getSeries = () => {
  return series;
};

defineExpose({ getSeries, getChart });

onMounted(() => {
  const options: DeepPartial<TimeChartOptions> = {
    leftPriceScale: {
      visible: true,
    },
    rightPriceScale: {
      visible: true,
    },
  };
  chart = createChart(chartContainer.value, { ...CHART_OPTIONS, ...options });
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
  () => {
    const promises: Promise<void>[] = [];
    promises.push(
      generateLineSeries(SIGNALS.OXIMETRY, "Oximetry", {
        priceScaleId: "left",
        color: "#0077b6",
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: 50,
            maxValue: 100,
          },
        }),
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            return price.toFixed(0) + "%";
          },
        },
      }),
    );
    promises.push(
      generateLineSeries(SIGNALS.BASAL_OXIMETRY, "Basal Oxymetry", {
        priceScaleId: "left",
        color: "#ffb703",
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: 50,
            maxValue: 100,
          },
        }),
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            return price.toFixed(0) + "%";
          },
        },
      }),
    );
    promises.push(
      generateLineSeries(SIGNALS.HR, "Heart Rate", {
        priceScaleId: "right",
        color: "rgb(190, 34, 34)",
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: 40,
            maxValue: 100,
          },
        }),
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            return price.toFixed(0) + "bpm";
          },
        },
      }),
    );

    Promise.all(promises).then(() => {
      chart?.timeScale().setVisibleRange({
        from: chartsStore.timeAxis[0] as UTCTimestamp,
        to: (chartsStore.timeAxis[0] + VISIBLE_MINUTES * 60 * 1000) as UTCTimestamp,
      });
      const oxymetrySeries = series.find((s) => s.id === SIGNALS.OXIMETRY)?.serie;
      const heartRateSeries = series.find((s) => s.id === SIGNALS.HR)?.serie;

      const options: Partial<CreatePriceLineOptions> = { lineStyle: 2, axisLabelVisible: true, lineWidth: 1 };

      if (oxymetrySeries) {
        oxymetrySeries.priceScale().applyOptions({
          autoScale: true,
        });

        oxymetrySeries.createPriceLine({ ...options, color: "#0077b6", price: 90 });
        oxymetrySeries.createPriceLine({ ...options, color: "#0077b6", price: 80 });
      }
      if (heartRateSeries) {
        heartRateSeries.createPriceLine({ ...options, color: "rgb(190, 34, 34)", price: 75 });
        heartRateSeries.createPriceLine({ ...options, color: "rgb(190, 34, 34)", price: 60 });
      }
    });
  },
);

function generateLineSeries(signal: string, name: string, options: DeepPartial<LineStyleOptions & SeriesOptionsCommon>): Promise<void> {
  return new Promise((resolve) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      const serie = chart?.addLineSeries({ ...LINE_OPTIONS, ...options });
      serie?.setData(data as any);
      series?.push({ name: name, serie: serie as ISeriesApi<"Line">, id: signal });
      resolve();
    });
  });
}

watch(
  () => chartsStore.selection.range,
  (newVal) => {
    if (!newVal || !chart || !chart.timeScale()) return;
    chart.timeScale().setVisibleRange(newVal);
  },
  { deep: true },
);
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
