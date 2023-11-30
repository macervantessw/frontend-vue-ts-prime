<script lang="ts" setup>
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import { Icon } from "@iconify/vue";

const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
</script>

<template>
  <div>
    <h2 class="mt-0 font-bold text-3xl text-900">{{ $t("Patient") }}</h2>
    <div class="wrapper" style="background-color: #d2e1f9">
      <div class="flex align-items-center">
        <Icon :icon="'material-symbols:person'" class="mr-2" /><span>{{ $t("Name") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientName }}</span>
    </div>
    <div class="wrapper" style="background-color: #d2f2f9">
      <div class="flex align-items-center">
        <Icon :icon="'ic:baseline-cake'" class="mr-2" />
        <span>{{ $t("Age") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PAtientAge }} </span>
    </div>
    <div class="wrapper" style="background-color: #d2f9e8">
      <div class="flex align-items-center">
        <Icon :icon="'icon-park-solid:weight'" class="mr-2" />
        <span>{{ $t("Weight") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientWeigth }}Kg </span>
    </div>
    <div class="wrapper" style="background-color: #f6f9d2">
      <div class="flex align-items-center">
        <Icon :icon="'fluent:ruler-32-filled'" class="mr-2" /><span>{{ $t("Height") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientHeight }}cm </span>
    </div>
    <div class="wrapper" style="background-color: #fbc4ab">
      <div class="flex align-items-center"><Icon :icon="'lucide:scale'" class="mr-2" /><span>BMI </span></div>
      <span class="chip">{{ selectedSession?.PatientBMI.toFixed(2) }} </span>
    </div>
  </div>
</template>
<style>
.wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-weight: 900;
  align-items: center;
  padding: 0.6rem;
  margin-bottom: 5px;
  border-radius: 12px;
}
.chip {
  padding: 4px 8px;
  background: #ffffff9e;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
}
</style>
