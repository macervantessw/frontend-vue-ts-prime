<template>
  <div class="sessions flex flex-column h-full w-full">
    <NavigationBar />

    <!-- 🌐 Contenido principal -->
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
          <Button
            icon="pi pi-sitemap"
            :class="{ 'p-button-outlined': viewMode !== 'tree' }"
            v-tooltip.bottom="'Vista en árbol'"
            @click="viewMode = 'tree'"
            rounded
            aria-label="Tree view"
          />
          <Button
            icon="pi pi-list"
            :class="{ 'p-button-outlined': viewMode !== 'flat' }"
            v-tooltip.bottom="'Vista en lista'"
            @click="viewMode = 'flat'"
            rounded
            aria-label="List view"
          />
          <Button
            icon="pi pi-sort-amount-down"
            :class="{ 'p-button-outlined': sortOrder !== 'desc' }"
            v-tooltip.bottom="'Ordenar: más reciente primero'"
            @click="sortOrder = 'desc'"
            rounded
            aria-label="Newest first"
          />
          <Button
            icon="pi pi-sort-amount-up-alt"
            :class="{ 'p-button-outlined': sortOrder !== 'asc' }"
            v-tooltip.bottom="'Ordenar: más antiguo primero'"
            @click="sortOrder = 'asc'"
            rounded
            aria-label="Oldest first"
          />
        </div>

        <!-- 🕒 Cargando -->
        <template v-if="isLoading">
          <div class="flex flex-column align-items-center justify-content-center p-3 text-center text-500">
            <i class="pi pi-spin pi-spinner mb-2" style="font-size: 4rem"></i>
            <span>{{ t('Loading sessions...') }}</span>
          </div>
        </template>

        <!-- ❌ Error de carga -->
        <template v-else-if="loadError">
          <div class="flex flex-column align-items-center justify-content-center p-3 text-center text-500">
            <i class="pi pi-exclamation-triangle mb-2" style="font-size: 2rem"></i>
            <span>{{ t('There was a problem loading sessions') }}</span>
            <Button class="mt-3" icon="pi pi-refresh" label="Reintentar" @click="reload" />
          </div>
        </template>

        <!-- 🟨 Sin resultados por búsqueda (solo cuando NO está cargando) -->
        <template v-else-if="!isLoading && sortedSessions.length === 0 && searchText">
          <div class="flex flex-column align-items-center justify-content-center p-3 text-center text-500">
            <i class="pi pi-search mb-2" style="font-size: 2rem"></i>
            <span>{{ t('No results for') }} “{{ searchText }}”</span>
          </div>
        </template>

        <!-- 🟩 Lista vacía (sin filtros) solo cuando ya “decidimos” dejar de cargar -->
        <!-- 🟩 Estado vacío minimalista -->
        <template v-else-if="!isLoading && hasLoadedOnce && sortedSessions.length === 0">
          <div class="flex flex-column align-items-center justify-content-center p-4 text-center text-500">
            <i class="pi pi-inbox mb-3" style="font-size: 3rem; opacity: .6"></i>
            <div class="mb-3" style="opacity:.8">{{ t('') }}</div>
            <div class="flex gap-2">
              <Button icon="pi pi-refresh" :label="t('Reload')" @click="reload" />
            </div>
          </div>
        </template>


        <!-- ✅ Contenido cuando hay sesiones -->
        <template v-else>
          <!-- 👨‍💼 Vista para ADMIN -->
          <div v-if="usersStore.isAdmin">
            <!-- 🌳 Vista en árbol -->
            <template v-if="viewMode === 'tree'">
              <Accordion :key="'adminTree-' + searchText" :active-index="0">
                <AccordionTab
                  v-for="(user, userId) in sessionsGrouped"
                  :key="userId"
                  :header="userId.toString()"
                >
                  <Accordion :active-index="0">
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
              <div class="flex flex-column gap-0 overflow-auto" :key="'flatList-admin-' + searchText + sortOrder">
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
              <Accordion :key="'userTree-' + searchText" :active-index="0">
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
              <div class="flex flex-column gap-0 overflow-auto" :key="'flatList-user-' + searchText + sortOrder">
                <MenuItem
                  v-for="session in sortedSessions"
                  :key="session.SessionId"
                  :session="session"
                />
              </div>
            </template>
          </div>
        </template>
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
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import NavigationBar from "../components/NavigationBar.vue";
import SideMenu from "../components/SideMenu.vue";
import MenuItem from "../components/MenuItem.vue";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tooltip from "primevue/tooltip";

import { useSessionsStore, useUsersStore } from "../store";

defineExpose({ Tooltip });

const { t } = useI18n();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();
const route = useRoute();

// 🔎 búsqueda
const searchText = ref("");

// 👁️ vista/orden
const viewMode = ref<"tree" | "flat">("flat");
const sortOrder = ref<"asc" | "desc">("desc");

// 🔁 flags LOCALES
const isLoading = ref(true);
const loadError = ref<unknown | null>(null);
const hasLoadedOnce = ref(false);

// ⏱️ control de timeout y watcher para la primera carga
let emptyTimeout: ReturnType<typeof setTimeout> | null = null;
let stopFirstWatch: (() => void) | null = null;

// 🌳 Agrupado por DeviceID (usuarios normales)
const groupedByDevice = computed(() => {
  const grouped: Record<string, any[]> = {};
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
    }, {} as Record<string, Record<string, any[]>>);
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
    String(session.SessionId ?? "").toLowerCase().includes(s)
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

// 🔄 Lógica de carga robusta sin tocar el store
async function reload() {
  // Reinicio de control
  if (emptyTimeout) { clearTimeout(emptyTimeout); emptyTimeout = null; }
  if (stopFirstWatch) { stopFirstWatch(); stopFirstWatch = null; }

  isLoading.value = true;
  loadError.value = null;
  hasLoadedOnce.value = false;

  try {
    // 1) Disparar la carga (no dependas de que devuelva/espere una promesa real)
    const maybePromise = sessionsStore.fetchAllSessions?.();
    if (maybePromise && typeof maybePromise.then === "function") {
      // Aun si “resuelve” antes de poblar datos, mantendremos el spinner por el watcher/timeout
      maybePromise.catch((e: unknown) => { loadError.value = e; });
    }

    // 2) Watch: si entra algún dato, cerramos loading enseguida
    stopFirstWatch = watch(
      () => sessionsStore.sessions.length,
      (len) => {
        if (len > 0) {
          isLoading.value = false;
          hasLoadedOnce.value = true;
          if (emptyTimeout) { clearTimeout(emptyTimeout); emptyTimeout = null; }
          if (stopFirstWatch) { stopFirstWatch(); stopFirstWatch = null; }
        }
      },
      { immediate: false }
    );

    // 3) Timeout de respaldo: si pasado X ms no llegan datos, mostramos vacío
    emptyTimeout = setTimeout(() => {
      isLoading.value = false;
      hasLoadedOnce.value = true; // “decidimos” que de momento no hay sesiones
      if (stopFirstWatch) { stopFirstWatch(); stopFirstWatch = null; }
    }, 15000); // ajusta a tu gusto (2–8s suele ir bien)
  } catch (e) {
    loadError.value = e;
    isLoading.value = false;
    hasLoadedOnce.value = true;
  }
}

// 🚀 Lanzar carga tras el primer render (spinner visible desde el inicio)
onMounted(() => {
  reload();
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
