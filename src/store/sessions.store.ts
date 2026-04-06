import { defineStore } from "pinia";
import { useUsersStore } from "./users.store";
import { ref as storageRef, getDownloadURL, listAll, StorageReference } from "firebase/storage";
import { ref as dbRef, get, child, DatabaseReference } from "firebase/database";
import app, { db, storage } from "../firebase/firebaseInit";
import { Session, SessionResponse } from "../interfaces";
import { useLocalStorage } from "@vueuse/core";
import { useMessagesStore } from "./messages.store";
import axios from "axios";
import i18n from "../i18n";


function normalizeNumericValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}

function normalizeEvent(event: any) {
  if (!event || typeof event !== "object") return event;

  return {
    ...event,
    eventType: normalizeNumericValue(event.eventType),
    startTime: normalizeNumericValue(event.startTime),
    endTime: normalizeNumericValue(event.endTime),
    sampleIndex: normalizeNumericValue(event.sampleIndex),
  };
}

function normalizeEventList(events: any) {
  if (!Array.isArray(events)) return events;
  return events.map((event) => normalizeEvent(event));
}

function normalizeSession(s: any) {
  const raw = s.SessionIsValid;

  let normalized: number | null;

  if (raw === 0 || raw === 1) {
    // Ya es un número correcto
    normalized = raw;
  } else if (raw === "0") {
    normalized = 0;
  } else if (raw === "1") {
    normalized = 1;
  } else if (raw === true) {
    normalized = 1;
  } else if (raw === false) {
    normalized = 0;
  } else {
    normalized = null; // no definido / desconocido
  }

  return {
    ...s,
    Data: s?.Data
      ? {
          ...s.Data,
          RespiratoryEvents: normalizeEventList(s.Data.RespiratoryEvents),
          SnoringEvents: normalizeEventList(s.Data.SnoringEvents),
          StateEvents: normalizeEventList(s.Data.StateEvents),
          MovementEvents: normalizeEventList(s.Data.MovementEvents),
        }
      : s?.Data,
    SessionIsValid: normalized,
  };
}



