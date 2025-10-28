<script lang="ts" setup>
import Avatar from "primevue/avatar";
import { useUsersStore, useMainStore } from "../store";
import Menu from "primevue/menu";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import i18n from "../i18n";
import { ref, computed } from "vue";
import { auth } from "../firebase/firebaseInit";
import { getDatabase, ref as dbRef, push, set, child, get } from "firebase/database";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { version } from "../../package.json";

const { t } = i18n.global;

const usersStore = useUsersStore();
const menu = ref();
const router = useRouter();
const route = useRoute();
const { menuVisible } = storeToRefs(useMainStore());
const toast = useToast();

// Estado diálogo importar sesión
const importDialogVisible = ref(false);
const importSessionID = ref("");

// Estado diálogo transferir crédito
const transferDialogVisible = ref(false);
const transferUserID = ref("");
const transferAmount = ref<number | null>(null);

// Mostrar diálogo importar sesión
function importSession() {
  importSessionID.value = "";
  importDialogVisible.value = true;
}

// Confirmar importación
async function confirmImportSession() {
  if (!importSessionID.value) {
    toast.add({
      severity: "warn",
      summary: t("Atención"),
      detail: t("Debes introducir un ID de sesión."),
      life: 3000
    });
    return;
  }

  try {
    const db = getDatabase();
    const newRef = push(dbRef(db, "ShareSessionRequests"));

    const requestData = {
      sessionPath: importSessionID.value,
      timeStamp: Math.floor(Date.now() / 1000),
      DestinationUserID: usersStore.user?.userID ?? "-",
      status: "pending"
    };

    await set(newRef, requestData);

    toast.add({
      severity: "success",
      summary: t("Importación correcta"),
      detail: t("La sesión {id} ha sido importada.", { id: importSessionID.value }),
      life: 4000
    });
    importDialogVisible.value = false;
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: t("Error"),
      detail: t("No se pudo importar la sesión."),
      life: 4000
    });
  }
}

// Mostrar diálogo transferir crédito
function transferCredit() {
  transferUserID.value = "";
  transferAmount.value = null;
  transferDialogVisible.value = true;
}

// Confirmar transferencia
async function confirmTransferCredit() {
  if (!transferUserID.value || !transferAmount.value || transferAmount.value <= 0) {
    toast.add({
      severity: "warn",
      summary: t("Atención"),
      detail: t("Debes introducir un ID de usuario y un importe válido."),
      life: 3000
    });
    return;
  }

  const currentCredit = Number(usersStore.user?.Credit ?? 0);
  if (transferAmount.value > currentCredit) {
    toast.add({
      severity: "error",
      summary: t("Saldo insuficiente"),
      detail: t("No tienes suficientes créditos. Disponibles: {available}.", { available: currentCredit }),
      life: 4000
    });
    return;
  }

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/transfer-credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: usersStore.user?.userID,
        toUserId: transferUserID.value,
        amount: transferAmount.value
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || t("Error al contactar con el servidor"));
    }

    const result = await response.json();

    toast.add({
      severity: "success",
      summary: t("Transferencia completada"),
      detail: result.message || t("Se han transferido {amount} créditos.", { amount: transferAmount.value }),
      life: 4000
    });

    if (result.newFromCredits !== undefined) {
      usersStore.user!.Credit = String(result.newFromCredits);
    }

    transferDialogVisible.value = false;

  } catch (error: any) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: t("Error"),
      detail: t("No se pudo completar la transferencia: {message}", { message: error.message }),
      life: 4000
    });
  }
}

