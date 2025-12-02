<template>
  <div class="clinical-form p-4">
    <h2 class="text-primary mb-3">Formulario Clínico del Paciente</h2>

    <p class="text-secondary mb-3">
      Este formulario se adapta automáticamente según la edad del paciente.
      <span v-if="isPediatric">Modo: <strong>PEDIÁTRICO</strong></span>
      <span v-else>Modo: <strong>ADULTO</strong></span>
    </p>

    <TabView>
      <!-- ───────────────────────────────────── -->
      <!--           DATOS PERSONALES            -->
      <!-- ───────────────────────────────────── -->
      <TabPanel header="Datos personales">
        <p class="tab-description">
          Datos antropométricos y básicos del paciente.
        </p>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Edad (años)</label>
            <InputNumber
              v-model="form.personalData.age"
              :min="0"
              @input="handleAgeChange"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Sexo</label>
            <Dropdown
              v-model="form.personalData.sex"
              :options="['masculino', 'femenino']"
              placeholder="Selecciona sexo"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-4">
            <label>Peso (kg)</label>
            <InputNumber
              v-model="form.personalData.weight"
              :min="0"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-4">
            <label>Altura (cm)</label>
            <InputNumber
              v-model="form.personalData.height"
              :min="0"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-4">
            <label>IMC</label>
            <InputNumber
              v-model="form.personalData.bmi"
              :disabled="true"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Circunferencia de cuello (cm)</label>
            <InputNumber
              v-model="form.personalData.neck"
              :min="0"
              class="w-full"
            />
          </div>
        </div>
      </TabPanel>

      <!-- ───────────────────────────────────── -->
      <!--    TABS ADULTOS (SOLO ≥12 AÑOS)      -->
      <!-- ───────────────────────────────────── -->
      <TabPanel header="Epworth" v-if="!isPediatric">
        <p class="tab-description">
          Escala de somnolencia diurna (0–3 por ítem).
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

      <TabPanel header="STOP-BANG" v-if="!isPediatric">
        <p class="tab-description">
          Cuestionario de riesgo de apnea obstructiva del sueño.
        </p>

        <div class="grid">
          <div
            v-for="(value, key) in form.stopbang"
            :key="key"
            class="checkbox-line col-12 md:col-6"
          >
            <Checkbox v-model="form.stopbang[key]" :binary="true" />
            <span>{{ stopbangLabels[key] }}</span>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Estilo de vida" v-if="!isPediatric">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Alcohol (unidades/semana)</label>
            <InputNumber
              v-model="form.lifestyle.alcohol"
              :min="0"
              placeholder="p. ej. 4"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Bebidas con cafeína/día</label>
            <InputNumber
              v-model="form.lifestyle.caffeine"
              :min="0"
              placeholder="p. ej. 2"
              class="w-full"
            />
          </div>
        </div>

        <div class="mt-3">
          <h4>Tabaco</h4>
          <div class="checkbox-line">
            <Checkbox v-model="form.lifestyle.smoking.active" :binary="true" />
            <span>Fumador activo</span>
          </div>

          <div class="grid mt-2" v-if="form.lifestyle.smoking.active">
            <div class="col-12 md:col-6">
              <label>Cigarrillos por día</label>
              <InputNumber
                v-model="form.lifestyle.smoking.cigarettesPerDay"
                :min="0"
                class="w-full"
              />
            </div>

            <div class="col-12 md:col-6">
              <label>Años fumando</label>
              <InputNumber
                v-model="form.lifestyle.smoking.yearsSmoking"
                :min="0"
                class="w-full"
              />
            </div>

            <div class="col-12">
              <strong>Pack-years: {{ smokingPackYears }}</strong>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Antecedentes clínicos" v-if="!isPediatric">
        <div
          v-for="(value, key) in form.medicalHistory"
          :key="key"
          class="checkbox-line"
        >
          <Checkbox v-model="form.medicalHistory[key]" :binary="true" />
          <span>{{ medicalHistoryLabels[key] }}</span>
        </div>
      </TabPanel>

      <TabPanel header="Medicación actual" v-if="!isPediatric">
        <Textarea
          v-model="form.medication"
          class="w-full"
          placeholder="Lista de medicación actual"
          rows="5"
        />
      </TabPanel>

      <!-- ───────────────────────────────────── -->
      <!--    TABS PEDIÁTRICOS (SOLO <12 AÑOS)  -->
      <!-- ───────────────────────────────────── -->

      <TabPanel header="BEARS" v-if="isPediatric">
  <div
    v-for="(label, key) in bearsLabels"
    :key="key"
    class="checkbox-line"
  >
    <Checkbox v-model="form.bears[key]" :binary="true" />
    <span>{{ label }}</span>
  </div>
