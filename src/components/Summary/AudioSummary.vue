<script lang="ts" setup>
import { storeToRefs } from "pinia";
import DataComponent from "../DataComponent.vue";
import { useSessionsStore } from "../../store";
import { computed } from "vue";
import SummaryCard from "./SummaryCard.vue";
//import i18n from "../../i18n";
//const { t } = i18n.global;
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { selectedSession } = storeToRefs(useSessionsStore());
const snoresPerHour = computed(() => {
  if (selectedSession.value?.SessionNumSnorings === undefined || selectedSession.value?.SessionDuration === undefined) return undefined;
  return (selectedSession.value?.SessionNumSnorings / (selectedSession.value?.SessionDuration || 0)) * 3600;
});
</script>
<template>
  <SummaryCard :title="t('snoring-analysis')">
    <DataComponent :title="t('Total snores')" :value="selectedSession?.SessionNumSnorings || 0" icon="mdi:bullhorn-outline" />
    <DataComponent :title="t('Snores per hour')" :value="snoresPerHour?.toFixed(2) || undefined" icon="game-icons:sound-waves" />
  </SummaryCard>
</template>
<style></style>
