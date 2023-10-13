import { defineStore } from "pinia";
export const useChartsStore = defineStore("Charts", {
  state: () => ({
    xaxis: {} as { min: number; max: number },
  }),
  getters: {},
  actions: {},
});
