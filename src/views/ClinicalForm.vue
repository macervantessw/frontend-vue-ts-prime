<template>
  <div class="clinical-form p-4">
    <h2 class="text-primary mb-3">{{ t("clinicalForm.title") }}</h2>

    <p class="text-secondary mb-3">
      {{ t("clinicalForm.subtitle") }}
      <span v-if="isPediatric">
        {{ t("clinicalForm.mode") }}: <strong>{{ t("clinicalForm.modePediatric") }}</strong>
      </span>
      <span v-else>
        {{ t("clinicalForm.mode") }}: <strong>{{ t("clinicalForm.modeAdult") }}</strong>
      </span>
    </p>

    <TabView>
      <!-- DATOS PERSONALES -->
      <TabPanel :header="t('clinicalForm.tabs.personalData')">
        <p class="tab-description">{{ t("clinicalForm.personal.description") }}</p>

        <div class="grid">
          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.personal.age") }}</label>
            <InputNumber v-model="form.personalData.age" :min="0" @input="handleAgeChange" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.personal.sex") }}</label>
            <Dropdown
              v-model="form.personalData.sex"
              :options="sexOptionsTranslated"
              :placeholder="t('clinicalForm.placeholders.select')"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-4">
            <label>{{ t("clinicalForm.personal.weight") }}</label>
            <InputNumber v-model="form.personalData.weight" :min="0" class="w-full" />
          </div>

          <div class="col-12 md:col-4">
            <label>{{ t("clinicalForm.personal.height") }}</label>
            <InputNumber v-model="form.personalData.height" :min="0" class="w-full" />
          </div>

          <div class="col-12 md:col-4">
            <label>{{ t("clinicalForm.personal.bmi") }}</label>
            <InputNumber v-model="form.personalData.bmi" :disabled="true" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.personal.neck") }}</label>
            <InputNumber v-model="form.personalData.neck" :min="0" class="w-full" />
          </div>
        </div>
      </TabPanel>

      <!-- EPWORTH -->
      <TabPanel :header="t('clinicalForm.tabs.epworth')" v-if="!isPediatric">
        <p class="tab-description">{{ t("clinicalForm.epworth.description") }}</p>

        <div class="grid">
          <div v-for="(labelKey,key) in epworthLabels" :key="key" class="col-12 md:col-6">
            <label>{{ t(labelKey) }}</label>

            <Dropdown
              v-model="form.epworth[key]"
              :options="epworthOptionsTranslated"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('clinicalForm.placeholders.select')"
              class="w-full"
            />
          </div>
        </div>

        <div class="mt-3">
          <strong>{{ t("clinicalForm.epworth.totalScore", { score: epworthScore }) }}</strong>
        </div>
      </TabPanel>

      <!-- STOP-BANG -->
      <TabPanel :header="t('clinicalForm.tabs.stopbang')" v-if="!isPediatric">
        <p class="tab-description">{{ t("clinicalForm.stopbang.description") }}</p>

        <div class="grid">
          <div v-for="(labelKey,key) in stopbangLabels" :key="key" class="checkbox-line col-12 md:col-6">
            <Checkbox v-model="form.stopbang[key]" :binary="true" />
            <span>{{ t(labelKey) }}</span>
          </div>
        </div>
      </TabPanel>

      <!-- ESTILO DE VIDA -->
      <TabPanel :header="t('clinicalForm.tabs.lifestyle')" v-if="!isPediatric">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.lifestyle.alcohol") }}</label>
            <InputNumber v-model="form.lifestyle.alcohol" :min="0" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.lifestyle.caffeine") }}</label>
            <InputNumber v-model="form.lifestyle.caffeine" :min="0" class="w-full" />
          </div>
        </div>

        <div class="mt-3">
          <h4>{{ t("clinicalForm.lifestyle.smoking.title") }}</h4>
          <div class="checkbox-line">
            <Checkbox v-model="form.lifestyle.smoking.active" :binary="true" />
            <span>{{ t("clinicalForm.lifestyle.smoking.activeSmoker") }}</span>
          </div>

          <div class="grid mt-2" v-if="form.lifestyle.smoking.active">
            <div class="col-12 md:col-6">
              <label>{{ t("clinicalForm.lifestyle.smoking.cigarettesPerDay") }}</label>
              <InputNumber v-model="form.lifestyle.smoking.cigarettesPerDay" :min="0" class="w-full" />
            </div>

            <div class="col-12 md:col-6">
              <label>{{ t("clinicalForm.lifestyle.smoking.yearsSmoking") }}</label>
              <InputNumber v-model="form.lifestyle.smoking.yearsSmoking" :min="0" class="w-full" />
            </div>

            <div class="col-12">
              <strong>{{ t("clinicalForm.lifestyle.smoking.packYears") }}: {{ smokingPackYears }}</strong>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ANTECEDENTES CLÍNICOS -->
      <TabPanel :header="t('clinicalForm.tabs.medicalHistory')" v-if="!isPediatric">
        <div v-for="(labelKey,key) in medicalHistoryLabels" :key="key" class="checkbox-line">
          <Checkbox v-model="form.medicalHistory[key]" :binary="true" />
          <span>{{ t(labelKey) }}</span>
        </div>
      </TabPanel>

      <!-- MEDICACIÓN -->
      <TabPanel :header="t('clinicalForm.tabs.medication')" v-if="!isPediatric">
        <Textarea
          v-model="form.medication"
          class="w-full"
          :placeholder="t('clinicalForm.placeholders.medication')"
          rows="5"
        />
      </TabPanel>

      <!-- BEARS -->
      <TabPanel header="BEARS" v-if="isPediatric">
        <div v-for="(labelKey,key) in bearsLabels" :key="key" class="checkbox-line">
          <Checkbox v-model="form.bears[key]" :binary="true" />
          <span>{{ t(labelKey) }}</span>
        </div>
      </TabPanel>

      <!-- PDSS -->
      <TabPanel :header="t('clinicalForm.tabs.pdss')" v-if="isPediatric">
        <p class="tab-description">{{ t("clinicalForm.pdss.description") }}</p>

        <div class="grid">
          <div v-for="(labelKey,key) in pdssLabels" :key="key" class="col-12 md:col-6">
            <label>{{ t(labelKey) }}</label>

            <Dropdown
              v-model="form.pdss[key]"
              :options="pdssOptionsTranslated"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('clinicalForm.placeholders.select')"
              class="w-full"
            />
          </div>
        </div>

        <div class="mt-3">
          <strong>{{ t("clinicalForm.pdss.totalScore", { score: pdssScore }) }}</strong>
        </div>
      </TabPanel>

      <!-- ORL PEDIÁTRICO -->
      <TabPanel :header="t('clinicalForm.tabs.pediatricOrl')" v-if="isPediatric">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.pediatricOrl.tonsils") }}</label>
            <Dropdown v-model="form.pediatricOrl.tonsils" :options="[0,1,2,3,4]" class="w-full" />
          </div>

          <div class="col-12 md:col-6">
            <label>{{ t("clinicalForm.pediatricOrl.adenoids") }}</label>
            <Dropdown v-model="form.pediatricOrl.adenoids" :options="[0,1,2,3,4]" class="w-full" />
          </div>

          <div class="checkbox-line col-12 mt-2">
            <Checkbox v-model="form.pediatricOrl.nasalObstruction" :binary="true" />
            <span>{{ t("clinicalForm.pediatricOrl.nasalObstruction") }}</span>
          </div>

          <div class="checkbox-line col-12">
            <Checkbox v-model="form.pediatricOrl.mouthBreathing" :binary="true" />
            <span>{{ t("clinicalForm.pediatricOrl.mouthBreathing") }}</span>
          </div>
        </div>
      </TabPanel>

      <!-- ANTECEDENTES PEDIÁTRICOS -->
      <TabPanel :header="t('clinicalForm.tabs.pediatricHistory')" v-if="isPediatric">
        <div v-for="(labelKey,key) in pediatricHistoryLabels" :key="key" class="checkbox-line">
          <Checkbox v-model="form.pediatricHistory[key]" :binary="true" />
          <span>{{ t(labelKey) }}</span>
        </div>
      </TabPanel>

      <!-- COMENTARIOS -->
      <TabPanel :header="t('clinicalForm.tabs.comments')">
        <Textarea
          v-model="form.comments"
          rows="6"
          class="w-full"
          :placeholder="t('clinicalForm.placeholders.comments')"
        />
      </TabPanel>
    </TabView>

    <div class="mt-4 flex justify-content-end">
      <Button
        :label="t('clinicalForm.saveButton')"
        icon="pi pi-save"
        class="p-button-primary"
        :disabled="saving"
        @click="saveClinicalForm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/* ————————————————————————————————————— */
