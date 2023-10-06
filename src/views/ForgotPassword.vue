<template>
  <div class="w-full h-full flex justify-content-center align-items-center">
    <div class="w-full h-full flex flex-column justify-content-center surface-card shadow-7 py-7 px-6 border-round login-panel sm:w-11 sm:max-w-30rem sm:h-auto">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">{{ $t("Reset your password") }}</div>
        <span class="text-600 font-medium line-height-3">{{ $t("forgot_password_description") }}</span>
      </div>
      <div class="flex flex-column align-items-center">
        <TextInputWithLabel id="email" v-model:textInputValue="email" :v="v$.email" class="w-full mb-3" :field-label="$t('Email')" />
        <Button id="login-button" :label="$t('Send')" icon="pi pi-envelope" class="w-full mb-3" :disabled="loading" @click="resetPassword"></Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import TextInputWithLabel from "../components/TextInputWithLabel.vue";
import { useRouter } from "vue-router";
//import { sendResetLink } from "../../services/CredentialsService";
import { ref, computed } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email as isEmail } from "@vuelidate/validators";

let email = ref("");
let loading = ref(false);
const router = useRouter();

const rules = computed(() => {
  return {
    email: {
      required,
      isEmail,
    },
  };
});
const v$ = useVuelidate(rules, { email });

const resetPassword = () => {
  v$.value.$touch();
  if (v$.value.$invalid) {
    return;
  }
  //sendResetLink(email.value);
  //router.replace("/mailSent");
};
</script>

<style>
.login-panel {
  width: min(90%, 15rem);
}
</style>
