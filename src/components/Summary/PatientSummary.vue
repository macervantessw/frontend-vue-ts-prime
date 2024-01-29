<script lang="ts" setup>
import { useSessionsStore } from "../../store";
import { storeToRefs } from "pinia";
import SummaryCard from "./SummaryCard.vue";
import i18n from "../../i18n";
import DataComponent from "../DataComponent.vue";
import { computed } from "vue";

const { t } = i18n.global;
const sessionsStore = useSessionsStore();
const { selectedSession } = storeToRefs(sessionsStore);

const getFullName = () => {
  return selectedSession.value?.PatientName || selectedSession.value?.Name + " " + selectedSession.value?.Surname || selectedSession.value?.PatientSurname;
};

const computedBMI = computed(() => {
  if (!selectedSession.value?.Weight || !selectedSession.value?.Height) return;
  return selectedSession.value?.Weight / Math.pow(selectedSession.value?.Height / 100, 2);
});
</script>

<template>
  <SummaryCard :title="t('Patient info')">
    <DataComponent class="col-12 p-0" :title="$t('Name')" :value="getFullName()" icon="material-symbols:person" color="#d2e1f9" />
    <DataComponent class="col-12 p-0" :title="$t('Age')" :value="selectedSession?.PAtientAge || selectedSession?.Age" icon="ic:baseline-cake" color="#d2f2f9" />
    <DataComponent class="col-12 p-0" :title="$t('Weight')" :value="selectedSession?.Weight" icon="icon-park-solid:weight" color="#d2f9e8" />
    <DataComponent class="col-12 p-0" :title="$t('Height')" :value="selectedSession?.Height" icon="fluent:ruler-32-filled" color="#f6f9d2" />
    <DataComponent
      class="col-12 p-0"
      :title="$t('BMI')"
      :value="selectedSession?.PatientBMI ? selectedSession.PatientBMI.toFixed(2) : computedBMI"
      icon="lucide:scale"
      color="#fbc4ab"
      :num-decimals="2"
    />
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
