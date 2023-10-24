/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import PatientSessions from "../views/PatientSessions.vue";
import Home from "../views/Home.vue";
import { useSessionsStore } from "../store";

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
  {
    path: "/home",
    name: "home",
    component: Home,
    beforeEnter: async () => {
      const sessionsStore = useSessionsStore();
      sessionsStore.fetchAllPatients();
    },
  },
  {
    path: "/patientSessions/:patientId",
    name: "patientSessions",
    component: PatientSessions,
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
    component: Signup,
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  {
    path: "/forgotPassword",
    name: "ForgotPassword",
    component: ForgotPassword,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
