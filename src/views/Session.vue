<template>Session</template>
<script lang="ts" setup>
import { StorageReference, getBytes } from "firebase/storage";
import { PropType, defineProps } from "vue";
import { uncompressFile } from "../utilities/file.utilities";

const props = defineProps({
  file: {
    type: Object as PropType<StorageReference>,
    required: true,
  },
});
downloadFileAndUncompress();

async function downloadFileAndUncompress() {
  if (!props.file) return;
  const bytes = await getBytes(props.file);
  const blob = new Blob([bytes], { type: "application/zip" });
  const zippedFiles = await uncompressFile(blob);
  //console.log(zippedFiles);
  zippedFiles["RA_AirFlowSignal.dat"].async("uint8array").then((unzippedFile) => {
    //Take first 4 bytes and convert to int
    let numberOfSamples = unzippedFile.slice(0, 4).reduce((acc, curr, index) => {
      return acc + curr * Math.pow(256, index);
    }, 0);
    console.log(numberOfSamples);
    //Take next 4 bytes and convert to int
    let samplingRate = unzippedFile.slice(4, 8).reduce((acc, curr, index) => {
      return acc + curr * Math.pow(256, index);
    }, 0);
    console.log(samplingRate);

    //iterate over the rest of the file and convert to int
    let data = [];
    for (let i = 8; i < unzippedFile.length; i += 4) {
      let sample = unzippedFile.slice(i, i + 4).reduce((acc, curr, index) => {
        return acc + curr * Math.pow(256, index);
      }, 0);
      data.push(sample);
    }
    console.log(data);
  });
}
</script>
<style></style>
