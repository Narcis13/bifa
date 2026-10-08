import { z } from 'zod'
import { stare } from './common'

const campuri = {
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(45, 'Maxim 45 de caractere'),
  prioritate: z.coerce.number().int('Prioritatea trebuie să fie un număr întreg').min(0).max(999),
  stare,
}

export const locSchema = z.object({
  ...campuri,
  prioritate: campuri.prioritate.default(1),
  stare: stare.default('activ'),
})
export type LocInput = z.infer<typeof locSchema>

/** PATCH: only the fields sent are changed (no defaults, which zod 4 would apply to missing keys). */
export const locPatchSchema = z.object(campuri).partial()

export const locuriQuery = z.object({
  stare: stare.optional(),
})
