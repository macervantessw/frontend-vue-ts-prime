<template>
  <div class="w-full h-full flex justify-content-center align-items-center">
    <div class="surface-card shadow-7 p-4 border-round signup-panel w-full sm:w-30rem md:w-full">
      <div class="text-center mb-5">
        <img src="../assets/logo.png" alt="Image" width="150" class="mb-6 mt-3" />
        <div class="text-900 text-3xl font-medium mb-3">Create a new account</div>
        <span class="text-600 font-medium line-height-3">Already have an account?</span>
        <router-link to="login" class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Login!</router-link>
      </div>
      <div>
        <TextInputWithLabel id="name" v-model:textInputValue="name" :field-label="$t('Name')" class="w-full p-2 mb-1" :v="v$.name" />
        <TextInputWithLabel id="surname" v-model:textInputValue="surname" :field-label="$t('Surname')" class="w-full p-2 mb-1" :v="v$.surname" />
        <TextInputWithLabel id="email" v-model:textInputValue="emailInput" :field-label="$t('Email')" class="w-full p-2 mb-1" :v="v$.emailInput" />
        <PasswordInput id="password" v-model:password-value="password" class="w-full p-2" :field-label="$t('Password')" :v="v$.password" :suggestions="true" />
        <PasswordInput id="password2" v-model:password-value="password2" class="w-full p-2" :field-label="$t('Repeat password')" :v="v$.password2" :suggestions="true" />
        <Button label="Sign Up" icon="pi pi-user" class="w-full mt-6" @click="doSignup"></Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useVuelidate } from "@vuelidate/core";
import { required, email, sameAs, helpers } from "@vuelidate/validators";
import { computed, ref } from "vue";
import TextInputWithLabel from "../components/TextInputWithLabel.vue";
import PasswordInput from "../components/PasswordInput.vue";
import i18n from "../i18n";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useMessagesStore, useUsersStore } from "../store";
import { auth } from "../firebase/firebaseInit";

const { t } = i18n.global;

const name = ref("");
const surname = ref("");
const emailInput = ref("");
const password = ref("");
const password2 = ref("");
const rules = computed(() => {
  return {
    name: {
      required,
    },
    surname: {
      required,
    },
    emailInput: {
      required,
      email,
    },
    password: {
      required,
      sameAs: helpers.withMessage(t("Passwords must match"), sameAs(password2)),
    },
    password2: {
      required,
      sameAs: helpers.withMessage(t("Passwords must match"), sameAs(password)),
    },
  };
});
const v$ = useVuelidate(rules, { name: name, surname: surname, emailInput: emailInput, password: password, password2: password2 });

function doSignup() {
  const messagesStore = useMessagesStore();
  const usersStore = useUsersStore();
  v$.value.$touch();
  if (v$.value.$invalid) {
    messagesStore.setErrorMessage(t("Please fill in all fields"));
    return;
  }
  createUserWithEmailAndPassword(auth, emailInput.value, password.value)
    .then((userCredential) => {
      usersStore.user = userCredential.user;
      console.log("User has been created: ", userCredential.user);
    })
    .catch((error) => {
      if (error.code == "auth/email-already-in-use") {
        messagesStore.setErrorMessage(t("Email already in use"));
      }
      console.log(error.code, error.name);
    });
}

// function addAdditionaluserInfo(auth) {
//   const user = auth.currentUser;
//   updateProfile(user, {
//     displayName: this.name,
//   })
//     .then(() => {})
//     .catch((error) => {
//       console.log(error.code, error.name);
//     });
//   setDoc(doc(db, "users", user.uid), {
//     company: this.company,
//     name: this.name,
//     surname: this.surname,
//     type: this.type,
//   });
//}
</script>

<style>
.signup-panel {
  max-width: 35rem;
}
</style>
