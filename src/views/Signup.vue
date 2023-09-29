<template>
  <div class="flex flex-column align-items-center justify-content-center w-full h-full relative">
    <!--STEP 1 -->
    <FirstStep v-if="step == 1" v-model:emailModel="email" v-model:password="password" @continue="nextStep" />
    <!--STEP 2 -->
    <SecondStep v-if="step == 2" v-model:companyModel="companyName" v-model:companyServicesModel="companyServices" @continue="nextStep" />
    <!--STEP 3 -->
    <ThirdStep v-if="step == 3" v-model:workersEmailModel="workers" @continue="nextStep" />
    <!-- FOOTER -->
    <div class="footer absolute bottom-0 w-full flex justify-content-center">
      <a class="flex align-items-center absolute left-0 bottom-0 text-xs m-2" target="_blank" href="https://inedit.com">
        <img class="w-1rem" src="@/assets/inedit-favicon-32.png" />
        <div class="ml-1 pt-1">{{ $t("ineditLong") }}</div>
      </a>
      <a id="terms-link" class="m-3">{{ $t("terms") }}</a>
      <a class="m-3">{{ $t("contactUs") }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import FirstStep from "@/components/Signup/FirstStep.vue";
import SecondStep from "@/components/Signup/SecondStep.vue";
import ThirdStep from "@/components/Signup/ThirdStep.vue";
import { createUserWithEmailPasswordAndCompany } from "../../services/CredentialsService";
import { createNewUser, getUserById } from "../../services/UsersService";
import { useMainStore } from "../../store";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { useServiceStore } from "../../store";
import { onBeforeRouteLeave } from "vue-router";
const servicesStore = useServiceStore();
const store = useMainStore();
const router = useRouter();

let companyName = ref("");
let workers = ref([{ value: "" }]);
let email = ref("");
let password = ref("");
let step = ref(1);
let companyServices = ref("PM");
let companyId = "";

async function nextStep() {
  if (step.value < 3) step.value++;
  else {
    await signup();
    //await createCompany();
    store.companyId = companyId;
    createWorkers();
    router.replace("/home");
  }
}
// async function createCompany() {
//   const newCompany = await createNewCompany(companyName.value);
//   if (newCompany) companyId = newCompany.data.data.id;
// }
async function signup() {
  try {
    const response = await createUserWithEmailPasswordAndCompany(email.value, password.value, companyName.value, servicesStore.selectedServices);
    if (response) {
      const credentialsId = response.data.credentialId;
      store.setUserToken(response.data.token);
      store.setUserId(response.data.userId);
      getUserById(response.data.userId).then((userData) => {
        store.user = userData.data.data;
      });

      console.log("User has been created: ", credentialsId);
      //addAdditionaluserInfo(credentialsId);
    }
  } catch (error: any) {
    if (error.code == "auth/email-already-in-use") {
      store.errorMessage = "Email already in use";
    }
    console.log(error.code, error.name);
  }
}

// async function addAdditionaluserInfo(credentialsId: number) {
//   createNewUser(email.value.substring(0, email.value.lastIndexOf("@")), "", email.value, credentialsId);
// }

function createWorkers() {
  workers.value.forEach((email) => {
    if (email.value) createNewUser(email.value.substring(0, email.value.lastIndexOf("@")), "", email.value);
  });
}

onBeforeRouteLeave((to, from, next) => {
  if (step.value > 1 && to.path != "/home/orders") {
    step.value = step.value - 1;
    next(false);
  } else {
    next();
  }
});
</script>

<style scoped>
.p-inputtext {
  background: hsl(var(--main-color) 35% 20%) !important;
  border: 2px solid hsl(var(--main-color) 35% 30%) !important;
}
.p-inputtext.p-invalid.p-component {
  border-color: #ef9a9a !important;
}
</style>
