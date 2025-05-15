import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Forms',
    path: '/fb',
    component: () => import('layouts/FormBuilder.vue'),
    children: [
      { path: '', component: () => import('pages/FormBuilder/IndexPage.vue') },
      { path: 'files', component: () => import('pages/FormBuilder/FilesPage.vue') }
    ],

  },
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'signup', component: () => import('pages/SignupPage.vue') },
      { name: 'login', path: 'login', component: () => import('pages/LoginPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ]
  }
];

export default routes;
