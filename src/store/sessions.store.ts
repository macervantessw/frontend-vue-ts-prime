import { defineStore } from "pinia";
import { useUsersStore } from "./users.store";
import { ref as fireRef, listAll, StorageReference } from "firebase/storage";
import { storage } from "../firebase/firebaseInit";

export const useSessionsStore = defineStore("Session", {
  state: () => ({
    patients: [] as string[],
  }),
  getters: {},
  actions: {
    fetchAllPatients() {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const patientsRef = fireRef(storage, `Sessions/${usersStore.userId}`);
        listAll(patientsRef).then((res) => {
          this.patients = res.prefixes.map((folderRef) => folderRef.name);
        });
      }
    },
    async fetchPatientSessions(patientId: string): Promise<StorageReference[]> {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const sessionRef = fireRef(storage, `Sessions/${usersStore.userId}/${patientId}`);
        const list = await listAll(sessionRef);
        return list.items.filter((itemRef) => itemRef.name.endsWith("_R.zip"));
      }
      return [];
    },
    async fetchSessionFile(patientId: string, fileName: string): Promise<StorageReference | null> {
      const usersStore = useUsersStore();
      if (usersStore.userId) {
        const sessionRef = fireRef(storage, `Sessions/${usersStore.userId}/${patientId}/${fileName}`);
        return sessionRef;
      }
      return null;
    },
  },
});
