import { defineStore } from "pinia";
import { useUsersStore } from "./users.store";
import { ref as fireRef, listAll } from "firebase/storage";
import { storage } from "../firebase/firebaseInit";

export const useSessionsStore = defineStore("Session", {
  state: () => ({
    sessions: [] as string[],
  }),
  getters: {},
  actions: {
    fetchAllSessions() {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const sessionsRef = fireRef(storage, `Sessions/${usersStore.userId}`);
        listAll(sessionsRef).then((res) => {
          this.sessions = res.prefixes.map((folderRef) => folderRef.name);
        });
      }
    },
    async fetchSessionFiles(sessionId: string): Promise<string[]> {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const sessionRef = fireRef(storage, `Sessions/${usersStore.userId}/${sessionId}`);
        const list = await listAll(sessionRef);
        return list.items.map((itemRef) => itemRef.name);
      }
      return [];
    },
  },
});
