<template>
  <apexchart type="line" height="150px" :options="chartOptions" :series="series" @selection="selection" />
</template>
<script lang="ts" setup>
import { PropType, computed } from "vue";
import { useChartsStore } from "../../store";
import dayjs from "dayjs";
import debounce from "lodash/debounce";

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

const series = computed(() => [
  {
    name: "",
    data: props.data,
  },
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selection(chartContext: any, { xaxis }: { xaxis: { min: number; max: number } }) {
  updateXaxisDebounced(xaxis);
}

const updateXaxisDebounced = debounce((xaxis) => {
  chartsStore.xaxis = xaxis;
}, 200);

const chartOptions = computed(() => {
  return {
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
          min: props.data[0]?.x,
          max: dayjs(props.data[0]?.x)
            .add(10, "minute")
            .valueOf(),
        },
      },
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 1,
    },
    colors: ["#008FFB"],
    xaxis: {
      type: "datetime",
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
});
</script>
<style></style>
