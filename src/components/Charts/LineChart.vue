<template>
  <!-- <div v-if="loading" style="height: 150px"></div> -->
  <!-- <apexchart v-else ref="chart" type="line" :height="height" :options="chartOptions" :series="series" /> -->
  <apexchart ref="chart" type="line" :height="height" :options="chartOptions" :series="series" />
</template>
<script lang="ts" setup>
import { ref, PropType, computed, watch } from "vue";
import { useChartsStore } from "../../store";
import { ASAP, DataPoint } from "downsample";

// const loading = ref(true);
const chartsStore = useChartsStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = ref(null as any);
// const showData = ref([] as { x: number; y: number }[]);
const props = defineProps({
  data: {
    type: Array as PropType<number[][]>,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  height: {
    type: String,
    default: "150px",
  },
  name: {
    type: String,
    default: "",
  },
});

// watch(
//   () => props.data,
//   (newVal) => {
//     if (!newVal || !newVal.length) return;
//     const { min, max } = chartsStore.xaxis;
//     const zoomedData = props.data.filter((element) => {
//       return element[0] >= min && element[0] <= max;
//     });
//     showData.value = ASAP(zoomedData as DataPoint[], 1000) as { x: number; y: number }[];
//     loading.value = false;
//   },
//   { deep: true },
// );
const showData = computed(() => {
  if (!props.data || !props.data.length) return [];
  if (Object.keys(chartsStore.xaxis).length === 0) return [];
  const { min, max } = chartsStore.xaxis;
  const zoomedData = props.data.filter((element) => {
    return element[0] >= min && element[0] <= max;
  });
  return ASAP(zoomedData as DataPoint[], 1000) as { x: number; y: number }[];
});
watch(
  () => chartsStore.xaxis,
  (newVal) => {
    if (!chart.value) return;
    chart.value.zoomX(newVal.min, newVal.max);
  },
  { deep: true },
);

const series = computed(() => [
  {
    name: props.name,
    data: showData.value,
  },
]);
const chartOptions = computed(() => {
  return {
    chart: {
      id: props.id,
      type: "line",
      toolbar: {
        autoSelected: "pan",
        show: false,
      },
      animations: {
        enabled: false,
      },
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 1,
    },
    xaxis: {
      type: "datetime",
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
