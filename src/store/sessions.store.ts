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
      if (usersStore.user?.uid) {
        const sessionsRef = fireRef(storage, `Sessions/${usersStore.user.uid}`);
        listAll(sessionsRef).then((res) => {
          this.sessions = res.prefixes.map((folderRef) => folderRef.name);
        });
      }
    },
  },
});
