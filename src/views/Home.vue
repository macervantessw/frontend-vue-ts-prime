<template>
  <div class="home w-full h-full flex justify-content-center">
    <p v-for="(patientId, index) in patients" :key="index" class="text-4xl text-bluegray-800">
      <router-link :to="`/patientSessions/${patientId}`">
        {{ patientId }}
      </router-link>
    </p>
  </div>
</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSessionsStore } from "../store";
import { onBeforeMount } from "vue";
const sessionsStore = useSessionsStore();
const { patients } = storeToRefs(sessionsStore);

onBeforeMount(async () => {
  sessionsStore.fetchAllPatients();
});
</script>
<style></style>
