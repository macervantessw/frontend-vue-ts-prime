<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { useSessionsStore } from "../store";
import { useUsersStore } from "../store";

import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Checkbox from "primevue/checkbox";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import { useToast } from "primevue/usetoast";

// ------------------------------------------------------------
// Debounce sin lodash
// ------------------------------------------------------------
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ------------------------------------------------------------
// Stores y Router
// ------------------------------------------------------------
const route = useRoute();
const router = useRouter();
const toast = useToast();
const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

const sessionId = String(route.params.sessionId);

// ------------------------------------------------------------
// Mismo path EXACTO que usas en SessionSummary.vue
// ------------------------------------------------------------
const getSessionPath = (session: any, ownerUserId: string) =>
  `users/${ownerUserId}/Sessions/${session.DeviceId}\\${session.SessionId}\\`;

// ------------------------------------------------------------
// Etiquetas legibles (Epworth, STOP-BANG, Antecedentes)
// ------------------------------------------------------------
const epworthLabels: Record<string, string> = {
  sittingReading: "Sentado leyendo",
  watchingTV: "Viendo la televisión",
  sittingInactive: "Sentado en lugar público",
  passengerCar: "Pasajero en coche 1 hora",
  lyingDown: "Tumbado por la tarde",
  talking: "Hablando con alguien",
  afterLunch: "Tras comer sin alcohol",
  carStopped: "En coche parado en tráfico",
};

const epworthOptions = [
  { label: "0 – Nunca se dormiría", value: 0 },
  { label: "1 – Baja probabilidad", value: 1 },
  { label: "2 – Moderada probabilidad", value: 2 },
  { label: "3 – Alta probabilidad", value: 3 },
];

const stopbangLabels: Record<string, string> = {
  snoring: "Ronquidos fuertes",
  tired: "Cansancio diurno",
  observed: "Apneas observadas",
  pressure: "Hipertensión",
  bmiOver35: "IMC > 35",
  ageOver50: "Edad > 50",
  neckOver40: "Cuello > 40 cm",
  male: "Sexo masculino",
};

const medicalHistoryLabels: Record<string,string> = {
  hypertension: "Hipertensión",
  diabetes: "Diabetes",
  dyslipidemia: "Dislipemia",
  cardiacDiseases: "Enfermedad cardíaca",
  respiratoryDiseases: "Enfermedad respiratoria",
  neurologic: "Patología neurológica",
  psychiatric: "Patología psiquiátrica",
  hypothyroidism: "Hipotiroidismo",
  acromegaly: "Acromegalia",
};

