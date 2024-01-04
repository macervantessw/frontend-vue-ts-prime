<script lang="ts" setup>
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import { Icon } from "@iconify/vue";
import SummaryCard from "./SummaryCard.vue";
import i18n from "../../i18n";

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);
</script>

<template>
  <SummaryCard :title="t('Patient info')">
    <div class="wrapper" style="background-color: #d2e1f9">
      <div class="flex align-items-center">
        <Icon :icon="'material-symbols:person'" class="mr-2" /><span>{{ $t("Name") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientName || selectedSession?.Name }}</span>
    </div>
    <div class="wrapper" style="background-color: #d2f2f9">
      <div class="flex align-items-center">
        <Icon :icon="'ic:baseline-cake'" class="mr-2" />
        <span>{{ $t("Age") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PAtientAge || selectedSession?.Age }} </span>
    </div>
    <div class="wrapper" style="background-color: #d2f9e8">
      <div class="flex align-items-center">
        <Icon :icon="'icon-park-solid:weight'" class="mr-2" />
        <span>{{ $t("Weight") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientWeigth || selectedSession?.Weight }}Kg </span>
    </div>
    <div class="wrapper" style="background-color: #f6f9d2">
      <div class="flex align-items-center">
        <Icon :icon="'fluent:ruler-32-filled'" class="mr-2" /><span>{{ $t("Height") }} </span>
      </div>
      <span class="chip">{{ selectedSession?.PatientHeight || selectedSession?.Height }}cm </span>
    </div>
    <div class="wrapper" style="background-color: #fbc4ab">
      <div class="flex align-items-center"><Icon :icon="'lucide:scale'" class="mr-2" /><span>BMI </span></div>
      <span class="chip">{{ selectedSession?.PatientBMI ? selectedSession.PatientBMI.toFixed(2) : "" }} </span>
    </div>
  </SummaryCard>
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
