<script lang="ts" setup>
import ProgressBar from "primevue/progressbar";
defineProps({
  iah: {
    type: Number,
    required: true,
  },
});
</script>
<template>
  <div class="h-full flex align-items-center" style="min-height: 40px">
    <div class="flex align-items-center justify-content-center relative w-full">
      <div class="flex text-sm w-full mt-3 pl-1 absolute z-5 text-white">
        <div class="flex justify-content-center" style="width: 8%">0-5</div>
        <div class="flex justify-content-center border-left-1" style="width: 16%">5-15</div>
        <div class="flex justify-content-center border-left-1" style="width: 25%">15-30</div>
        <div class="flex justify-content-center border-left-1" style="width: 51%">30-60</div>
      </div>
      <ProgressBar
        :value="100"
        :show-value="false"
        class="progress-bottom absolute w-full h-2rem mt-4"
        :pt="{
          value: {
            style: {
              background:
                'linear-gradient(90deg, rgba(104,176,167,1) 0%, rgba(174,171,128,1) 10%, rgba(243,166,88,1) 25%, rgba(197,89,50,1) 50%, rgba(151,12,12,1) 70%, rgb(55, 7, 7) 100%)',
            },
          },
        }"
      />
      <ProgressBar :value="iah / 0.6" :show-value="false" class="progress-top absolute w-full h-2rem mt-4" />
    </div>
  </div>
</template>
<style></style>