</TabPanel>


      <TabPanel header="PDSS" v-if="isPediatric">
        <p class="tab-description">
          Pediatric Daytime Sleepiness Scale (0–4 por ítem).
        </p>

        <div class="grid">
          <div
            v-for="(value, key) in form.pdss"
            :key="key"
            class="col-12 md:col-6"
          >
            <label>{{ pdssLabels[key] }}</label>

            <Dropdown
              v-model="form.pdss[key]"
              :options="pdssOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona"
              class="w-full"
            />
          </div>
        </div>

        <div class="mt-3">
          <strong>Puntuación PDSS total: {{ pdssScore }}</strong>
        </div>
      </TabPanel>

      <TabPanel header="ORL pediátrico" v-if="isPediatric">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label>Amígdalas (grado)</label>
            <Dropdown
              v-model="form.pediatricOrl.tonsils"
              :options="[0,1,2,3,4]"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-6">
            <label>Adenoides (grado)</label>
            <Dropdown
              v-model="form.pediatricOrl.adenoids"
              :options="[0,1,2,3,4]"
              class="w-full"
            />
          </div>

          <div class="checkbox-line col-12 mt-2">
            <Checkbox
              v-model="form.pediatricOrl.nasalObstruction"
              :binary="true"
            />
            <span>Obstrucción nasal habitual</span>
          </div>

          <div class="checkbox-line col-12">
            <Checkbox
              v-model="form.pediatricOrl.mouthBreathing"
              :binary="true"
            />
            <span>Respiración oral</span>
          </div>
        </div>
      </TabPanel>

    <TabPanel header="Antecedentes pediátricos" v-if="isPediatric">
  <div
    v-for="(label, key) in pediatricHistoryLabels"
    :key="key"
    class="checkbox-line"
  >
    <Checkbox v-model="form.pediatricHistory[key]" :binary="true" />
    <span>{{ label }}</span>
  </div>
</TabPanel>


      <!-- ───────────────────────────────────── -->
      <!--              COMENTARIOS              -->
      <!-- ───────────────────────────────────── -->
      <TabPanel header="Comentarios">
        <Textarea
          v-model="form.comments"
          rows="6"
          class="w-full"
          placeholder="Observaciones adicionales"
        />
      </TabPanel>
    </TabView>

    <div class="mt-4 flex justify-content-end">
      <Button
        label="Guardar"
        icon="pi pi-save"
        class="p-button-primary"
        :disabled="saving"
        @click="saveClinicalForm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useSessionsStore } from "../store";
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Textarea from "primevue/textarea";
import Checkbox from "primevue/checkbox";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import { useUsersStore } from "../store";

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

/* ─────────────────────────────────────────────────────────── */
/*         FORMULARIO BASE (ADULTO + PEDIÁTRICO)               */
/* ─────────────────────────────────────────────────────────── */

/* Default Epworth: evita que “desaparezcan” preguntas cuando faltan claves */
const epworthDefault = {
  sittingReading: null as number | null,
  watchingTV: null as number | null,
  sittingInactive: null as number | null,
  passengerCar: null as number | null,
  lyingDown: null as number | null,
  talking: null as number | null,
  afterLunch: null as number | null,
  carStopped: null as number | null,
};

