import { z } from 'zod'

/** Romanian default messages for client-side validation (same schemas as the server). */
export default defineNuxtPlugin(() => {
  z.config(z.locales.ro())
})
