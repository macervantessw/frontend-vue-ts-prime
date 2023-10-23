/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouter, createWebHistory } from "vue-router";
import { useSessionsStore } from "../store";

const routes = [
  {
    path: "/",
    name: "Login",
    component: import("../views/Login.vue"),
  },
  {
    path: "/home",
    name: "home",
    component: import("../views/Home.vue"),
    beforeEnter: async () => {
      const sessionsStore = useSessionsStore();
      sessionsStore.fetchAllPatients();
    },
  },
  {
    path: "/patientSessions/:patientId",
    name: "patientSessions",
    component: import("../views/PatientSessions.vue"),
  },
  {
    path: "/session/:sessionId",
    name: "session",
    component: () => import("../views/Session.vue"),
    props: true,
  },
  {
    path: "/signup",
    name: "signup",
    component: import("../views/Signup.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: import("../views/Login.vue"),
  },
  {
    path: "/forgotPassword",
    name: "ForgotPassword",
    component: import("../views/ForgotPassword.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
