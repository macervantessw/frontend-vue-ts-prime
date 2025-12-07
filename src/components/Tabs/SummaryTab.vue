<template>
  <div>

    <!-- Banner sesión inválida -->
    <div v-if="sessionError" class="invalid-session-banner">
      <p>{{ sessionError }}</p>
    </div>

    <div v-else id="session-summary">

      <!-- DISCLAIMER -->
      <div div v-if="!showOptionalElements" class="info-banner">
        <p>
          {{ t('Disclaimer: The information provided in this application is for informational purposes only...') }}
        </p>
      </div>

      <!-- HEADER -->
      <slot name="sessionHeader"></slot>

      <!-- ========== RESÚMENES (MISMA ORGANIZACIÓN ORIGINAL) ========== -->
      <section class="summary-grid">

        <!-- Columna izquierda -->
        <div class="column">
          <PatientSummary />
          <SleepSummary />
          <AudioSummary />
        </div>

        <!-- Columna derecha -->
        <div class="column">
          <AhiSummary v-if="showOptionalElements" 
          :key="`ahi-${locale}`"/>
          <ODISummary v-if="hasOxymetryData && showOptionalElements" />
          <MovementSummary v-if="hasMovementData && showOptionalElements" />
        </div>

      </section>

      <!-- NOTAS -->
      <section v-if="showOptionalElements" class="notes-card w-full">
        <h3 class="m-0 mb-2">{{ t('Notas del profesional') }}</h3>

        <Textarea
            v-model="localNotes"
            :autoResize="false"
            rows="8"
            :disabled="!notesLoaded"
            class="w-full notes-textarea"
          />


        <div class="mt-2">
          <Button
            :label="savingNotes ? t('Guardando...') : t('Guardar notas')"
            icon="pi pi-save"
            class="border-round-3xl"
            :disabled="savingNotes || !notesLoaded"
            @click="$emit('saveNotes')"
          />
        </div>
      </section>

      <!-- Botón analysis -->
      <Button
        v-if="showOptionalElements"
        :label="t('view-analysis')"
        class="btn-go"
        icon="pi pi-chevron-right"
        @click="$emit('goToSession')"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { useI18n } from "vue-i18n";

import PatientSummary from "../Summary/PatientSummary.vue";
import SleepSummary from "../Summary/SleepSummary.vue";
import AhiSummary from "../Summary/RespiratorySummary.vue";
import AudioSummary from "../Summary/AudioSummary.vue";
import ODISummary from "../Summary/OximetrySummary.vue";
import MovementSummary from "../Summary/MovementSummary.vue";

const { t, locale  } = useI18n();

const props = defineProps({
  sessionError: String,
  showOptionalElements: Boolean,
  hasOxymetryData: Boolean,
  hasMovementData: Boolean,
  notesLoaded: Boolean,
  savingNotes: Boolean,
  notes: String
});

const emit = defineEmits(["saveNotes", "goToSession", "update:notes"]);

const localNotes = ref(props.notes);

watch(() => props.notes, (v) => (localNotes.value = v));
watch(localNotes, (v) => emit("update:notes", v));
</script>

<style scoped>
/* GRID ORIGINAL: 2 columnas en desktop */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* En móvil → 1 columna */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

/* Notas como antes */
.notes-card {
  background: #f6f9f8;
  border: 1px solid #d9e7e4;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

/* Botón inferior */
.btn-go {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 1.5rem;
}
</style>
