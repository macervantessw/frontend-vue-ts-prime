<template>
  <apexchart class="w-17rem h-15rem" type="line" :options="chartOptions" :series="series" />
</template>
<script lang="ts" setup>
const chartOptions = {
  chart: {
    id: "vuechart-example",
  },
  xaxis: {
    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998],
  },
};
const series = [
  {
    name: "series-1",
    data: [30, 40, 35, 50, 49, 60, 70, 91],
  },
];
</script>
<style></style>
