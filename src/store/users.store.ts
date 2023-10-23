import { defineStore } from "pinia";
import { useLocalStorage, useStorage } from "@vueuse/core";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useMessagesStore } from "./messages.store";
import { auth, db } from "../firebase/firebaseInit";
import { child, get, ref, set } from "firebase/database";
import { User } from "../interfaces";
import i18n from "../i18n";

const { t } = i18n.global;
export const useUsersStore = defineStore("Users", {
  state: () => ({
    userToken: useLocalStorage<string>("token", ""),
    userId: useStorage<string>("userId", "", sessionStorage),
    user: useLocalStorage<User | null>("user", null, {
      serializer: {
        read: (v: string) => (v ? JSON.parse(v) : null),
        write: (v: User) => JSON.stringify(v),
      },
    }),
  }),
  getters: {},
  actions: {
    loginUserWithEmailAndPassword(email: string, password: string) {
      const messagesStore = useMessagesStore();
      return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          this.userId = userCredential.user.uid;
          return userCredential.user;
        })
        .catch((error) => {
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
        });
    },

    createUserOnDatabase(userId: string, name: string, surname: string, email: string) {
      const user: User = {
        name: name,
        lastName: surname,
        email: email,
        Credit: "100",
        userID: userId,
      } as User;
      return set(ref(db, "users/" + userId), user);
    },

    getUserFromDatabase(userId: string) {
      const dbRef = ref(db);
      return get(child(dbRef, "users/" + userId))
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

    async makeLogin(token: string, userId: string, rememberMe: boolean) {
      if (rememberMe) {
        this.userToken = token;
      }
      sessionStorage.setItem("userToken", token);
      this.userId = userId;
      // Get user information from firebase
      //his.user = await this.getUserInformation(userId);
    },
  },
});
