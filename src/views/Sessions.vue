<template>
  <div class="w-full h-full flex flex-column align-items-center">
    <p v-for="file in sessionFiles" :key="file" class="text-4xl text-bluegray-800 m-2">{{ file }}</p>
  </div>
</template>
<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useSessionsStore } from "../store";
import { useRoute } from "vue-router";

const sessionsStore = useSessionsStore();
const route = useRoute();
const sessionFiles = ref([] as string[]);
onBeforeMount(async () => {
  let sessionId: string = route.params.sessionId as string;
  sessionFiles.value = await sessionsStore.fetchSessionFiles(sessionId);
});
</script>
<style></style>
