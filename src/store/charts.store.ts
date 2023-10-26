import { defineStore } from "pinia";

export const useChartsStore = defineStore("Charts", {
  state: () => ({
    xaxis: {} as { min: number; max: number },
    selection: {} as { min: number; max: number },
    timeAxis: [] as number[],
  }),
  getters: {},
  actions: {},
});
