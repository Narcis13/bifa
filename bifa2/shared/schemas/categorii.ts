import { z } from 'zod'
import { id, stare, tipMaterial } from './common'

const baza = {
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(255, 'Denumire: maxim 255 de caractere'),
  idgestiune: id,
  tipmaterial: tipMaterial,
  idcont: id.nullish(),
  idcontchelt: id.nullish(),
  info: z.string().trim().max(255, 'Informații: maxim 255 de caractere').transform(v => (v === '' ? null : v)).nullish(),
}

export const categorieNoua = z.object({
  ...baza,
  tipmaterial: tipMaterial.default('M'),
  stare: stare.default('activ'),
})
export type CategorieNoua = z.infer<typeof categorieNoua>

export const categorieModificata = z.object({ ...baza, stare: stare.optional() }).partial()
export type CategorieModificata = z.infer<typeof categorieModificata>

export const categoriiQuery = z.object({
  idgestiune: id.optional(),
  tipmaterial: tipMaterial.optional(),
  stare: stare.optional(),
})
export type CategoriiQuery = z.infer<typeof categoriiQuery>
