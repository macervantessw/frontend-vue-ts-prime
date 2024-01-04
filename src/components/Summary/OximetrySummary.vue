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
  <SummaryCard :title="t('Oximertry analysis')">
    <DataComponent title="CT80" :value="selectedSession?.SessionOxCT80 || 0" icon-text="80" />
    <DataComponent v-tooltip.top="false" title="CT90" :value="selectedSession?.SessionOxCT90 || 0" icon-text="90" />
    <DataComponent :tooltip="t('odi-description', { num: 2 })" title="ODI 2" :value="selectedSession?.SessionOxODI2 || 0" icon-text="2 " :num-decimals="2" />
    <DataComponent :tooltip="t('odi-description', { num: 3 })" title="ODI 3" :value="selectedSession?.SessionOxODI3 || 0" icon-text="3 " :num-decimals="2" />
    <DataComponent :tooltip="t('odi-description', { num: 4 })" v title="ODI 4" :value="selectedSession?.SessionOxODI4 || 0" icon-text="4 " :num-decimals="2" />
  </SummaryCard>
</template>
<style></style>
