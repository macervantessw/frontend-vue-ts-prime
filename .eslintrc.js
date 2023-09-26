module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["plugin:cypress/recommended", "plugin:@typescript-eslint/recommended", "plugin:vue/vue3-recommended", "eslint:recommended", "prettier"],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error", // or "error"
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "vue/multi-word-component-names": "off",
    "prettier/prettier": [
      "error",
      {
        printWidth: 170,
        singleQuote: false,
      },
    ],
  },
  globals: {
    defineProps: "readonly",
    defineEmits: "readonly",
  },
};
