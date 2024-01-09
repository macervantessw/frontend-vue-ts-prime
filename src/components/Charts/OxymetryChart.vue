<template>
  <div :class="{ 'max-h-0 min-h-0': isEmptySeries }">
    <ChartTooltip :show="showTooltip" :style="{ left: leftPosition }">
      <div style="color: rgba(239, 83, 80, 1)">Attenuation</div>
      <div style="font-size: 24px; margin: 4px 0px" :style="{ color: attenuation < -3 ? 'red' : 'black' }">{{ attenuation.toFixed(2) }}%</div>
      <div style="backdrop-filter: blur(2px)">
        <div class="tooltip-detail text-lg font-bold text-orange-600">Basal:{{ basalValue }}%</div>
        <div class="tooltip-detail text-lg font-bold text-blue-600">SPO2:{{ oxymetryValue }}%</div>
        <div class="tooltip-detail text-lg font-bold text-pink-600">HR:{{ hrValue }} bpm</div>
      </div>
      <!-- <div style="color: black">{{ dayjs(dateStr).format("HH:mm:ss:SSS") }}</div> -->
    </ChartTooltip>
    <div ref="chartContainer" class="lw-chart absolute w-full" :class="{ 'opacity-0': !chartsStore.allRendered }"></div>
    <Skeleton v-if="!chartsStore.allRendered" class="w-full h-full absolute"></Skeleton>
  </div>
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
  LineData,
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
import { Data, Serie } from "../../interfaces";
import JSZip from "jszip";
import Skeleton from "primevue/skeleton";
import { calculateOxymetryEvents, showOxymetryEvents } from "../../utilities/chart.utilities";
import ChartTooltip from "./ChartTooltip.vue";
// import dayjs from "dayjs";

let priceLines: IPriceLine[] = [];
const isEmptySeries = ref(false);
const options: Partial<CreatePriceLineOptions> = { lineStyle: 2, axisLabelVisible: true, lineWidth: 1 };
const chartsStore = useChartsStore();
const showTooltip = ref(false);
const leftPosition = ref("0px");
const dateStr = ref();
const attenuation = ref(0);
const basalValue = ref<number | undefined>(0);
const oxymetryValue = ref<number | undefined>(0);
const hrValue = ref<number | undefined>(0);

const toolTipWidth = 80;
const toolTipMargin = 15;

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
const getSerieData = (id: string) => {
  return series.find((s) => s.id === id)?.serie.data() as readonly Data[];
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

  chart.subscribeCrosshairMove((param) => {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > chartContainer.value.clientWidth ||
      param.point.y < 0 ||
      param.point.y > chartContainer.value.clientHeight
    ) {
      showTooltip.value = false;
    } else {
      dateStr.value = param.time;
      showTooltip.value = true;
      const basalSerie = series.find((serie) => serie.id === SIGNALS.BASAL_OXIMETRY);
      const oxymetrySerie = series.find((serie) => serie.id === SIGNALS.OXIMETRY);
      const hrSerie = series.find((serie) => serie.id === SIGNALS.HR);

      const seriesData = param.seriesData as Map<ISeriesApi<"Line">, LineData<Time>>;
      if (seriesData) {
        basalValue.value = seriesData.get(basalSerie?.serie as ISeriesApi<"Line">)?.value;
        oxymetryValue.value = seriesData.get(oxymetrySerie?.serie as ISeriesApi<"Line">)?.value;
        hrValue.value = seriesData.get(hrSerie?.serie as ISeriesApi<"Line">)?.value;
        if (!oxymetryValue.value || !basalValue.value) attenuation.value = 0;
        else attenuation.value = ((oxymetryValue.value - basalValue.value) / basalValue.value) * 100;
      }

      let left = param.point.x + toolTipMargin;
      if (left > chartContainer.value.clientWidth - toolTipWidth) {
        left = param.point.x - toolTipMargin - toolTipWidth;
      }

      leftPosition.value = left + "px";
    }
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

    Promise.all(promises)
      .then(() => {
        const oxyEvents = calculateOxymetryEvents(getSerieData(SIGNALS.BASAL_OXIMETRY), getSerieData(SIGNALS.OXIMETRY));
        showOxymetryEvents(
          chart,
          getSeries().find((serie) => serie.id === SIGNALS.BASAL_OXIMETRY)?.serie,
          getSerieData(SIGNALS.BASAL_OXIMETRY) as LineData<Time>[],
          oxyEvents,
        );
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
        console.log("Oxymetry has been rendered");
      })
      .catch(() => {
        isEmptySeries.value = true;
      })
      .finally(() => {
        chartsStore.oxymetryChartRendered = true;
      });
  },
);

function generateLineSeries(signal: string, name: string, options: DeepPartial<LineStyleOptions & SeriesOptionsCommon>): Promise<void> {
  return new Promise((resolve, reject) => {
    getData(props.files, chartsStore.timeAxis, signal).then((data) => {
      if (data.length === 0) reject();
      if (data.every((item: any) => item.value === 0)) isEmptySeries.value = true;
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
.tooltip-detail {
  text-shadow: 1px 1px 14px rgb(81 67 21 / 25%);
}
</style>