// ------------------------------------------------------------
// Estructura completa del formulario
// ------------------------------------------------------------
const form = ref<any>({
  personalData: {
    age: null,
    sex: "",
    weight: null,
    height: null,
    bmi: null,
    neck: null,
  },

  sleepSymptoms: {
    snoring: false,
    observedApneas: false,
    chokingAwakenings: false,
    restlessLegs: false,
    nightlyAwakenings: null,
    awakenReason: "",
  },

  daytimeSymptoms: {
    excessiveSleepiness: false,
    nearMissAccidents: false,
    concentrationIssues: false,
    moodChanges: false,
    fatigueLevel: "",
  },

  epworth: {
    sittingReading: 0,
    watchingTV: 0,
    sittingInactive: 0,
    passengerCar: 0,
    lyingDown: 0,
    talking: 0,
    afterLunch: 0,
    carStopped: 0,
  },

  stopbang: {
    snoring: false,
    tired: false,
    observed: false,
    pressure: false,
    bmiOver35: false,
    ageOver50: false,
    neckOver40: false,
    male: false,
  },

  medicalHistory: {
    hypertension: false,
    diabetes: false,
    dyslipidemia: false,
    cardiacDiseases: false,
    respiratoryDiseases: false,
    neurologic: false,
    psychiatric: false,
    hypothyroidism: false,
    acromegaly: false,
    other: "",
  },

  surgeries: {
    airwaySurgery: false,
    bariatricSurgery: false,
    details: "",
  },

  medications: {
    sleepMeds: "",
    antidepressants: "",
    opioids: "",
    antihypertensives: "",
    others: "",
  },

  lifestyle: {
    alcohol: null,                // unidades/semana
    smoking: {
      active: false,
      cigarettesPerDay: null,
      yearsSmoking: null,
    },
    caffeine: null,               // bebidas/día
    exerciseMinutes: null,        // min/semana
    exerciseIntensity: "",        // suave/moderado/vigoroso
  },

  clinicalComments: ""
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const medicalHistoryKeys = computed(() =>
  Object.keys(form.value.medicalHistory).filter((k) => k !== "other")
);

const epworthScore = computed(() =>
  Object.values(form.value.epworth).reduce((a: number, b: any) => a + Number(b), 0)
);

const stopBangScore = computed(() =>
  Object.values(form.value.stopbang).filter((v: any) => v === true).length
);

// Pack-years
const smokingPackYears = computed(() => {
  const s = form.value.lifestyle.smoking;
  if (!s.active || !s.cigarettesPerDay || !s.yearsSmoking) return "0";
  return ((s.cigarettesPerDay / 20) * s.yearsSmoking).toFixed(1);
});

// ------------------------------------------------------------
// Load / Save
// ------------------------------------------------------------
const loading = ref(true);
const saveState = ref<"idle" | "saving" | "saved">("idle");

const loadClinicalForm = async () => {
  const session = sessionsStore.sessions.find((s) => s.SessionId === sessionId);
  if (!session) {
    loading.value = false;
    return;
  }

  const ownerUserId = session.userId ?? usersStore.userId;
  const db = getDatabase();
  const path = `${getSessionPath(session, ownerUserId)}/ClinicalForm`;

  const snap = await get(dbRef(db, path));
  if (snap.exists()) Object.assign(form.value, snap.val());

  loading.value = false;
};

const saveForm = async () => {
  const session = sessionsStore.sessions.find((s) => s.SessionId === sessionId);
  if (!session) return;

  const ownerUserId = session.userId ?? usersStore.userId;
  const db = getDatabase();
  const path = `${getSessionPath(session, ownerUserId)}/ClinicalForm`;

  saveState.value = "saving";
  await update(dbRef(db, path), form.value);
  saveState.value = "saved";

  toast.add({
    severity: "success",
    summary: "Guardado",
    detail: "El formulario clínico se ha guardado correctamente.",
    life: 3000,
  });
};

const autoSave = debounce(() => saveForm(), 1200);

watch(form, () => {
  if (!loading.value) autoSave();
}, { deep: true });

onMounted(loadClinicalForm);

// ------------------------------------------------------------
// Auto-cálculo IMC
// ------------------------------------------------------------
watch(
  () => [form.value.personalData.weight, form.value.personalData.height],
  ([w, h]) => {
    if (w && h && w > 0 && h > 0) {
      form.value.personalData.bmi = Number((w / Math.pow(h / 100, 2)).toFixed(1));
    } else {
      form.value.personalData.bmi = null;
    }
  }
);

// ------------------------------------------------------------
const goBack = () => {
  router.push(`/sessionSummary/${sessionId}`);
};
</script>

<template>
  <div class="p-4">
    <h2 class="text-3xl text-primary mb-2">Formulario Clínico</h2>
    <p class="text-gray-600 mb-4">
      Completa los datos clínicos para complementar el informe del estudio de sueño.
    </p>

    <TabView>
      <!-- DATOS PERSONALES -->
      <TabPanel header="Datos personales">
        <p class="tab-description">
          Información demográfica y antropométrica relevante para el riesgo de apnea.
        </p>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Edad</label>
            <InputNumber v-model="form.personalData.age" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Sexo</label>
            <Dropdown
              v-model="form.personalData.sex"
              :options="[{label:'Hombre', value:'male'}, {label:'Mujer', value:'female'}]"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Peso (kg)</label>
            <InputNumber v-model="form.personalData.weight" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Altura (cm)</label>
            <InputNumber v-model="form.personalData.height" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>IMC (automático)</label>
            <InputNumber :modelValue="form.personalData.bmi" disabled class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Circunferencia de cuello (cm)</label>
            <InputNumber v-model="form.personalData.neck" class="w-full" />
          </div>
        </div>
      </TabPanel>

      <!-- SÍNTOMAS NOCTURNOS -->
      <TabPanel header="Síntomas nocturnos">
        <p class="tab-description">
          Signos durante el sueño que pueden sugerir apnea u otras alteraciones respiratorias.
        </p>

        <div class="checkbox-grid">
          <div class="checkbox-line">
            <Checkbox v-model="form.sleepSymptoms.snoring" :binary="true" />
            <span>¿Ronca habitualmente?</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.sleepSymptoms.observedApneas" :binary="true" />
            <span>¿Han observado apneas?</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.sleepSymptoms.chokingAwakenings" :binary="true" />
            <span>Despertares con sensación de ahogo</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.sleepSymptoms.restlessLegs" :binary="true" />
            <span>Síndrome de piernas inquietas</span>
          </div>
        </div>

        <div class="grid mt-3">
          <div class="col-12 md:col-6">
            <label>Despertares por noche</label>
            <InputNumber v-model="form.sleepSymptoms.nightlyAwakenings" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Motivo del despertar</label>
            <InputText v-model="form.sleepSymptoms.awakenReason" class="w-full" />
          </div>
        </div>
      </TabPanel>

      <!-- SÍNTOMAS DIURNOS -->
      <TabPanel header="Síntomas diurnos">
        <p class="tab-description">
          Manifestaciones diurnas relacionadas con sueño no reparador.
        </p>

        <div class="checkbox-grid">
          <div class="checkbox-line">
            <Checkbox v-model="form.daytimeSymptoms.excessiveSleepiness" :binary="true" />
            <span>Somnolencia excesiva</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.daytimeSymptoms.nearMissAccidents" :binary="true" />
            <span>Casi accidentes por somnolencia</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.daytimeSymptoms.concentrationIssues" :binary="true" />
            <span>Dificultad de concentración</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.daytimeSymptoms.moodChanges" :binary="true" />
            <span>Cambios de ánimo</span>
          </div>
        </div>

        <div class="col-12 mt-3">
          <label>Nivel de fatiga</label>
          <Dropdown
            v-model="form.daytimeSymptoms.fatigueLevel"
            :options="['ninguna','leve','moderada','intensa']"
            class="w-full"
          />
        </div>
      </TabPanel>

      <!-- EPWORTH -->
      <TabPanel header="Epworth">
  <p class="tab-description">
    Escala validada que evalúa la probabilidad de quedarse dormido (0–3 por ítem).
  </p>

  <div class="grid">
    <div
      v-for="(value, key) in form.epworth"
      :key="key"
      class="col-12 md:col-6"
    >
      <label>{{ epworthLabels[key] }}</label>

      <Dropdown
        v-model="form.epworth[key]"
        :options="epworthOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Selecciona probabilidad"
        class="w-full"
      />
    </div>
  </div>

  <div class="mt-3">
    <strong>Puntuación total: {{ epworthScore }}</strong>
  </div>
</TabPanel>


      <!-- STOP-BANG -->
      <TabPanel header="STOP-BANG">
        <p class="tab-description">
          Cuestionario internacional para estimar riesgo de apnea moderada o grave.
        </p>

        <div class="checkbox-grid">
          <div v-for="(value,key) in form.stopbang" :key="key" class="checkbox-line">
            <Checkbox v-model="form.stopbang[key]" :binary="true" />
            <span>{{ stopbangLabels[key] }}</span>
          </div>
        </div>

        <div class="mt-3">
          <strong>Puntuación total: {{ stopBangScore }}</strong>
        </div>
      </TabPanel>

      <!-- ANTECEDENTES -->
      <TabPanel header="Antecedentes médicos">
        <p class="tab-description">
          Condiciones médicas que influyen en el riesgo de apnea u otras patologías del sueño.
        </p>

        <div class="checkbox-grid">
          <div
            v-for="mhKey in medicalHistoryKeys"
            :key="mhKey"
            class="checkbox-line"
          >
            <Checkbox v-model="form.medicalHistory[mhKey]" :binary="true" />
            <span>{{ medicalHistoryLabels[mhKey] }}</span>
          </div>
        </div>

        <div class="col-12 mt-3">
          <label>Otros antecedentes</label>
          <Textarea v-model="form.medicalHistory.other" rows="3" class="w-full" />
        </div>
      </TabPanel>

      <!-- CIRUGÍAS -->
      <TabPanel header="Cirugías">
        <p class="tab-description">
          Procedimientos quirúrgicos que pueden modificar la anatomía o la respiración.
        </p>

        <div class="checkbox-grid">
          <div class="checkbox-line">
            <Checkbox v-model="form.surgeries.airwaySurgery" :binary="true" />
            <span>Cirugía de vía aérea</span>
          </div>

          <div class="checkbox-line">
            <Checkbox v-model="form.surgeries.bariatricSurgery" :binary="true" />
            <span>Cirugía bariátrica</span>
          </div>
        </div>

        <div class="mt-3">
          <label>Detalles</label>
          <Textarea v-model="form.surgeries.details" rows="3" class="w-full" />
        </div>
      </TabPanel>

      <!-- MEDICACIÓN -->
      <TabPanel header="Medicación">
        <p class="tab-description">
          Fármacos que pueden alterar la respiración, el sueño o el tono muscular.
        </p>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Medicamentos para dormir</label>
            <InputText v-model="form.medications.sleepMeds" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Antidepresivos / ansiolíticos</label>
            <InputText v-model="form.medications.antidepressants" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Opioides</label>
            <InputText v-model="form.medications.opioids" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Antihipertensivos</label>
            <InputText v-model="form.medications.antihipertensives" class="w-full" />
          </div>

          <div class="col-12">
            <label>Otros</label>
            <InputText v-model="form.medications.others" class="w-full" />
          </div>
        </div>
      </TabPanel>

      <!-- ESTILO DE VIDA -->
      <TabPanel header="Estilo de vida">
        <p class="tab-description">
          Hábitos que influyen directamente en la salud respiratoria y la calidad del sueño.
        </p>

        <!-- Alcohol -->
        <h4>Alcohol</h4>
        <label>Unidades por semana</label>
        <InputNumber
          v-model="form.lifestyle.alcohol"
          class="w-full"
          :min="0"
          placeholder="Ej: 4 unidades/semana"
        />

        <hr class="my-3"/>

        <!-- Tabaco -->
        <h4>Tabaco</h4>

        <div class="checkbox-line">
          <Checkbox v-model="form.lifestyle.smoking.active" :binary="true" />
          <span>Fumador activo</span>
        </div>

        <div v-if="form.lifestyle.smoking.active" class="grid mt-2">
          <div class="col-12 md:col-6">
            <label>Cigarrillos por día</label>
            <InputNumber v-model="form.lifestyle.smoking.cigarettesPerDay" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>Años fumando</label>
            <InputNumber v-model="form.lifestyle.smoking.yearsSmoking" class="w-full" />
          </div>

          <div class="col-12 mt-2">
            <strong>Pack-years:</strong> {{ smokingPackYears }}
          </div>
        </div>

        <hr class="my-3"/>

        <!-- Cafeína -->
        <h4>Cafeína</h4>
        <label>Bebidas con cafeína al día</label>
        <InputNumber
          v-model="form.lifestyle.caffeine"
          class="w-full"
          :min="0"
          placeholder="Ej: 2 cafés/día"
        />

        <hr class="my-3"/>

        <!-- Actividad física -->
        <h4>Actividad física</h4>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Minutos de ejercicio por semana</label>
            <InputNumber
              v-model="form.lifestyle.exerciseMinutes"
              class="w-full"
              :min="0"
              placeholder="Ej: 120 min/semana"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Intensidad</label>
            <Dropdown
              v-model="form.lifestyle.exerciseIntensity"
              :options="['suave','moderado','vigoroso']"
              placeholder="Selecciona"
              class="w-full"
            />
          </div>
        </div>
      </TabPanel>

      <!-- COMENTARIOS -->
      <TabPanel header="Comentarios">
        <p class="tab-description">
          Notas clínicas adicionales relevantes para la interpretación médica.
        </p>
        <Textarea v-model="form.clinicalComments" class="w-full" rows="4" />
      </TabPanel>
    </TabView>

    <div class="mt-4 flex gap-3">
      <Button
        :label="saveState === 'saving' ? 'Guardando...' : 'Guardar'"
        icon="pi pi-save"
        class="border-round-3xl"
        :disabled="saveState === 'saving'"
        @click="saveForm"
      />

      <Button
        label="Volver"
        icon="pi pi-arrow-left"
        class="border-round-3xl p-button-secondary"
        @click="goBack"
      />
    </div>
  </div>
</template>

<style>
.form-section {
  padding: 1rem;
}
label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.3rem;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.4rem 1rem;
}

.tab-description {
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
</style>
