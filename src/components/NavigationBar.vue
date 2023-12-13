<script lang="ts" setup>
import Avatar from "primevue/avatar";
import { useUsersStore, useMainStore } from "../store";
import Menu from "primevue/menu";
import i18n from "../i18n";
import { ref } from "vue";
import { auth } from "../firebase/firebaseInit";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { version } from "../../package.json";

const { t } = i18n.global;
const usersStore = useUsersStore();
const menu = ref();
const router = useRouter();
const { menuVisible } = storeToRefs(useMainStore());
const userItems = [
  {
    items: [
      {
        label: t("Logout"),
        icon: "pi pi-sign-out",
        command: () => {
          auth.signOut();
          router.push("/login");
        },
      },
    ],
  },
];

function toggleMenu(event: Event) {
  menu.value.toggle(event);
}
</script>
<template>
  <div class="navbar flex align-items-center justify-content-between w-full">
    <div class="navbar-left flex">
      <div class="flex align-items-center mr-4 md:hidden relative">
        <Transition name="fade">
          <i v-if="!menuVisible" id="troggleMenuButton" class="pi pi-bars cursor-pointer text-xl absolute" @click="menuVisible = !menuVisible" />
          <i v-else id="troggleMenuButton" class="pi pi-times cursor-pointer text-xl absolute" @click="menuVisible = !menuVisible" />
        </Transition>
      </div>
      <div class="h-3rem w-6rem ml-3 cursor-pointer" @click="router.push('/')">
        <img src="../assets/logo.png" alt="logo" class="h-full" />
      </div>
      <div class="flex align-items-end ml-5">{{ version }}</div>
    </div>
    <div class="navbar-right flex align-items-center cursor-pointer" @click="toggleMenu">
      <Avatar :label="usersStore.userInitials" class="mr-2" size="large" style="border-radius: 4px; background-color: #2196f3; color: #ffffff" />
      <span style="font-size: 1.1rem; font-weight: 500">{{ usersStore.user?.name }} {{ usersStore.user?.lastName }}</span>
    </div>
  </div>
  <Menu id="user_menu" ref="menu" :model="userItems" :popup="true" />
</template>
<style>
.navbar {
  border-bottom: 1px solid var(--surface-border);
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02);
  background: var(--surface-overlay);
  min-height: 56px;
  padding: 0 2rem 0 1rem;
  border-bottom: 1px solid var(--surface-border);
  width: 100%;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-color);
  transition: transform 0.4s cubic-bezier(0.05, 0.74, 0.2, 0.99);
}
.navbar-right {
  border-radius: 4px;
  z-index: 999;
  padding: 4px;
}
.navbar-right:hover {
  background: var(--surface-ground);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
