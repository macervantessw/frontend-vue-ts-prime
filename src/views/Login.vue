<template>
  <div class="w-full h-full flex justify-content-center align-items-center">
    <div class="surface-card p-4 border-round shadow-7 login-panel w-full sm:w-28rem md:w-30rem">
      <div class="text-center mb-5">
        <img src="../assets/logo.png" alt="Image" width="150" class="mb-6 mt-3" />
        <div class="text-900 text-3xl font-medium mb-3">{{ $t("Welcome Back") }}</div>
        <span class="text-600 font-medium line-height-3">{{ $t("Do not have an account?") }}</span>
        <router-link to="signup" class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">{{ $t("Create today!") }}</router-link>
      </div>
      <div>
        <TextInputWithLabel id="email" v-model:textInputValue="emailInput" :field-label="$t('Email')" class="w-full p-2 mb-1" :v="v$.email" @keyup.enter="logIn" />
        <PasswordInput
          id="password"
          v-model:password-value="password"
          class="w-full p-2"
          field-label="Password"
          :v="v$.password"
          :suggestions="false"
          @keyup.enter="logIn"
        />
        <div class="flex align-items-center justify-content-between mb-6">
          <div class="flex align-items-center pl-2">
            <Checkbox id="rememberme1" v-model="rememberMe" :binary="true" class="mr-2"></Checkbox>
            <label for="rememberme1">{{ $t("Remember me") }}</label>
          </div>
          <RouterLink class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer" :to="'/forgotPassword'">{{ $t("Forgot password?") }}</RouterLink>
        </div>
        <Button id="login-button" :label="$t('Log In')" icon="pi pi-user" class="w-full" :loading="loading" :disabled="loading" @click="logIn"></Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import { RouteLocationRaw, RouterLink } from "vue-router";
import { ref, computed } from "vue";
import i18n from "../i18n";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import TextInputWithLabel from "../components/TextInputWithLabel.vue";
import PasswordInput from "../components/PasswordInput.vue";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { useMessagesStore, useUsersStore } from "../store";
//import { User } from "firebase/auth";

const messagesStore = useMessagesStore();
const usersStore = useUsersStore();
const router = useRouter();
const route = useRoute();

let emailInput = ref("");
let password = ref("");
let rememberMe = ref(false);
let loading = ref(false);

// VUELIDATE CONFIG
const rules = computed(() => {
  return {
    password: {
      required,
    },
    email: {
      required,
      email,
    },
  };
});

const v$ = useVuelidate(rules, { password: password, email: emailInput });

const logIn = () => {
  const { t } = i18n.global;
  if (!emailInput.value || !password.value) {
    messagesStore.setErrorMessage(t("Please fill in all fields"));
    return;
  }
  if (v$.value.$invalid) {
    return;
  }
  loading.value = true;
  usersStore
    .loginUserWithEmailAndPassword(emailInput.value, password.value)
    .then((user: unknown) => {
      // Signed in
      console.log(user);

      if (route.params.redirectTo) {
        const routeLocation: RouteLocationRaw = { path: route.params.redirectTo.toString() };
        if (route.params.query) routeLocation.query = JSON.parse(route.params.query.toString());
        router.replace(routeLocation);
      } else {
        router.replace("/home");
      }
    })
    .catch(() => {
      // Error signing in
      loading.value = false;
    });
};
</script>

<style>
.login-panel {
  width: min(90%, 15rem);
}
</style>
