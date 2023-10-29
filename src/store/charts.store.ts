import { Time } from "lightweight-charts";
import { defineStore } from "pinia";

export const useChartsStore = defineStore("Charts", {
  state: () => ({
    xaxis: {} as { min: number; max: number },
    selection: {} as { x: number; y: number; time: Time },
    timeAxis: [] as number[],
  }),
  getters: {},
  actions: {},
});
