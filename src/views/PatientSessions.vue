<template>
  <div class="flex flex-column h-full w-full bg-white">
    <NavigationBar />
    <div class="flex w-full h-full">
      <div class="flex flex-column">
        <p v-for="(file, index) in patientSessions" :key="index" class="link-to-file text-bluegray-800 m-2 cursor-pointer" @click="selectedFile = file">
          {{ file.name.split("_")[0] }}
        </p>
      </div>
      <div class="flex-grow-1">
        <Session v-if="selectedFile" :file="selectedFile" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { StorageReference } from "firebase/storage";
import { useRoute } from "vue-router";
import { useSessionsStore } from "../store";
import NavigationBar from "../components/NavigationBar.vue";
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
