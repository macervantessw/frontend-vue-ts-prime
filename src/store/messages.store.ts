import { defineStore } from "pinia";

export interface ToastMessage {
  message: string;
  severity: "success" | "info" | "error" | "warn" | undefined;
}
export const useMessagesStore = defineStore({
  id: "messages",
  state: () => ({
    toastMessage: {} as ToastMessage,
  }),
  actions: {
    setErrorMessage(message: string) {
      this.toastMessage = { message: message, severity: "error" };
    },
    setSuccessMessage(message: string) {
      this.toastMessage = { message: message, severity: "success" };
    },
    setWarningMessage(message: string) {
      this.toastMessage = { message: message, severity: "warn" };
    },
  },
});
