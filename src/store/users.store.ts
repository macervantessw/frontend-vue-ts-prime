import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useMessagesStore } from "./messages.store";
import { auth } from "../firebase/firebaseInit";

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
