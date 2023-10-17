<template>
  <apexchart ref="chart" type="line" height="150px" :options="chartOptions" :series="series" @selection="selection" />
</template>
<script lang="ts" setup>
import { PropType, computed, ref, watch } from "vue";
import { useChartsStore, useMessagesStore } from "../../store";
import dayjs from "dayjs";
// import debounce from "lodash/debounce";
import { useMagicKeys, whenever } from "@vueuse/core";
import apexchart from "vue3-apexcharts";

const { current } = useMagicKeys();
const keys = useMagicKeys();
const messagesStore = useMessagesStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = ref(null as any);

let oldMax = 0;
let oldMin = 0;
const chartsStore = useChartsStore();
const props = defineProps({
  data: {
    type: Array as PropType<{ x: number; y: number }[]>,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
});

const selectionMin = ref(0);
const selectionMax = ref(0);
watch(
  () => props.data,
  (newVal) => {
    if (!newVal || !newVal.length) return;
    selectionMin.value = newVal[0]?.x;
    selectionMax.value = dayjs(newVal[0]?.x)
      .add(10, "minute")
      .valueOf();
    chartOptions.chart.selection.xaxis.min = selectionMin.value;
    chartOptions.chart.selection.xaxis.max = selectionMax.value;
    chart.value?.updateOptions(chartOptions);
  },
  { deep: true },
);
const series = computed(() => [
  {
    name: "",
    data: props.data,
  },
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selection(chartContext: any, { xaxis }: { xaxis: { min: number; max: number } }) {
  xaxis.min = Math.floor(xaxis.min);
  xaxis.max = Math.floor(xaxis.max);
  const diff = Math.trunc(xaxis.max - xaxis.min);
  if (diff > 10 * 60 * 1000) {
    if (oldMin !== xaxis.min && oldMax !== xaxis.max) {
      xaxis.max = xaxis.min + 10 * 60 * 1000;
    } else if (oldMax !== xaxis.max) {
      xaxis.max = xaxis.min + 10 * 60 * 1000;
    } else {
      xaxis.min = xaxis.max - 10 * 60 * 1000;
    }

    chartOptions.chart.selection.xaxis.min = xaxis.min;
    chartOptions.chart.selection.xaxis.max = xaxis.max;
    chart.value?.updateOptions(chartOptions);
    messagesStore.setErrorMessage("Maximum selection is 10 minutes");
  }
  chartsStore.xaxis = xaxis;
  oldMax = xaxis.max;
  oldMin = xaxis.min;
  // updateXaxisDebounced(xaxis);
}

whenever(keys.Shift_Ctrl_ArrowRight, () => {
  const diff = chartsStore.xaxis.max - chartsStore.xaxis.min;
  chartsStore.xaxis = {
    min: chartsStore.xaxis.min + diff,
    max: chartsStore.xaxis.max + diff,
  };
});
whenever(keys.Shift_Ctrl_ArrowLeft, () => {
  const diff = chartsStore.xaxis.max - chartsStore.xaxis.min;
  chartsStore.xaxis = {
    min: chartsStore.xaxis.min - diff,
    max: chartsStore.xaxis.max - diff,
  };
});
whenever(keys.ArrowRight, () => {
  if (current.has("shift") || current.has("control")) return;
  chartsStore.xaxis = {
    min: chartsStore.xaxis.min + 10000,
    max: chartsStore.xaxis.max + 10000,
  };
});
whenever(keys.ArrowLeft, () => {
  if (current.has("shift") || current.has("control")) return;
  chartsStore.xaxis = {
    min: chartsStore.xaxis.min - 10000,
    max: chartsStore.xaxis.max - 10000,
  };
});

// const updateXaxisDebounced = debounce((xaxis) => {
//   chartsStore.xaxis = xaxis;
// }, 0);

const chartOptions = {
  chart: {
    id: "chart1",
    height: 130,
    type: "line",
    animations: {
      enabled: false,
    },
    brush: {
      enabled: true,
    },
    selection: {
      enabled: true,
      xaxis: {
        min: selectionMin.value,
        max: selectionMax.value,
      },
    },
  },
  markers: {
    size: 0,
  },
  stroke: {
    width: 1.5,
  },
  colors: ["#008FFB"],
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    tickAmount: 1,
    labels: {
      formatter: (value: number) => {
        return value.toFixed(0);
      },
    },
  },
};
</script>
<style></style>
