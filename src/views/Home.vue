<template>
  <div class="w-full h-full flex justify-content-center">
    <p v-for="(session, index) in sessions" :key="index" class="text-4xl text-bluegray-800">
      <router-link :to="`/sessions/${session}`">
        {{ session }}
      </router-link>
    </p>
  </div>
</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSessionsStore } from "../store";

const { sessions } = storeToRefs(useSessionsStore());
</script>
<style></style>
