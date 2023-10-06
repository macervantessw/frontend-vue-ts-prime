import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
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
      sessionsStore.fetchAllSessions();
    },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
