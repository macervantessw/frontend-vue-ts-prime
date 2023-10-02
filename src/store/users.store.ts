import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useMessagesStore } from "./messages.store";
import { auth, db } from "../firebase/firebaseInit";
import { ref, set } from "firebase/database";
import { User } from "../interfaces";

export const useUsersStore = defineStore("Users", {
  state: () => ({
    userToken: useLocalStorage<string>("urlCache", ""),
    userId: "",
    user: {},
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
          // ...
        })
        .catch((error) => {
          messagesStore.setErrorMessage(error.message);
        });
    },

    async createUserOnDatabase(userId: string, name: string, surname: string, email: string) {
      const user: User = {
        name: name,
        lastName: surname,
        email: email,
        Credit: "100",
        userID: userId,
      };
      set(ref(db, "users/" + userId), user);
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
