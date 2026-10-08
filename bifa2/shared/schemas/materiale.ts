import { z } from 'zod'
import { id, stare, zecimal } from './common'

export const UM_UZUALE = ['buc', 'kg', 'l', 'm', 'set', 'top', 'cutie', 'flacon', 'pachet'] as const

/** Editable fields (no defaults: the PATCH schema is a plain `.partial()` of this). */
const campuri = {
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(100, 'Maxim 100 de caractere'),
  um: z.string().trim().min(1, 'Unitatea de măsură este obligatorie').max(15, 'Maxim 15 caractere'),
  pretpredefinit: zecimal(4, 'Preț'),
  /** Empty string means "no import code". */
  cod_import: z.string().trim().max(45, 'Maxim 45 de caractere').transform(v => (v === '' ? null : v)).nullish(),
  stare,
}

export const materialSchema = z.object({
  idgestiune: id,
  denumire: campuri.denumire,
  um: campuri.um.default('buc'),
  pretpredefinit: campuri.pretpredefinit.default('0'),
  cod_import: campuri.cod_import,
  stare: campuri.stare.default('activ'),
})
export type MaterialInput = z.infer<typeof materialSchema>

/** Fields of the edit form (the gestiune of a material never changes). */
export const materialPatchSchema = z.object(campuri).partial()
export type MaterialPatch = z.infer<typeof materialPatchSchema>

export const SORT_FIELDS = ['id', 'denumire', 'um', 'pretpredefinit', 'cod_import', 'creat_de', 'stare'] as const
export type SortFieldMateriale = (typeof SORT_FIELDS)[number]

export const materialeQuery = z.object({
  idgestiune: id,
  q: z.string().trim().max(100).optional(),
  stare: z.enum(['activ', 'inactiv', 'toate']).default('activ'),
  page: z.coerce.number().int().min(1).default(1),
  rows: z.coerce.number().int().min(1).max(200).default(20),
  sortField: z.enum(SORT_FIELDS).default('denumire'),
  /** PrimeVue convention: 1 ascending, -1 descending. */
  sortOrder: z.coerce.number().pipe(z.union([z.literal(1), z.literal(-1)])).default(1),
})
export type MaterialeQuery = z.infer<typeof materialeQuery>

export const duplicateQuery = z.object({
  idgestiune: id,
  denumire: z.string().trim().min(1).max(100),
  /** Material being edited (excluded from the comparison). */
  excludeId: id.optional(),
})

export const ultimulCodQuery = z.object({ idgestiune: id })

export interface MaterialRow {
  id: number
  denumire: string
  um: string
  pretpredefinit: string
  idgestiune: number
  iduser: number
  cod_import: string | null
  stare: 'activ' | 'inactiv'
  creat_de: string | null
  created_at: string
  updated_at: string
}

export interface MaterialRezultat {
  material: MaterialRow
  avertismente: string[]
}
