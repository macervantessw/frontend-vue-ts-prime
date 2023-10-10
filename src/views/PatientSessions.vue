<template>
  <div class="flex h-full">
    <div class="w-full h-full flex flex-column flex-grow-0">
      <p v-for="(file, index) in patientSessions" :key="index" class="link-to-file text-bluegray-800 m-2 cursor-pointer" @click="selectedFile = file">
        {{ file.name }}
      </p>
    </div>
    <div class="flex-grow-1">
      <Session v-if="selectedFile" :file="selectedFile" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useSessionsStore } from "../store";
import { useRoute } from "vue-router";
import { StorageReference } from "firebase/storage";
import Session from "./Session.vue";

const selectedFile = ref(null as StorageReference | null);
const sessionsStore = useSessionsStore();
const route = useRoute();
const patientSessions = ref([] as StorageReference[]);
const patientId = ref(route.params.patientId as string);

onBeforeMount(async () => {
  patientSessions.value = await sessionsStore.fetchPatientSessions(patientId.value);
});
</script>
<style>
.link-to-file:hover {
  text-decoration: underline;
}
</style>
