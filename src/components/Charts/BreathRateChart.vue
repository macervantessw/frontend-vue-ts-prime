<template>
  <apexchart type="line" height="150px" :options="chartOptions" :series="series" />
</template>
<script lang="ts" setup>
import { ref, PropType, computed } from "vue";
import { ASAP, DataPoint } from "downsample";

const props = defineProps({
  data: {
    type: Array as PropType<number[][]>,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

const chartOptions = ref({
  chart: {
    id: props.id,
  },
  xaxis: {
    type: "datetime",
  },
  yaxis: {
    labels: {
      formatter: (value: number) => {
        return value.toFixed(0);
      },
    },
  },
});
const series = computed(() => [
  {
    name: "Breath Rate",
    data: ASAP(props.data as DataPoint[], 3000) as [number, number][],
  },
]);
</script>
<style></style>
