<template>
  <div class="flex flex-column" :style="{ height: height }">
    <div v-if="loading" class="p-4 w-full" :style="{ height: height }">
      <Skeleton width="100%" height="100%"></Skeleton>
    </div>
    <apexchart v-else ref="chart" type="line" :height="height" :options="chartOptions" :series="showData" />
  </div>
</template>
<script lang="ts" setup>
import { ref, PropType, computed, watch, onBeforeMount } from "vue";
import { useChartsStore } from "../../store";
import Skeleton from "primevue/skeleton";
import { Series } from "../../interfaces";
import { MAX_SAMPLES } from "../../constants";
import apexchart from "vue3-apexcharts";
import { ApexOptions } from "apexcharts";

const loading = ref(false);
const chartsStore = useChartsStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = ref(null as any);
const showData = ref([] as Series[]);
const props = defineProps({
  data: {
    type: Array as PropType<Series[]>,
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

onBeforeMount(() => {
  loading.value = true;
});
watch(
  () => props.data,
  (newVal) => {
    if (!newVal || !newVal.length) return;
    updateShownData();
    loading.value = false;
  },
  { deep: true },
);

watch(
  () => chartsStore.xaxis,
  (newVal) => {
    if (!props.data || !props.data.length) return;
    updateShownData();
    if (!chart.value) return;
    chart.value.zoomX(newVal.min, newVal.max);
    loading.value = false;
  },
  { deep: true },
);

function updateShownData() {
  const { min, max } = chartsStore.xaxis;
  if (!min || !max) return;
  loading.value = true;
  let zoomedData: Series[] = props.data.map((serie) => {
    return {
      name: serie.name,
      data: serie.data.filter((element) => {
        return element.x >= min && element.x <= max;
      }),
    };
  });

  const reduction = zoomedData[0].data.length / MAX_SAMPLES;
  if (reduction > 1) {
    zoomedData = zoomedData.map((serie) => {
      return {
        name: serie.name,
        data: serie.data.filter((_element, index) => {
          return index % Math.ceil(reduction) === 0;
        }),
      };
    });
  }

  showData.value = zoomedData;
}

// const series = computed(() => [
//   {
//     name: props.name,
//     data: showData.value,
//   },
// ]);
const chartOptions = computed(() => {
  const options: ApexOptions = {
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

    tooltip: {
      enabled: true,
      shared: true,
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 1,
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
    },
    yaxis: {
      show: false,
    },
  };
  const movement = props.data.find((serie) => serie.name === "Movement");

  if (movement) {
    const average = movement.data.reduce((a, b) => a + b.y, 0) / movement.data.length;
    options.yaxis = { ...options.yaxis, max: average * 3 };
  }
  return options;
});
</script>
<style></style>
