<template>
  <div class="card flex flex-column bg-gray-50 border-1 border-round border-200 p-2" :style="{ height: '280px' }">
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
import ApexCharts from "apexcharts";
import { ApexOptions } from "apexcharts";

const loading = ref(false);
const chartsStore = useChartsStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = ref(null as ApexCharts | null);
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
    required: true,
  },
});

onBeforeMount(() => {
  loading.value = false;
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
  loading.value = false;
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
    title: {
      text: props.name,
      align: "center",
      offsetY: 10,
    },
    tooltip: {
      enabled: true,
      x: {
        show: false,
        format: "HH:mm:ss",
      },
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 1.3,
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
      crosshairs: {
        show: true,
      },
    },
    yaxis: {
      show: false,
    },
  };

  if (props.id === "oxymetry_chart") {
    options.yaxis = props.data.map((serie, index) => {
      if (serie.name === "Heart rate") {
        return {
          seriesName: serie.name,
          title: { text: "HR (bpm)", rotate: 0, offsetX: -40, offsetY: -95, style: { color: "#d41919" } },
          min: 55,
          max: 160,
          show: true,
          opposite: true,
          floating: true,
          labels: {
            formatter: (value: number) => {
              return value.toFixed(0);
            },
            style: {
              colors: "#d41919",
            },
            offsetX: 30,
          },
        };
      } else {
        return {
          seriesName: props.data[0].name,
          title: { text: "SpO2", rotate: 0, offsetX: 25, offsetY: -95 },
          show: index === 0,
          min: 60,
          max: 100,
          tickAmount: 4,
          floating: true,
          labels: {
            formatter: (value: number) => {
              return value + "%";
            },
            offsetX: 30,
          },
        };
      }
    });
    options.colors = ["#189f5c", "rgb(30, 108, 211)", "#d41919"];
  } else if (props.id === "respiratory_chart") {
    const movement = props.data.find((serie) => serie.name === "Movement");
    if (movement) {
      const average = movement.data.reduce((a, b) => a + b.y, 0) / movement.data.length;
      options.yaxis = { ...options.yaxis, max: average * 4 };
    }
    options.tooltip = {
      ...options.tooltip,
      enabled: true,
      shared: true,
      custom: function ({ series, _seriesIndex, dataPointIndex, _w }) {
        //100 - (airflow / basalAirflow) * 100;
        const atenuation = 100 - (series[1][dataPointIndex] / series[0][dataPointIndex]) * 100;
        return '<div class="arrow_box">' + "<span>Attenuation: " + atenuation.toFixed(2) + "%</span>" + "</div>";
      },
    };
  }
  return options;
});
</script>
<style>
.arrow_box {
  padding: 5px;
}
</style>
