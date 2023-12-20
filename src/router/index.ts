/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import Home from "../views/Home.vue";
import { useSessionsStore, useUsersStore } from "../store";

const routes = [
  {
    path: "/",
    component: Home,
    meta: {
      requiresAuth: true,
    },
    beforeEnter: async () => {
      const sessionsStore = useSessionsStore();
      sessionsStore.fetchAllPatients();
    },
    children: [
      {
        path: "",
        meta: {
          requiresAuth: true,
        },
        name: "sessionSummary",
        component: () => import("../views/SessionSummary.vue"),
      },
      {
        path: "/session/:sessionId",
        meta: {
          requiresAuth: true,
          transition: "slide",
        },
        name: "session",
        component: () => import("../views/Session.vue"),
        props: true,
      },
      {
        path: "/sessionSummary/:sessionId",
        meta: {
          requiresAuth: true,
        },
        name: "sessionSummary",
        component: () => import("../views/SessionSummary.vue"),
      },
    ],
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

router.beforeEach(async (to, from, next) => {
  const usersStore = useUsersStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth) {
    const user = await usersStore.getCurrentUser();
    if (user) {
      usersStore.userId = user.uid;
      next();
    } else {
      next({ name: "login", query: { redirectFrom: to.fullPath } });
    }
  } else {
    next();
  }
});
export default router;
