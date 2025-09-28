<template>
  <div class="w-full h-full flex justify-content-center align-items-center">
    <div class="w-full h-full flex flex-column justify-content-center surface-card shadow-7 py-7 px-6 border-round login-panel sm:w-11 sm:max-w-30rem sm:h-auto">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">{{ t("Reset your password") }}</div>
        <span class="text-600 font-medium line-height-3">{{ t("forgot_password_description") }}</span>
      </div>
      <div class="flex flex-column align-items-center">
        <TextInputWithLabel id="email" v-model:textInputValue="email" :v="v$.email" class="w-full mb-3" :field-label="t('Email')" />
        <Button id="login-button" :label="t('Send')" icon="pi pi-envelope" class="w-full mb-3" :disabled="loading" @click="resetPassword"></Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import TextInputWithLabel from "../components/TextInputWithLabel.vue";
//import { sendResetLink } from "../../services/CredentialsService";
import { ref, computed } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email as isEmail } from "@vuelidate/validators";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseInit";
import { useMessagesStore } from "../store";
//import i18n from "../i18n";
import router from "../router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();


//const { t } = i18n.global;
let email = ref("");
let loading = ref(false);

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
  sendPasswordResetEmail(auth, email.value)
    .then(() => {
      useMessagesStore().setSuccessMessage(t("email-sent"));
      router.push("/login");
    })
    .catch((error) => {
      useMessagesStore().setErrorMessage(error.message);
    });
};
</script>

<style>
.login-panel {
  width: min(90%, 15rem);
}
</style>
