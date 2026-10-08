import { z } from 'zod'
import { id, stare } from './common'

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: maxim ${max} de caractere`).transform(v => (v === '' ? null : v)).nullish()

const baza = {
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(255, 'Denumire: maxim 255 de caractere'),
  userid: id.nullish(),
  gestionar: text(70, 'Gestionar'),
  r_presedinte: text(255, 'Președinte comisie recepție'),
  r_membru1: text(255, 'Membru 1 comisie recepție'),
  r_membru2: text(255, 'Membru 2 comisie recepție'),
  r_membru3: text(255, 'Membru 3 comisie recepție'),
  i_presedinte: text(255, 'Președinte comisie inventariere'),
  i_membru1: text(255, 'Membru 1 comisie inventariere'),
  i_membru2: text(255, 'Membru 2 comisie inventariere'),
  i_membru3: text(255, 'Membru 3 comisie inventariere'),
}

export const gestiuneNoua = z.object({ ...baza, stare: stare.default('activ') })
export type GestiuneNoua = z.infer<typeof gestiuneNoua>

export const gestiuneModificata = z.object({ ...baza, stare: stare.optional() }).partial()
export type GestiuneModificata = z.infer<typeof gestiuneModificata>

export const gestiuniQuery = z.object({
  stare: stare.optional(),
})
