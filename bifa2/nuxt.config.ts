import { ro } from 'primelocale/js/ro.js'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@primevue/nuxt-module', 'nuxt-auth-utils'],
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: 'ro' },
      title: 'BIFA – Gestiune',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  runtimeConfig: {
    mysql: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bifa2',
    },
  },
  compatibilityDate: '2026-10-01',
  typescript: { strict: true },
  eslint: { config: { stylistic: true } },
  primevue: {
    importTheme: { from: '~/theme/preset.ts' },
    options: {
      ripple: false,
      locale: ro,
    },
  },
})
