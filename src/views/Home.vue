<template>
  <p v-for="(session, index) in sessions" :key="index">{{ session }}</p>
</template>
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useSessionsStore } from "../store";

const { sessions } = storeToRefs(useSessionsStore());
</script>
<style></style>
