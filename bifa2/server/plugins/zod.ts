import { z } from 'zod'

/** Romanian default messages for validation errors not covered by a custom message. */
export default defineNitroPlugin(() => {
  z.config(z.locales.ro())
})
