import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useMessagesStore } from "./messages.store";
import { auth, db } from "../firebase/firebaseInit";
import { child, get, ref, set } from "firebase/database";
import { User } from "../interfaces";
import { User as FireUser } from "firebase/auth";

export const useUsersStore = defineStore("Users", {
  state: () => ({
    userToken: useLocalStorage<string>("token", ""),
    userId: "",
    user: useLocalStorage<FireUser | null>("user", null, {
      serializer: {
        read: (v: string) => (v ? JSON.parse(v) : null),
        write: (v: FireUser) => JSON.stringify(v),
      },
    }),
  }),
  getters: {},
  actions: {
    loginUserWithEmailAndPassword(email: string, password: string) {
      const messagesStore = useMessagesStore();
      return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          this.user = userCredential.user;
          return userCredential.user;
        })
        .catch((error) => {
          messagesStore.setErrorMessage(error.message);
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
      };
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
