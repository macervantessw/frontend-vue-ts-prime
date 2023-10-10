<template>
  <div class="w-full h-full">
    <apexchart width="100%" class="w-8" type="line" :options="chartOptions" :series="series" @zoomed="zoomed" />
  </div>
</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, defineProps, onBeforeMount, ref } from "vue";
import { readDatFile, uncompressFile } from "../utilities/file.utilities";
import { SIGNALS } from "../constants";
import { ASAP, DataPoint } from "downsample";
const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
let zippedFiles = null;
const timeAxisData = ref([] as number[]);
const data = ref([] as number[][]);
const chartOptions = ref({
  chart: {
    id: "vuechart-example",
  },
  xaxis: {
    type: "datetime",
    //categories: timeAxisData.value,
  },
});
const series = ref([
  {
    name: "Movement",
    data: [] as [number, number][],
  },
]);

onBeforeMount(() => {
  downloadFileAndUncompress().then((files) => {
    zippedFiles = files;
    if (!zippedFiles) return;

    const promises = [] as Promise<Uint8Array>[];
    promises.push(zippedFiles[SIGNALS.BASETIME].async("uint8array"));
    promises.push(zippedFiles[SIGNALS.BREATH_RATE].async("uint8array"));

    Promise.all(promises).then((values) => {
      timeAxisData.value = readDatFile(values[0]);
      //chartOptions.value.xaxis.categories = timeAxisData.value.slice(0, 1000);
      const breathRateData = readDatFile(values[1]);
      data.value = breathRateData.map((element, index) => {
        return [timeAxisData.value[index], element];
      });
      series.value[0].data = ASAP(data.value as DataPoint[], 1000) as [number, number][];
    });
    // .then((unzippedFile) => {
    //   timeAxisData.value = readDatFile(unzippedFile);
    //   chartOptions.value.xaxis.categories = timeAxisData.value.slice(0, 1000);
    // });
    // zippedFiles[BREATH_RATE].async("uint8array").then((unzippedFile) => {
    //   breathRateData.value = readDatFile(unzippedFile);
    //   series.value[0].data = breathRateData.value.slice(0, 1000);
    // });

    // const arr1 = [1, 2, 3];
    // const arr2 = [4, 5, 6];

    // const combinedArray = arr1.map((element, index) => {
    //   return [element, arr2[index]];
    // });

    // console.log(combinedArray); // Output: [[1, 4], [2, 5], [3, 6]]
  });
});

function zoomed(event: any) {
  console.log(event);
}

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  return zippedFiles;
}
</script>
<style></style>