const userItems = computed(() => [
  {
    items: [
      {
        label: `${usersStore.user?.name} ${usersStore.user?.lastName}`,
        icon: "pi pi-user",
        disabled: true,
      },
      {
        label: usersStore.user?.email,
        icon: "pi pi-envelope",
        disabled: true,
      },
      {
        label: t("Crédito: {credit}", { credit: usersStore.user?.Credit ?? "-" }),
        icon: "pi pi-wallet",
        disabled: true,
      },
      {
        label: t("ID: {id}", { id: usersStore.user?.userID ?? "-" }),
        icon: "pi pi-id-card",
        disabled: true,
      },
      ...(usersStore.userIsProfessional
        ? [
            {
              label: t("Profesional"),
              icon: "pi pi-briefcase",
              disabled: true,
            },
          ]
        : []),
      { separator: true },
      ...(usersStore.userIsProfessional
        ? [
            {
              label: t("Importar sesión"),
              icon: "pi pi-upload",
              command: importSession,
            },
          ]
        : []),
      {
        label: t("Transferir crédito"),
        icon: "pi pi-exchange",
        command: transferCredit,
      },
      { separator: true },
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
]);

async function fetchUserData() {
  try {
    console.log("🔄 Iniciando fetch de datos del usuario desde Firebase...");
    const db = getDatabase();
    const snapshot = await get(child(dbRef(db), `users/${usersStore.user?.userID}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      usersStore.$patch({
        user: {
          ...usersStore.user,
          Credit: userData.Credit,
          NotifToken: userData.NotifToken,
        },
      });
      console.log("✅ Datos del usuario actualizados desde Firebase:", userData);
    } else {
      console.warn("⚠️ No se encontraron datos del usuario en Firebase.");
    }
  } catch (error) {
    console.error("❌ Error al obtener datos del usuario desde Firebase:", error);
  }
}

function toggleMenu(event: Event) {
  fetchUserData();
  menu.value.toggle(event);
  setTimeout(() => {
    const menuEl = document.getElementById("user_menu");
    const triggerEl = event.currentTarget as HTMLElement;
    if (menuEl && triggerEl) {
      const triggerWidth = triggerEl.offsetWidth;
      const extraWidth = 20;
      menuEl.style.minWidth = (triggerWidth + extraWidth) + "px";
      menuEl.style.width = (triggerWidth + extraWidth) + "px";
    }
  }, 0);
}
</script>

<template>
  <div v-if="!route.query.token" class="navbar flex align-items-center justify-content-between w-full">
    <div class="navbar-left flex">
      <div class="flex align-items-center mr-4 md:hidden relative">
        <Transition name="fade">
          <i
            v-if="!menuVisible"
            id="troggleMenuButton"
            class="pi pi-bars cursor-pointer text-xl absolute"
            @click="menuVisible = !menuVisible"
          />
          <i
            v-else
            id="troggleMenuButton"
            class="pi pi-times cursor-pointer text-xl absolute"
            @click="menuVisible = !menuVisible"
          />
        </Transition>
      </div>
      <div class="h-3rem w-6rem ml-3 cursor-pointer" @click="router.push('/')">
        <img src="../assets/logo.png" alt="logo" class="h-full" />
      </div>
      <div class="flex align-items-end ml-5">{{ version }}</div>
    </div>
    <div class="navbar-right flex align-items-center cursor-pointer" @click="toggleMenu">
      <Avatar
        :label="usersStore.userInitials"
        class="mr-2"
        size="large"
        style="border-radius: 4px; background-color: #2196f3; color: #ffffff"
      />
      <span style="font-size: 1.1rem; font-weight: 500">
        {{ usersStore.user?.name }} {{ usersStore.user?.lastName }}
      </span>
    </div>
  </div>
  <Menu id="user_menu" ref="menu" :model="userItems" :popup="true" />

  <!-- Dialogo importar sesión -->
  <Dialog :header="t('Importar sesión')" v-model:visible="importDialogVisible" modal style="width: 400px">
    <div class="p-fluid">
      <label for="sessionId">{{ t('ID de la sesión') }}</label>
      <InputText id="sessionId" v-model="importSessionID" />
    </div>
    <template #footer>
      <Button :label="t('Cancelar')" icon="pi pi-times" class="p-button-text" @click="importDialogVisible = false" />
      <Button :label="t('Importar')" icon="pi pi-check" @click="confirmImportSession" />
    </template>
  </Dialog>

  <!-- Dialogo transferir crédito -->
  <Dialog :header="t('Transferir crédito')" v-model:visible="transferDialogVisible" modal style="width: 400px">
    <div class="p-fluid">
      <label for="userId">{{ t('ID del usuario destino') }}</label>
      <InputText id="userId" v-model="transferUserID" />
      <label for="amount" class="mt-3">{{ t('Cantidad de créditos') }}</label>
      <InputNumber id="amount" v-model="transferAmount" mode="decimal" showButtons />
    </div>
    <template #footer>
      <Button :label="t('Cancelar')" icon="pi pi-times" class="p-button-text" @click="transferDialogVisible = false" />
      <Button :label="t('Transferir')" icon="pi pi-check" @click="confirmTransferCredit" />
    </template>
  </Dialog>

  <Toast />
</template>

<style>
#user_menu {
  min-width: 300px !important;
  width: 300px !important;
}
#user_menu .p-menuitem { width: 100%; }
.navbar {
  border-bottom: 1px solid var(--surface-border);
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02);
  background: var(--surface-overlay);
  min-height: 56px;
  padding: 0 2rem 0 1rem;
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
.navbar-right { border-radius: 4px; z-index: 999; padding: 4px; }
.navbar-right:hover { background: var(--surface-ground); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
