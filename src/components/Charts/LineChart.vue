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
watch(
  () => chartsStore.xaxis,
  (newVal) => {
    if (!chart.value) return;
    chart.value.zoomX(newVal.min, newVal.max);
  },
  { deep: true },
);

function updateShownData() {
  const { min, max } = chartsStore.xaxis;
  if (!min || !max) return;
  loading.value = true;
  const zoomedData: Series[] = props.data.map((serie) => {
    return {
      name: serie.name,
      data: serie.data.filter((element) => {
        return element.x >= min && element.x <= max;
      }),
    };
  });

  showData.value = zoomedData;
}

// const series = computed(() => [
//   {
//     name: props.name,
//     data: showData.value,
//   },
// ]);
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
    },
    yaxis: props.data.map((value, index) => {
      if (index === 0) {
        return {
          tickAmount: 1,
          labels: {
            formatter: (value: number) => {
              return value.toFixed(0);
            },
          },
          min: 10000,
        };
      } else if (index === 2 && value.name === "Movement") {
        return {
          opposite: true,
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
          },
          title: {
            text: "Movement",
          },
          min: 2000,
          labels: {
            formatter: (value: number) => {
              return value.toFixed(0);
            },
          },
        };
      } else {
        return {
          show: false,
        };
      }
    }),
  };
});
</script>
<style></style>