/* Mantengo toda tu lógica EXACTAMENTE igual */
/* ————————————————————————————————————— */

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
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const sessionsStore = useSessionsStore();
const usersStore = useUsersStore();

/* Opciones de sexo traducidas */
const sexOptionsTranslated = computed(() => [
  { label: t("clinicalForm.personal.sexMale"), value: "masculino" },
  { label: t("clinicalForm.personal.sexFemale"), value: "femenino" }
]);



/* ────────────────────────────────────────────── */
/*           TIPOS PARA EL FORMULARIO             */
/* ────────────────────────────────────────────── */

interface PersonalData {
  age: number | null;
  sex: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  neck: number | null;
}

interface Epworth {
  sittingReading: number | null;
  watchingTV: number | null;
  sittingInactive: number | null;
  passengerCar: number | null;
  lyingDown: number | null;
  talking: number | null;
  afterLunch: number | null;
  carStopped: number | null;
}

interface StopBang {
  snoring: boolean;
  tired: boolean;
  observed: boolean;
  pressure: boolean;
  bmiOver35: boolean;
  ageOver50: boolean;
  neckOver40: boolean;
  male: boolean;
}

interface Lifestyle {
  alcohol: number | null;
  caffeine: number | null;
  smoking: {
    active: boolean;
    cigarettesPerDay: number | null;
    yearsSmoking: number | null;
  };
}

