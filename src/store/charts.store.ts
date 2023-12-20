import { Range, Time } from "lightweight-charts";
import { defineStore } from "pinia";
import { useSessionsStore } from "./sessions.store";
export const useChartsStore = defineStore("Charts", {
  state: () => ({
    xaxis: {} as { min: number; max: number },
    selection: {} as { range: Range<Time> },
    timeAxis: [] as number[],
    reducedTimeAxis: [] as number[],
    currentTime: 0,
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
  actions: {
    setNotRendered() {
      this.oxymetryChartRendered = false;
      this.stateChartRendered = false;
      this.audioChartRendered = false;
      this.minimapChartRendered = false;
      this.respiratoryChartRendered = false;
    },
    setCurrentTime(time: number) {
      const sessionsStore = useSessionsStore();
      this.currentTime = time / 1000 - (sessionsStore.selectedSession?.SessionStartTime || this.timeAxis[0] / 1000);
    },
  },
});