const { t } = i18n.global;
export const useSessionsStore = defineStore("Session", {
  state: () => ({
    patients: [] as string[],
    sessions: [] as Session[],
    selectedSession: useLocalStorage<Session | null>("selectedSession", null, {
  serializer: {
    read: (v: string): Session | null => (v ? (normalizeSession(JSON.parse(v)) as Session) : null),
    write: (v: Session | null): string => (v ? JSON.stringify(v) : ""),
  },
}),


  }),

  actions: {
    // fetchAllPatients() {
    //   const usersStore = useUsersStore();
    //   if (usersStore.userId) {
    //     const patientsRef = fireRef(storage, `Sessions/${usersStore.userId}`);
    //     listAll(patientsRef).then((res) => {
    //       this.patients = res.prefixes.map((folderRef) => folderRef.name);
    //     });
    //   }
    // },
    async fetchPatientSessions(patientId: string): Promise<StorageReference[]> {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const sessionRef = storageRef(storage, `Sessions/${usersStore.userId}/${patientId}`);
        const list = await listAll(sessionRef);
        return list.items.filter((itemRef) => itemRef.name.endsWith("_R.zip"));
      }
      return [];
    },
    async fetchSessionFile(deviceId: string, sessionId: string, userId?: string): Promise<StorageReference | undefined> {
      const usersStore = useUsersStore();
      if (!userId) userId = usersStore.userId;
      if (userId) {
        const sessionRef = storageRef(storage, `Sessions/${userId}/${deviceId}`);
        const list = await listAll(sessionRef);
        return list.items.find((itemRef) => itemRef.name === `${sessionId}_R.zip`);
      }
      return undefined;
    },
    async fetchSessionVideo(deviceId: string, sessionId: string, userId?: string) {
      const usersStore = useUsersStore();
      if (!userId) userId = usersStore.userId;
      if (userId) {
        const sessionRef = storageRef(storage, `Sessions/${userId}/${deviceId}`);
        const list = await listAll(sessionRef);
        const videoRef = list.items.find((itemRef) => itemRef.name === `${sessionId}_M.mp4`);
        if (!videoRef) return undefined;
        const downloadURL = await getDownloadURL(videoRef);
        return downloadURL;
      }
      return undefined;
    },
    /*async fetchAllSessions(): Promise<void> {
      const messagesStore = useMessagesStore();
      const usersStrore = useUsersStore();
      const ref: DatabaseReference = dbRef(db);
      if (usersStrore.isAdmin) {
        if (usersStrore.authToken) {
          axios
            .get(`${app.options.databaseURL}/users.json?auth=${usersStrore.authToken}`)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((response: any) => {
              response = response.data;
              for (const user in response) {
                if (response[user].Sessions) {
                  const res = response[user].Sessions;
                  const sessions = Object.keys(res).map((key) => {
                    return { ...res[key], DeviceId: key.split("\\")[0], SessionId: key.split("\\")[1], userId: user };
                  });
                  this.sessions.push(...sessions);
                }
              }
            })
            .catch((error) => messagesStore.setErrorMessage(t(error.response.data.error ?? error.code)));
        } else {
          get(child(ref, `users/`))
            .then((snapshot) => {
              if (snapshot.exists()) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response: any = snapshot.val();
                for (const user in response) {
                  if (response[user].Sessions) {
                    const res = response[user].Sessions;
                    const sessions = Object.keys(res).map((key) => {
                      return { ...res[key], DeviceId: key.split("\\")[0], SessionId: key.split("\\")[1], userId: user };
                    });
                    this.sessions.push(...sessions);
                  }
                }
              } else console.log("No data available");
            })
            .catch((error) => console.error(error));
        }
      } else {
        if (usersStrore.authToken && usersStrore.userId) {
          axios
            .get(`${app.options.databaseURL}/users/${usersStrore.userId}/Sessions.json?auth=${usersStrore.authToken}`)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((response: any) => {
              response = response.data;
              console.log("sessions", response);
              this.sessions = Object.keys(response).map((key) => {
                return { ...response[key], DeviceId: key.split("\\")[0], SessionId: key.split("\\")[1], userId: usersStrore.userId };
              });
            })
            .catch((error) => messagesStore.setErrorMessage(t(error.response.data.error ?? error.code)));
        } else {
          get(child(ref, `users/${usersStrore.userId}/Sessions/`))
            .then((snapshot) => {
              if (snapshot.exists()) {
                const response: SessionResponse = snapshot.val();
                this.sessions = Object.keys(response).map((key) => {
                  return { ...response[key], DeviceId: key.split("\\")[0], SessionId: key.split("\\")[1], userId: usersStrore.userId };
                });
              } else console.log("No data available");
            })
            .catch((error) => console.error(error));
        }
      }
    },*/
async fetchAllSessions(): Promise<void> {
  const messagesStore = useMessagesStore();
  const usersStrore = useUsersStore();
  const ref: DatabaseReference = dbRef(db);

  // ============================================================
  // ADMIN (isAdmin = true)
  // ============================================================
  if (usersStrore.isAdmin) {

    // ---------------- ADMIN con authToken (axios) ----------------
    if (usersStrore.authToken) {
      axios
        .get(`${app.options.databaseURL}/users.json?auth=${usersStrore.authToken}`)
        .then((response: any) => {
          response = response.data;

          for (const user in response) {
            if (response[user].Sessions) {
              const res = response[user].Sessions;

              const sessions = Object.keys(res).map((key) => {
                const raw = {
                  ...res[key],
                  DeviceId: key.split("\\")[0],
                  SessionId: key.split("\\")[1],
                  userId: user,
                };

                return normalizeSession(raw); // ⭐ NORMALIZAMOS
              });

              this.sessions.push(...sessions);
            }
          }
        })
        .catch((error) =>
          messagesStore.setErrorMessage(t(error.response.data.error ?? error.code))
        );

      return;
    }

    // ---------------- ADMIN sin authToken (Realtime Database) ----------------
    get(child(ref, `users/`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const response: any = snapshot.val();

          for (const user in response) {
            if (response[user].Sessions) {
              const res = response[user].Sessions;

              const sessions = Object.keys(res).map((key) => {
                const raw = {
                  ...res[key],
                  DeviceId: key.split("\\")[0],
                  SessionId: key.split("\\")[1],
                  userId: user,
                };

                return normalizeSession(raw); // ⭐ NORMALIZAMOS
              });

              this.sessions.push(...sessions);
            }
          }

        } else {
          console.log("No data available");
        }
      })
      .catch((error) => console.error(error));

    return;
  }

  // ============================================================
  // USUARIO NORMAL (isAdmin = false)
  // ============================================================

  // ---------------- USER con authToken (axios) ----------------
  if (usersStrore.authToken && usersStrore.userId) {
    axios
      .get(`${app.options.databaseURL}/users/${usersStrore.userId}/Sessions.json?auth=${usersStrore.authToken}`)
      .then((response: any) => {
        response = response.data;

        this.sessions = Object.keys(response).map((key) => {
          const raw = {
            ...response[key],
            DeviceId: key.split("\\")[0],
            SessionId: key.split("\\")[1],
            userId: usersStrore.userId,
          };

          return normalizeSession(raw); // ⭐ NORMALIZAMOS
        });
      })
      .catch((error) =>
        messagesStore.setErrorMessage(t(error.response.data.error ?? error.code))
      );

    return;
  }

  // ---------------- USER sin authToken (Realtime Database) ----------------
  get(child(ref, `users/${usersStrore.userId}/Sessions/`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const response: SessionResponse = snapshot.val();

        this.sessions = Object.keys(response).map((key) => {
          const raw = {
            ...response[key],
            DeviceId: key.split("\\")[0],
            SessionId: key.split("\\")[1],
            userId: usersStrore.userId,
          };

          return normalizeSession(raw); // ⭐ NORMALIZAMOS
        });
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => console.error(error));
},

    async fetchSessionInfo(userId: string, patientId: string, sessionId: string): Promise<Session> {
      const ref: DatabaseReference = dbRef(db);
      //PERQUE NO ES UN PATH??
      return get(child(ref, `users/${userId}/Sessions/${patientId}\\${sessionId}\\`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            return normalizeSession(snapshot.val());
          } else {
            return null;
          }
        })
        .catch((error) => {
          console.error(error);
          return null;
        });
    },
  },
});
