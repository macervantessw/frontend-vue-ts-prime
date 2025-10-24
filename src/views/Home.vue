<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />

    <div class="flex h-full w-full min-h-0">
      <SideMenu v-if="!route.query.token">
        <!-- 🔍 Campo de búsqueda -->
        <div class="flex align-items-center w-full mb-2">
          <span class="p-input-icon-left flex-grow-1">
            <i class="pi pi-search" />
            <InputText
              v-model="searchText"
              class="w-full"
              :placeholder="t('Search')"
            />
          </span>
        </div>

        <!-- 🎛️ Botonera debajo -->
        <div class="flex justify-content-around align-items-center w-full mb-3 gap-2">
          <!-- 🌳 Árbol -->
          <Button
            icon="pi pi-sitemap"
            :class="{ 'p-button-outlined': viewMode !== 'tree' }"
            v-tooltip.bottom="'Vista en árbol'"
            @click="viewMode = 'tree'"
            rounded
            aria-label="Tree view"
          />

          <!-- 📋 Lista -->
          <Button
            icon="pi pi-list"
            :class="{ 'p-button-outlined': viewMode !== 'flat' }"
            v-tooltip.bottom="'Vista en lista'"
            @click="viewMode = 'flat'"
            rounded
            aria-label="List view"
          />

          <!-- 🔽 Más nuevo primero -->
          <Button
            icon="pi pi-sort-amount-down"
            :class="{ 'p-button-outlined': sortOrder !== 'desc' }"
            v-tooltip.bottom="'Ordenar: más reciente primero'"
            @click="sortOrder = 'desc'"
            rounded
            aria-label="Newest first"
          />

          <!-- 🔼 Más viejo primero -->
          <Button
            icon="pi pi-sort-amount-up-alt"
            :class="{ 'p-button-outlined': sortOrder !== 'asc' }"
            v-tooltip.bottom="'Ordenar: más antiguo primero'"
            @click="sortOrder = 'asc'"
            rounded
            aria-label="Oldest first"
          />
        </div>

        <!-- 👨‍💼 Vista para ADMIN -->
        <div v-if="usersStore.isAdmin">
          <!-- 🌳 Vista en árbol -->
          <template v-if="viewMode === 'tree'">
            <Accordion :key="sessionsGrouped" :active-index="0">
              <AccordionTab
                v-for="(user, userId) in sessionsGrouped"
                :key="userId"
                :header="userId.toString()"
              >
                <Accordion :key="user" :active-index="0">
                  <AccordionTab
                    v-for="(device, deviceName) in user"
                    :key="deviceName"
                    :header="deviceName.toString()"
                  >
                    <MenuItem
                      v-for="session in sortSessions(device)"
                      :key="session.SessionId"
                      :session="session"
                    />
                  </AccordionTab>
                </Accordion>
              </AccordionTab>
            </Accordion>
          </template>

          <!-- 📋 Vista plana -->
          <template v-else>
            <div class="flex flex-column gap-0 overflow-auto">
              <MenuItem
                v-for="session in sortedSessions"
                :key="session.SessionId"
                :session="session"
              />
            </div>
          </template>
        </div>

        <!-- 👤 Vista para usuario normal -->
        <div v-else>
          <!-- 🌳 Vista agrupada por DeviceID -->
          <template v-if="viewMode === 'tree'">
            <Accordion :active-index="0">
              <AccordionTab
                v-for="(device, deviceId) in groupedByDevice"
                :key="deviceId"
                :header="deviceId.toString()"
              >
                <MenuItem
                  v-for="session in sortSessions(device)"
                  :key="session.SessionId"
                  :session="session"
                />
              </AccordionTab>
            </Accordion>
          </template>

          <!-- 📋 Vista plana -->
          <template v-else>
            <div class="flex flex-column gap-0 overflow-auto">
              <MenuItem
                v-for="session in sortedSessions"
                :key="session.SessionId"
                :session="session"
              />
            </div>
          </template>
        </div>
      </SideMenu>

      <!-- 🌐 Contenedor derecho: detalle de sesión -->
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in" :duration="100">
          <component
            :is="Component"
            :key="route.path"
            class="w-full h-full p-2 sm:p-5 overflow-auto"
          />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onBeforeMount } from "vue";
import { useSessionsStore, useUsersStore } from "../store";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

// 🧩 Componentes UI
import NavigationBar from "../components/NavigationBar.vue";
import SideMenu from "../components/SideMenu.vue";
import MenuItem from "../components/MenuItem.vue";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tooltip from "primevue/tooltip";

// Activar tooltips (si no lo tienes global)
defineExpose({ Tooltip });

const { t } = useI18n();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const route = useRoute();

// 🔎 texto de búsqueda
const searchText = ref("");

// 👁️ modo de visualización y orden
// 👁️ modo de visualización y orden
const viewMode = ref<"tree" | "flat">("flat"); 
const sortOrder = ref<"asc" | "desc">("desc"); 

// 🌳 Agrupado por DeviceID (usuarios normales)
const groupedByDevice = computed(() => {
  const grouped: any = {};
  sessionsStore.sessions
    .filter((session) => filterSession(session))
    .forEach((session) => {
      if (!grouped[session.DeviceId]) grouped[session.DeviceId] = [];
      grouped[session.DeviceId].push(session);
    });
  return grouped;
});

// 👨‍💼 Agrupado por userId → deviceId (para admin)
const sessionsGrouped = computed(() => {
  return sessionsStore.sessions
    .filter((session) => filterSession(session))
    .reduce((grouped, session) => {
      if (!grouped[session.userId]) grouped[session.userId] = {};
      if (!grouped[session.userId][session.DeviceId])
        grouped[session.userId][session.DeviceId] = [];
      grouped[session.userId][session.DeviceId].push(session);
      return grouped;
    }, {} as any);
});

// 📋 Lista plana, ordenada según sortOrder
const sortedSessions = computed(() => {
  return sessionsStore.sessions
    .filter((session) => filterSession(session))
    .sort((a, b) =>
      sortOrder.value === "desc"
        ? Number(b.SessionId) - Number(a.SessionId)
        : Number(a.SessionId) - Number(b.SessionId)
    );
});

// 🔍 función común de filtrado
function filterSession(session: any) {
  if (!searchText.value) return true;
  const s = searchText.value.toLowerCase();
  return (
    session.Name?.toLowerCase().includes(s) ||
    session.Surname?.toLowerCase().includes(s) ||
    session.SessionId?.toLowerCase().includes(s)
  );
}

// 🔢 ordena sesiones dentro de cada grupo (DeviceId)
function sortSessions(sessions: any[]) {
  return [...sessions].sort((a, b) =>
    sortOrder.value === "desc"
      ? Number(b.SessionId) - Number(a.SessionId)
      : Number(a.SessionId) - Number(b.SessionId)
  );
}

// 🔄 Cargar sesiones al montar
onBeforeMount(async () => {
  await sessionsStore.fetchAllSessions();
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.p-accordion .p-accordion-content {
  padding: 5px 0 0 10px !important;
}

.sessions {
  background-color: var(--surface-ground);
}

/* Botones compactos y centrados */
.sessions .p-button {
  min-width: 2.5rem;
  height: 2.5rem;
}

.sessions .flex.justify-content-around {
  flex-wrap: wrap;
}

.sessions .p-button .pi {
  font-size: 1.2rem;
}
</style>
