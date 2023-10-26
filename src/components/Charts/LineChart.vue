<!-- <template>
  <div class="card flex flex-column bg-gray-50 border-1 border-round border-200 p-2" :style="{ height: '280px' }">
    <div v-if="loading" class="p-4 w-full" :style="{ height: height }">
      <Skeleton width="100%" height="100%"></Skeleton>
    </div>
    <apexchart v-else ref="chart" type="line" :height="height" :options="chartOptions" :series="showData" />
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch, onBeforeMount } from "vue";
import { useChartsStore } from "../../store";
import Skeleton from "primevue/skeleton";
import { Data, Series } from "../../interfaces";
import { MAX_SAMPLES } from "../../constants";
import apexchart from "vue3-apexcharts";
import ApexCharts from "apexcharts";
import { ApexOptions } from "apexcharts";
import { debounce } from "lodash";
import dayjs from "dayjs";

const loading = ref(false);
const chartsStore = useChartsStore();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = ref(null as ApexCharts | null);
const showData = ref([] as Series[]);
const props = defineProps(["data", "id", "height", "name"]);
onBeforeMount(() => {
  loading.value = false;
});
watch(
  () => props.data,
  () => {
    updateShownData();
  },
  { deep: true },
);

watch(
  () => chartsStore.xaxis,
  (newVal) => {
    const now = dayjs();
    // const options = chartOptions.value;
    // if (!options.xaxis) options.xaxis = {};
    // options.xaxis.min = newVal.min;
    // options.xaxis.max = newVal.max;
    //chart.value?.updateOptions(options);
    chart.value?.zoomX(newVal.min, newVal.max);
    const timeSpent = dayjs().diff(now, "millisecond");
    console.log("updateOptions", timeSpent, "ms");
    //updateShownData();
  },
);

const updateShownData = debounce(() => {
  if (!props.data || !props.data.length) return;
  const { min, max } = chartsStore.xaxis;
  if (!min || !max) return;
  loading.value = false;
  const diff = max - min;
  let zoomedData: Series[] = props.data.map((serie: Series) => {
    return {
      name: serie.name,
      data: serie.data.filter((element) => {
        return element.x >= min - diff && element.x <= max + diff;
      }),
    };
  });
  if (!chart.value) return;

  loading.value = false;
  showData.value = zoomedData;
}, 100);

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
      min: chartsStore.xaxis.min,
      max: chartsStore.xaxis.max,
    },
    yaxis: {
      show: false,
    },
  };
  //moure axis.min i max quan es mou fent servir fletxes o scroll, despres recalcular showData
  if (props.id === "oxymetry_chart") {
    options.yaxis = props.data.map((serie: Series, index: number) => {
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
    const movement = props.data.find((serie: Series) => serie.name === "Movement");
    if (movement) {
      const average = movement.data.reduce((a: number, b: Data) => a + b.y, 0) / movement.data.length;
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
</style> -->