interface MedicalHistory {
  hypertension: boolean;
  diabetes: boolean;
  dyslipidemia: boolean;
  cardiacDiseases: boolean;
  respiratoryDiseases: boolean;
  neurologic: boolean;
  psychiatric: boolean;
  hypothyroidism: boolean;
  acromegaly: boolean;
}

interface Bears {
  bedtimeProblems: boolean;
  excessiveSleepiness: boolean;
  awakenings: boolean;
  regularity: boolean;
  snoring: boolean;
}

interface Pdss {
  sleepyMorning: number | null;
  difficultyWaking: number | null;
  fallAsleepAfternoon: number | null;
  longSleepLatency: number | null;
  struggleStayAwake: number | null;
  napping: number | null;
  inattentiveSchool: number | null;
  fatigue: number | null;
}

interface PediatricOrl {
  tonsils: number | null;
  adenoids: number | null;
  nasalObstruction: boolean;
  mouthBreathing: boolean;
}

interface PediatricHistory {
  prematurity: boolean;
  asthma: boolean;
  allergies: boolean;
  developmentalDisorders: boolean;
  hyperactivity: boolean;
  poorSchoolPerformance: boolean;
  schoolHistory: boolean;
}

interface ClinicalForm {
  personalData: PersonalData;
  epworth: Epworth;
  stopbang: StopBang;
  lifestyle: Lifestyle;
  medicalHistory: MedicalHistory;
  bears: Bears;
  pdss: Pdss;
  pediatricOrl: PediatricOrl;
  pediatricHistory: PediatricHistory;
  medication: string;
  comments: string;
}

/* ────────────────────────────────────────────── */
/*           FORM STATE INICIAL (TIPADO)          */
/* ────────────────────────────────────────────── */

