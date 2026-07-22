import { createRouter, createWebHistory } from 'vue-router';
import RequireSession from './routes/RequireSession.vue';
import DashboardView from './routes/DashboardView.vue';
import LoginView from './routes/LoginView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    {
      path: '/dashboard',
      component: RequireSession,
      children: [ { path: '', component: DashboardView } ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
});
