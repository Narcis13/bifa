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
  css: ['primeicons/primeicons.css', '~/assets/css/main.css', '~/assets/css/print.css'],
  runtimeConfig: {
    // sealed session cookie (nuxt-auth-utils): expires after 12 hours
    session: { maxAge: 60 * 60 * 12 },
    mysql: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bifa2',
    },
  },
  compatibilityDate: '2026-10-01',
  nitro: { esbuild: { options: { target: 'es2022' } } },
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
