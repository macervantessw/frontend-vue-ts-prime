import { defineStore } from "pinia";
import { useUsersStore } from "./users.store";
import { ref as fireRef, getDownloadURL, listAll, StorageReference } from "firebase/storage";
import { ref as dbRef, get, child, DatabaseReference } from "firebase/database";
import app, { db, storage } from "../firebase/firebaseInit";
import { Session, SessionResponse } from "../interfaces";
import { useLocalStorage } from "@vueuse/core";
import { useMessagesStore } from "./messages.store";
import axios from "axios";
import i18n from "../i18n";

const { t } = i18n.global;
export const useSessionsStore = defineStore("Session", {
  state: () => ({
    showSessionAnalysis: false,
    patients: [] as string[],
    sessions: [] as Session[],
    selectedSession: useLocalStorage<Session | null>("selectedSession", null, {
      serializer: {
        read: (v: string) => (v ? JSON.parse(v) : null),
        write: (v: Session) => JSON.stringify(v),
      },
    }),
  }),
  getters: {},
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
        const sessionRef = fireRef(storage, `Sessions/${usersStore.userId}/${patientId}`);
        const list = await listAll(sessionRef);
        return list.items.filter((itemRef) => itemRef.name.endsWith("_R.zip"));
      }
      return [];
    },
    async fetchSessionFile(deviceId: string, sessionId: string, userId?: string): Promise<StorageReference | undefined> {
      const usersStore = useUsersStore();
      if (!userId) userId = usersStore.userId;
      if (userId) {
        const sessionRef = fireRef(storage, `Sessions/${userId}/${deviceId}`);
        const list = await listAll(sessionRef);
        return list.items.find((itemRef) => itemRef.name === `${sessionId}_R.zip`);
      }
      return undefined;
    },
    async fetchSessionVideo(deviceId: string, sessionId: string, userId?: string) {
      const usersStore = useUsersStore();
      if (!userId) userId = usersStore.userId;
      if (userId) {
        const sessionRef = fireRef(storage, `Sessions/${userId}/${deviceId}`);
        const list = await listAll(sessionRef);
        const videoRef = list.items.find((itemRef) => itemRef.name === `${sessionId}_M.mp4`);
        if (!videoRef) return undefined;
        const downloadURL = await getDownloadURL(videoRef);
        return downloadURL;
      }
      return undefined;
    },
    async fetchAllSessions(): Promise<void> {
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
    },

    async fetchSessionInfo(userId: string, patientId: string, sessionId: string): Promise<Session> {
      const ref: DatabaseReference = dbRef(db);
      //PERQUE NO ES UN PATH??
      return get(child(ref, `users/${userId}/Sessions/${patientId}\\${sessionId}\\`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            return snapshot.val();
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
