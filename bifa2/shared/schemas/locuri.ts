import { z } from 'zod'
import { stare } from './common'

export const locSchema = z.object({
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(45, 'Maxim 45 de caractere'),
  prioritate: z.coerce.number().int('Prioritatea trebuie să fie un număr întreg').min(0).max(999).default(1),
  stare: stare.default('activ'),
})
export type LocInput = z.infer<typeof locSchema>

export const locuriQuery = z.object({
  stare: stare.optional(),
})
