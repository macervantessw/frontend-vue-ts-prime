<script lang="ts" setup>
import { storeToRefs } from "pinia";
import DataComponent from "../DataComponent.vue";
import { useSessionsStore } from "../../store";
import SummaryCard from "./SummaryCard.vue";
import i18n from "../../i18n";

const { t } = i18n.global;
const { selectedSession } = storeToRefs(useSessionsStore());
</script>
<template>
  <SummaryCard :title="t('ODI')">
    <DataComponent title="CT80" :value="selectedSession?.SessionOxCT80 || 0" icon-text="80" />
    <DataComponent title="CT90" :value="selectedSession?.SessionOxCT90 || 0" icon-text="90" />
  </SummaryCard>
</template>
<style></style>
