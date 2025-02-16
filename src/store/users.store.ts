import { defineStore } from "pinia";
import { useLocalStorage, useStorage } from "@vueuse/core";
import {
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { ref, get, child, set as firebaseSet } from "firebase/database"; // Importar set correctamente
import { useMessagesStore } from "./messages.store";
import { auth, db } from "../firebase/firebaseInit";
import { User } from "../interfaces";
import i18n from "../i18n";
const { t } = i18n.global;

// Función para detectar si estamos en un WebView
function isWebView(): boolean {
  return (
    // Verificar si navigator.standalone existe antes de usarlo
    (typeof window !== "undefined" &&
      window.navigator &&
      "standalone" in window.navigator &&
      (window.navigator as any).standalone) ||

    // Detectar WebViews generales usando webkit
    (typeof window !== "undefined" && "webkit" in window && (window as any).webkit !== undefined) ||

    // Algunos WebViews no exponen outerWidth
    (typeof window !== "undefined" && !window.outerWidth) ||

    // Algunos WebViews incluyen "wv" en el User-Agent
    (navigator.userAgent && navigator.userAgent.includes("wv")) ||

    // Detectar WebViews basados en AppleWebKit pero no Safari
    (navigator.userAgent &&
      !navigator.userAgent.includes("Safari") &&
      navigator.userAgent.includes("AppleWebKit"))
  );
}

export const useUsersStore = defineStore("Users", {
  state: () => ({
    userToken: useLocalStorage<string>("token", ""),
    userId: useStorage<string>("userId", "", sessionStorage),
    userIsProfessional: false,
    user: useLocalStorage<User | null>("user", null, {
      serializer: {
        read: (v: string) => (v ? JSON.parse(v) : null),
        write: (v: User) => JSON.stringify(v),
      },
    }),
    authToken: "",
    loading: true, // Bandera para manejar el estado de carga
  }),
  getters: {
    userInitials(): string {
      if (!this.user) return "";
      return this.user.name[0] + this.user.lastName[0];
    },
    isAdmin(): boolean {
      return this.userId === "snv5CHpk48VEeWHp7PHnNsoBpYB2" || this.userId === "W3kgbH7b6ueZImJwiNqtMXUA4Ni1";
    },
    canEdit(): boolean {
      return this.isAdmin;
    },
    isProfessional(): boolean {
      return this.userIsProfessional;
    },
  },
  actions: {
    async initializeUser() {
      this.loading = true;

      try {
        await new Promise<void>((resolve) => {
          onAuthStateChanged(auth, async (user) => {
            if (user) {
              this.userId = user.uid;

              // Obtener datos del usuario desde Firebase
              const userData = await this.getUserFromDatabase(this.userId);
              if (userData) {
                this.$patch({
                  userIsProfessional: Boolean(userData["IsProfessional"] ?? false),
                });
              }
            }
            resolve();
          });
        });
      } catch (error) {
        console.error("Error al inicializar el usuario:", error);
      } finally {
        this.loading = false;
      }
    },

    async loginUserWithEmailAndPassword(email: string, password: string, rememberMe: boolean) {
      const messagesStore = useMessagesStore();

      // Detectar si estamos en un WebView
      const isWebViewEnvironment = isWebView();

      // Configurar la persistencia según el entorno
      const persistenceType = isWebViewEnvironment
        ? inMemoryPersistence
        : rememberMe
        ? browserLocalPersistence
        : inMemoryPersistence;

      try {
        await setPersistence(auth, persistenceType);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.userId = userCredential.user.uid;

        // Obtener datos del usuario desde Firebase
        const userData = await this.getUserFromDatabase(this.userId);
        if (userData) {
          this.$patch({
            userIsProfessional: Boolean(userData["IsProfessional"] ?? false),
          });
        } else {
          console.warn("⚠️ No se pudieron obtener los datos del usuario.");
          this.$patch({ userIsProfessional: false });
        }

        return userCredential.user;
      } catch (error: any) {
        switch (error.code) {
          case "auth/invalid-email":
          case "auth/wrong-password":
            messagesStore.setErrorMessage(t("wrong-email"));
            break;
          case "auth/too-many-requests":
            messagesStore.setErrorMessage(t("too-many-requests"));
            break;
          default:
            messagesStore.setErrorMessage(error.message);
            break;
        }
        return null;
      }
    },

    createUserOnDatabase(userId: string, name: string, surname: string, email: string) {
      const user: User = {
        name: name,
        lastName: surname,
        email: email,
        Credit: "100",
        userID: userId,
      } as User;

      return firebaseSet(ref(db, "users/" + userId), user); // Usar firebaseSet en lugar de set
    },

    getUserFromDatabase(userId: string) {
      const dbRef = ref(db);
      return get(child(dbRef, "users/" + userId))
        .then((snapshot) => {
          if (snapshot.exists()) {
            return snapshot.val();
          } else {
            console.warn("⚠️ El usuario no existe en la base de datos.");
            return null;
          }
        })
        .catch((error) => {
          console.error("Error al obtener datos del usuario:", error);
          return null;
        });
    },

    async makeLogin(token: string, userId: string, rememberMe: boolean) {
      if (rememberMe) {
        this.userToken = token;
      }
      sessionStorage.setItem("userToken", token);
      this.userId = userId;

      // Obtener información del usuario desde Firebase
      const userData = await this.getUserFromDatabase(userId);
      if (userData) {
        this.$patch({
          userIsProfessional: Boolean(userData["IsProfessional"] ?? false),
        });
      }
    },

    async getCurrentUser() {
      return new Promise<FirebaseUser | null>((resolve, reject) => {
        onAuthStateChanged(
          auth,
          (user) => {
            resolve(user);
          },
          () => {
            reject();
          },
        );
      });
    },
  },
});