import { Range, Time } from "lightweight-charts";
import { defineStore } from "pinia";

export const useChartsStore = defineStore("Charts", {
  state: () => ({
    xaxis: {} as { min: number; max: number },
    selection: {} as { range: Range<Time> },
    timeAxis: [] as number[],
    reducedTimeAxis: [] as number[],
    oxymetryChartRendered: false,
    stateChartRendered: false,
    audioChartRendered: false,
    minimapChartRendered: false,
    respiratoryChartRendered: false,
  }),
  getters: {
    allRendered: (state) => {
      return state.oxymetryChartRendered && state.stateChartRendered && state.audioChartRendered && state.minimapChartRendered && state.respiratoryChartRendered;
    },
  },
  actions: {},
});