const epworthDefault: Epworth = {
  sittingReading: null,
  watchingTV: null,
  sittingInactive: null,
  passengerCar: null,
  lyingDown: null,
  talking: null,
  afterLunch: null,
  carStopped: null,
};

const form = ref<ClinicalForm>({
  personalData: {
    age: null,
    sex: "",
    weight: null,
    height: null,
    bmi: null,
    neck: null,
  },

  epworth: { ...epworthDefault },

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
    alcohol: null,
    caffeine: null,
    smoking: {
      active: false,
      cigarettesPerDay: null,
      yearsSmoking: null,
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

  bears: {
    bedtimeProblems: false,
    excessiveSleepiness: false,
    awakenings: false,
    regularity: false,
    snoring: false,
  },

  pdss: {
    sleepyMorning: null,
    difficultyWaking: null,
    fallAsleepAfternoon: null,
    longSleepLatency: null,
    struggleStayAwake: null,
    napping: null,
    inattentiveSchool: null,
    fatigue: null,
  },

  pediatricOrl: {
    tonsils: null,
    adenoids: null,
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
    schoolHistory: false,
  },

  medication: "",
  comments: "",
});


/* LABEL KEYS PARA i18n */
const epworthLabels = {
  sittingReading: "clinicalForm.epworth.labels.sittingReading",
  watchingTV: "clinicalForm.epworth.labels.watchingTV",
  sittingInactive: "clinicalForm.epworth.labels.sittingInactive",
  passengerCar: "clinicalForm.epworth.labels.passengerCar",
  lyingDown: "clinicalForm.epworth.labels.lyingDown",
  talking: "clinicalForm.epworth.labels.talking",
  afterLunch: "clinicalForm.epworth.labels.afterLunch",
  carStopped: "clinicalForm.epworth.labels.carStopped",
};

const stopbangLabels = {
  snoring: "clinicalForm.stopbang.labels.snoring",
  tired: "clinicalForm.stopbang.labels.tired",
  observed: "clinicalForm.stopbang.labels.observed",
  pressure: "clinicalForm.stopbang.labels.pressure",
  bmiOver35: "clinicalForm.stopbang.labels.bmiOver35",
  ageOver50: "clinicalForm.stopbang.labels.ageOver50",
  neckOver40: "clinicalForm.stopbang.labels.neckOver40",
  male: "clinicalForm.stopbang.labels.male",
};

const bearsLabels = {
  bedtimeProblems: "clinicalForm.bears.labels.bedtimeProblems",
  excessiveSleepiness: "clinicalForm.bears.labels.excessiveSleepiness",
  awakenings: "clinicalForm.bears.labels.awakenings",
  regularity: "clinicalForm.bears.labels.regularity",
  snoring: "clinicalForm.bears.labels.snoring",
};

const pdssLabels = {
  sleepyMorning: "clinicalForm.pdss.labels.sleepyMorning",
  difficultyWaking: "clinicalForm.pdss.labels.difficultyWaking",
  fallAsleepAfternoon: "clinicalForm.pdss.labels.fallAsleepAfternoon",
  longSleepLatency: "clinicalForm.pdss.labels.longSleepLatency",
  struggleStayAwake: "clinicalForm.pdss.labels.struggleStayAwake",
  napping: "clinicalForm.pdss.labels.napping",
  inattentiveSchool: "clinicalForm.pdss.labels.inattentiveSchool",
  fatigue: "clinicalForm.pdss.labels.fatigue",
};

const pediatricHistoryLabels = {
  prematurity: "clinicalForm.pediatricHistory.labels.prematurity",
  asthma: "clinicalForm.pediatricHistory.labels.asthma",
  allergies: "clinicalForm.pediatricHistory.labels.allergies",
  developmentalDisorders: "clinicalForm.pediatricHistory.labels.developmentalDisorders",
  hyperactivity: "clinicalForm.pediatricHistory.labels.hyperactivity",
  poorSchoolPerformance: "clinicalForm.pediatricHistory.labels.poorSchoolPerformance",
  schoolHistory: "clinicalForm.pediatricHistory.labels.schoolHistory",
};

const medicalHistoryLabels = {
  hypertension: "clinicalForm.medicalHistory.labels.hypertension",
  diabetes: "clinicalForm.medicalHistory.labels.diabetes",
  dyslipidemia: "clinicalForm.medicalHistory.labels.dyslipidemia",
  cardiacDiseases: "clinicalForm.medicalHistory.labels.cardiacDiseases",
  respiratoryDiseases: "clinicalForm.medicalHistory.labels.respiratoryDiseases",
  neurologic: "clinicalForm.medicalHistory.labels.neurologic",
  psychiatric: "clinicalForm.medicalHistory.labels.psychiatric",
  hypothyroidism: "clinicalForm.medicalHistory.labels.hypothyroidism",
  acromegaly: "clinicalForm.medicalHistory.labels.acromegaly",
};

/* OPTIONS (Epworth + PDSS) traducidas */
const epworthOptionsTranslated = computed(() => [
  { label: t("clinicalForm.epworth.options.0"), value: 0 },
  { label: t("clinicalForm.epworth.options.1"), value: 1 },
  { label: t("clinicalForm.epworth.options.2"), value: 2 },
  { label: t("clinicalForm.epworth.options.3"), value: 3 },
]);

const pdssOptionsTranslated = computed(() => [
  { label: t("clinicalForm.pdss.options.0"), value: 0 },
  { label: t("clinicalForm.pdss.options.1"), value: 1 },
  { label: t("clinicalForm.pdss.options.2"), value: 2 },
  { label: t("clinicalForm.pdss.options.3"), value: 3 },
  { label: t("clinicalForm.pdss.options.4"), value: 4 },
]);

/* Lógica sin cambios */
const isPediatric = computed(() => {
  const age = form.value.personalData.age;
  return age !== null && age < 12;
});

watch(() => [form.value.personalData.weight, form.value.personalData.height], ([w, h]) => {
  if (w && h) form.value.personalData.bmi = +(w / Math.pow(h / 100, 2)).toFixed(1);
});

const smokingPackYears = computed(() => {
  const s = form.value.lifestyle.smoking;
  if (!s.active || !s.cigarettesPerDay || !s.yearsSmoking) return 0;
  return ((s.cigarettesPerDay / 20) * s.yearsSmoking).toFixed(1);
});

const epworthScore = computed(() => {
  return Object.values(form.value.epworth).reduce<number>((sum, v) => {
    return sum + (v ?? 0);
  }, 0);
});

const pdssScore = computed(() => {
  return Object.values(form.value.pdss).reduce<number>((sum, v) => {
    return sum + (v ?? 0);
  }, 0);
});

const db = getDatabase();
const saving = ref(false);

const sessionId = sessionsStore.selectedSession?.SessionId;
const userId = usersStore.userId;

const path = `users/${userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionId}\\/ClinicalForm`;

/* Fix Epworth missing keys */
const ensureEpworthKeys = () => {
  form.value.epworth = { ...epworthDefault, ...(form.value.epworth || {}) };
};

const loadClinicalForm = async () => {
  const snap = await get(dbRef(db, path));
  if (snap.exists()) Object.assign(form.value, snap.val());
  ensureEpworthKeys();
};

const saveClinicalForm = async () => {
  saving.value = true;
  await set(dbRef(db, path), form.value);
  saving.value = false;
};

onMounted(loadClinicalForm);

watch(() => sessionsStore.selectedSession, (session) => {
  if (session) {
    if (!form.value.personalData.age && session.Age) form.value.personalData.age = session.Age;
    if (!form.value.personalData.weight && session.Weight) form.value.personalData.weight = session.Weight;
    if (!form.value.personalData.height && session.Height) form.value.personalData.height = session.Height;
  }
}, { immediate: true });

const handleAgeChange = () => {};
</script>
