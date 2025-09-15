import { createRouter, createWebHistory } from "vue-router";
import LongData from "../views/LongData.vue";
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Long",
      component: LongData,
    },
    {
      path: "/short",
      name: "Short",
      component: () => import("../views/ShortData.vue"),
      props: true, // Pass route params as props
    },
    {
      path: "/test",
      name: "Test",
      component: () => import("../views/TestPage.vue"),
    },
  ],
});
export default router;
