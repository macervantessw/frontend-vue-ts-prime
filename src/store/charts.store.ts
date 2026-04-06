import { Range, Time } from "lightweight-charts";
import { defineStore } from "pinia";
import { useSessionsStore } from "./sessions.store";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { RESPIRATORY_EVENTS, VISIBLE_MINUTES } from "../constants";
import { Event } from "../interfaces";
import { db } from "../firebase/firebaseInit";
import { DatabaseReference, child, ref as dbRef, get, set } from "firebase/database";
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
    cannulaChartRendered: true,
    oxymetryEvents: [] as Event[],
    respiratoryEvents: [] as Event[],
  }),
  getters: {
    allRendered: (state) => {
      return state.oxymetryChartRendered && state.stateChartRendered && state.audioChartRendered && state.minimapChartRendered && state.respiratoryChartRendered && state.cannulaChartRendered;
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
      this.cannulaChartRendered = true;
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
    setEvents(events: Event[], path: string) {
      const ref: DatabaseReference = dbRef(db, path);
      set(ref, events);
    },
    updateEvents() {
      const sessionsStore = useSessionsStore();
      const path = `/users/${sessionsStore.selectedSession?.userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionsStore.selectedSession?.SessionId}\\/Data/RespiratoryEvents`;
      const ref: DatabaseReference = dbRef(db);
      get(child(ref, path))
        .then((snapshot) => {
          if (snapshot.exists() && sessionsStore.selectedSession) {
            const events = snapshot.val() as Event[];
            sessionsStore.selectedSession.SessionCentralApneas = events.filter((ev) => Number(ev.eventType) === RESPIRATORY_EVENTS.EVENT_TYPE_CENTRAL_APNEA).length;
            sessionsStore.selectedSession.SessionNumRespEvents = events.filter((ev) => Number(ev.eventType) === RESPIRATORY_EVENTS.EVENT_TYPE_APNEA).length;
            sessionsStore.selectedSession.SessionIAH =
              "" +
              ((sessionsStore.selectedSession.SessionCentralApneas || 0) + (sessionsStore.selectedSession.SessionNumRespEvents || 0)) /
                (sessionsStore.selectedSession.SessionSleepTime / 3600);
            set(
              dbRef(
                db,
                `/users/${sessionsStore.selectedSession?.userId}/Sessions/${sessionsStore.selectedSession?.DeviceId}\\${sessionsStore.selectedSession?.SessionId}\\/`,
              ),
              sessionsStore.selectedSession,
            );
          } else {
            console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
});
