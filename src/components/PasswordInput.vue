<template>
  <div>
    <label for="password" class="block text-900 font-medium mb-2">{{ fieldLabel }}</label>
    <Password
      v-model="password"
      :input-id="id"
      class="w-full"
      :class="[v?.$error ? 'p-invalid' : '']"
      toggle-mask
      :feedback="suggestions"
      :weak-label="$t('Weak')"
      :medium-label="$t('medium')"
      :strong-label="$t('strong')"
      :prompt-label="$t('pick-a-password')"
      @input="changed"
      @blur="v?.$touch()"
    >
      <template v-if="suggestions" #header>
        <h6 class="text-lg mt-0 mb-4">{{ $t("pick-a-password") }}</h6>
      </template>
      <template v-if="suggestions" #footer="sp: any">
        {{ sp.level }}
        <Divider />
        <p class="mt-2">{{ $t("suggestions") }}</p>
        <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
          <li>{{ $t("password.suggestions.lowercase") }}</li>
          <li>{{ $t("password.suggestions.capital") }}</li>
          <li>{{ $t("password.suggestions.number") }}</li>
          <li>{{ $t("password.suggestions.min-chars", ["8"]) }}</li>
        </ul>
      </template>
    </Password>
    <span v-if="v?.$error">
      <span v-for="(error, index) of v?.$errors" id="name-error" :key="index">
        <small class="p-error">
          <p :id="id + '-error-' + index">{{ $t(error.$message as string) }}</p></small
        >
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Divider from "primevue/divider";
import Password from "primevue/password";

const props = defineProps({
  v: {
    type: Object,
    default: null,
  },
  id: {
    type: String,
    default: "",
  },
  passwordValue: { type: String, required: true },
  fieldLabel: { type: String, required: true },

  suggestions: Boolean,
});
const emit = defineEmits(["update:passwordValue"]);

const password = ref(props.passwordValue);
function changed() {
  emit("update:passwordValue", password.value);
}
</script>
<style>
.p-password-input {
  width: 100%;
}
</style>
