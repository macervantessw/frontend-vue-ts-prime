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
  IPriceLine,
  ISeriesApi,
  LineStyleOptions,
  LogicalRange,
  SeriesOptionsCommon,
  Time,
  TimeChartOptions,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useChartsStore } from "../../store";
import { getData } from "../../utilities/file.utilities";
import { SIGNALS, CHART_OPTIONS, LINE_OPTIONS, VISIBLE_MINUTES } from "../../constants";
import { Serie } from "../../interfaces";
import JSZip from "jszip";

let priceLines: IPriceLine[] = [];
const options: Partial<CreatePriceLineOptions> = { lineStyle: 2, axisLabelVisible: true, lineWidth: 1 };
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
  chart.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
    setHeartRateLines(timeRange);
  });
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

      if (oxymetrySeries) {
        oxymetrySeries.priceScale().applyOptions({
          autoScale: true,
        });

        oxymetrySeries.createPriceLine({ ...options, color: "#0077b6", price: 90 });
        oxymetrySeries.createPriceLine({ ...options, color: "#0077b6", price: 80 });
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

    //setHeartRateLines(chart.timeScale().getVisibleLogicalRange());
  },
  { deep: true },
);

const setHeartRateLines = (timeRange: LogicalRange | null) => {
  if (!timeRange) return;

  const heartRateSeries = series.find((s) => s.id === SIGNALS.HR)?.serie;
  if (heartRateSeries) {
    const portion = heartRateSeries
      ?.data()
      .slice(timeRange.from, timeRange.to + 1)
      .map((item: any) => item.value);
    // const maxValue = Math.max(...portion);
    // const minValue = Math.min(...portion);
    if (priceLines[0]) heartRateSeries.removePriceLine(priceLines[0]);
    if (priceLines[1]) heartRateSeries.removePriceLine(priceLines[1]);
    priceLines = [];
    const max = Math.max(...portion);
    const min = Math.min(...portion);

    priceLines.push(heartRateSeries.createPriceLine({ ...options, color: "rgb(190, 34, 34)", price: max }));
    priceLines.push(heartRateSeries.createPriceLine({ ...options, color: "rgb(190, 34, 34)", price: min }));
    heartRateSeries.setMarkers([
      {
        time: 0 as Time,
        position: "inBar",
        shape: "circle",
        color: "hsla(0, 79.70%, 44.50%, 0.01)",
        size: 1,
      },
    ]);
  }
};
</script>

<style scoped>
.lw-chart {
  height: 100%;
}
</style>
