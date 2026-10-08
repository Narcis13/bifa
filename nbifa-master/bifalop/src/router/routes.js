
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'a', component: () => import('pages/Angajamente.vue') },
      { path: 'l', component: () => import('pages/Lichidari.vue') },
      { path: 'f', component: () => import('pages/Furnizori.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
