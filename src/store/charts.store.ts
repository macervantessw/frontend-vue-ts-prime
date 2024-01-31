import { Range, Time } from "lightweight-charts";
import { defineStore } from "pinia";
import { useSessionsStore } from "./sessions.store";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { VISIBLE_MINUTES } from "../constants";
import { Event } from "../interfaces";
import { db } from "../firebase/firebaseInit";
import { DatabaseReference, ref as dbRef, set } from "firebase/database";
dayjs.extend(duration);

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
    oxymetryEvents: [] as Event[],
    respiratoryEvents: [] as Event[],
  }),
  getters: {
    allRendered: (state) => {
      return state.oxymetryChartRendered && state.stateChartRendered && state.audioChartRendered && state.minimapChartRendered && state.respiratoryChartRendered;
    },
    selectionRangeDuration: (state) => {
      if (!state.selection.range?.to || !state.selection.range?.from) return VISIBLE_MINUTES + " min";
      const duration = dayjs.duration(Number(state.selection.range.to) - Number(state.selection.range.from));
      return `${duration.hours() ? duration.hours() + "h " : ""} ${duration.minutes() ? duration.minutes() + "m " : ""} ${
        duration.seconds() ? duration.seconds() + "s" : ""
      }`;
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
    setEventType(event: Event, type: number, path: string) {
      event.eventType = type;
      const ref: DatabaseReference = dbRef(db, path);
      set(ref, event);
    },
  },
});