const form = ref({
  personalData: {
    age: null as number | null,
    sex: "" as string,
    weight: null as number | null,
    height: null as number | null,
    bmi: null as number | null,
    neck: null as number | null,
  },

  /* Adulto */
  epworth: {
    ...epworthDefault,
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

  lifestyle: {
    alcohol: null as number | null,
    caffeine: null as number | null,
    smoking: {
      active: false,
      cigarettesPerDay: null as number | null,
      yearsSmoking: null as number | null,
    },
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
  },

  medication: "",

  /* Pediátrico */
  bears: {
  bedtimeProblems: false,
  excessiveSleepiness: false,
  awakenings: false,
  regularity: false,
  snoring: false,
},


  pdss: {
    sleepyMorning: null as number | null,
    difficultyWaking: null as number | null,
    fallAsleepAfternoon: null as number | null,
    longSleepLatency: null as number | null,
    struggleStayAwake: null as number | null,
    napping: null as number | null,
    inattentiveSchool: null as number | null,
    fatigue: null as number | null,
  },

  pediatricOrl: {
    tonsils: null as number | null,
    adenoids: null as number | null,
    nasalObstruction: false,
    mouthBreathing: false,
  },

  pediatricHistory: {
  prematurity: false,
  asthma: false,
  allergies: false,
  developmentalDisorders: false,
  hyperactivity: false,
  poorSchoolPerformance: false,
  schoolHistory: false, // 👈 nuevo campo
},


  comments: "",
});

/* ────────────────────────────────────────────── */
/*   DETECCIÓN AUTOMÁTICA ADULTO vs PEDIÁTRICO    */
/* ────────────────────────────────────────────── */

const isPediatric = computed(() => {
  const age = form.value.personalData.age;
  return age !== null && age < 12;
});

/* ────────────────────────────────────────────── */
/*           AUTOIMPORTACIÓN DE DATOS             */
/* ────────────────────────────────────────────── */

const autoImportSessionFields = () => {
  const session = sessionsStore.selectedSession;

  console.log("Selected session:", session);

  if (!session) return;

  // Solo rellenar si está vacío
  if (!form.value.personalData.age && session.Age)
    form.value.personalData.age = session.Age;

  if (!form.value.personalData.weight && session.Weight)
    form.value.personalData.weight = session.Weight;

  if (!form.value.personalData.height && session.Height)
    form.value.personalData.height = session.Height;
};

/* ────────────────────────────────────────────── */
/*                    CÁLCULOS                    */
/* ────────────────────────────────────────────── */

const epworthLabels: Record<string, string> = {
  sittingReading: "Sentado leyendo",
  watchingTV: "Viendo televisión",
  sittingInactive: "Sentado inactivo en público",
  passengerCar: "Pasajero en coche 1 hora",
  lyingDown: "Tumbado por la tarde",
  talking: "Hablando con alguien",
  afterLunch: "Después de comer (sin alcohol)",
  carStopped: "En coche detenido en tráfico",
};

const epworthOptions = [
  { label: "0 – Nunca se dormiría", value: 0 },
  { label: "1 – Baja probabilidad", value: 1 },
  { label: "2 – Moderada probabilidad", value: 2 },
  { label: "3 – Alta probabilidad", value: 3 },
];

const epworthScore = computed(() => {
  return Object.values(form.value.epworth).reduce(
    (sum, v) => sum + (v || 0),
    0
  );
});

const stopbangLabels: Record<string, string> = {
  snoring: "Ronquidos",
  tired: "Somnolencia diurna",
  observed: "Apneas observadas",
  pressure: "Hipertensión",
  bmiOver35: "IMC > 35",
  ageOver50: "Edad > 50",
  neckOver40: "Cuello > 40 cm",
  male: "Sexo masculino",
};

const bearsLabels: Record<string, string> = {
  bedtimeProblems: "Problemas al irse a la cama",
  excessiveSleepiness: "Somnolencia diurna excesiva",
  awakenings: "Despertares nocturnos",
  regularity: "Rutina irregular o insuficiente",
  snoring: "Ronquido habitual",
};


const pdssLabels: Record<string, string> = {
  sleepyMorning: "Somnolencia por la mañana",
  difficultyWaking: "Dificultad para despertarse",
  fallAsleepAfternoon: "Se queda dormido por la tarde",
  longSleepLatency: "Tarda mucho en dormirse",
  struggleStayAwake: "Lucha por mantenerse despierto",
  napping: "Siestas frecuentes",
  inattentiveSchool: "Inatención en el colegio",
  fatigue: "Fatiga general",
};

const pdssOptions = [
  { label: "0 – Nunca", value: 0 },
  { label: "1 – Casi nunca", value: 1 },
  { label: "2 – A veces", value: 2 },
  { label: "3 – Frecuentemente", value: 3 },
  { label: "4 – Siempre", value: 4 },
];

const pdssScore = computed(() =>
  Object.values(form.value.pdss).reduce((s, v) => s + (v || 0), 0)
);

const pediatricHistoryLabels: Record<string, string> = {
  prematurity: "Prematuridad",
  asthma: "Asma",
  allergies: "Alergias",
  developmentalDisorders: "Trastornos del desarrollo",
  hyperactivity: "Hiperactividad",
  poorSchoolPerformance: "Bajo rendimiento escolar",
  schoolHistory: "Antecedentes escolares", // 👈 nuevo label
};


const medicalHistoryLabels: Record<string, string> = {
  hypertension: "Hipertensión",
  diabetes: "Diabetes",
  dyslipidemia: "Dislipemia",
  cardiacDiseases: "Enfermedad cardíaca",
  respiratoryDiseases: "Enfermedad respiratoria",
  neurologic: "Trastornos neurológicos",
  psychiatric: "Trastornos psiquiátricos",
  hypothyroidism: "Hipotiroidismo",
  acromegaly: "Acromegalia",
};

/* IMC dinámico */
watch(
  () => [form.value.personalData.weight, form.value.personalData.height],
  ([w, h]) => {
    if (w && h) {
      form.value.personalData.bmi = +(
        w /
        Math.pow(h / 100, 2)
      ).toFixed(1);
    }
  }
);

const smokingPackYears = computed(() => {
  const s = form.value.lifestyle.smoking;
  if (!s.active || !s.cigarettesPerDay || !s.yearsSmoking) return 0;
  return ((s.cigarettesPerDay / 20) * s.yearsSmoking).toFixed(1);
});

/* ────────────────────────────────────────────── */
/*             CARGA Y GUARDADO FB                */
/* ────────────────────────────────────────────── */

const db = getDatabase();
const saving = ref(false);

const sessionId = sessionsStore.selectedSession?.SessionId;
const userId = usersStore.userId;

const path = `users/${userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionId}\\/ClinicalForm`;

/* Asegura que Epworth siempre tenga todas las claves */
const ensureEpworthKeys = () => {
  form.value.epworth = {
    ...epworthDefault,
    ...(form.value.epworth || {}),
  };
};

const loadClinicalForm = async () => {
  const snap = await get(dbRef(db, path));
  if (snap.exists()) {
    Object.assign(form.value, snap.val());
  }
  // Rellenamos las preguntas que falten de Epworth
  ensureEpworthKeys();
};

const saveClinicalForm = async () => {
  saving.value = true;
  await set(dbRef(db, path), form.value);
  saving.value = false;
};

/* ────────────────────────────────────────────── */
/*             MONTADO + AUTOIMPORTACIÓN          */
/* ────────────────────────────────────────────── */

onMounted(async () => {
  await loadClinicalForm();
});

watch(
  () => sessionsStore.selectedSession,
  (session) => {
    if (session) {
      console.log("Session loaded:", session);
      autoImportSessionFields();
    }
  },
  { immediate: true }
);

/* ────────────────────────────────────────────── */

const handleAgeChange = () => {
  // No hacemos nada más; los tabs se actualizarán automáticamente
};
</script>

<style scoped>
.clinical-form {
  max-width: 900px;
  margin: 0 auto;
}

.tab-description {
  color: #666;
  margin-bottom: 1rem;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}

.text-primary {
  color: #117064;
}
</style>
