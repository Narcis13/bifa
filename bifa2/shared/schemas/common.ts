import { z } from 'zod'

export const TIPURI_MATERIAL = ['M', 'OB', 'MF'] as const
export const STARI_MATERIAL = ['NOU', 'FOLOSIT', 'CASARE'] as const
export type TipMaterial = (typeof TIPURI_MATERIAL)[number]
export type StareMaterial = (typeof STARI_MATERIAL)[number]

export const DENUMIRI_TIP_MATERIAL: Record<TipMaterial, string> = {
  M: 'Materiale',
  OB: 'Obiecte de inventar',
  MF: 'Mijloace fixe',
}

export const id = z.coerce.number().int().positive({ message: 'Identificator invalid' })
export const idParam = z.object({ id })

/** ISO date (YYYY-MM-DD). */
export const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dată invalidă (format AAAA-LL-ZZ)')

/** Positive decimal string with at most `scale` decimals, e.g. quantities (2) and prices (4). */
export const zecimal = (scale: number, label: string) =>
  z.union([z.string(), z.number()])
    .transform(v => String(v).trim().replace(',', '.'))
    .refine(v => new RegExp(String.raw`^\d{1,10}(\.\d{1,${scale}})?$`).test(v), `${label}: maxim ${scale} zecimale`)

export const tipMaterial = z.enum(TIPURI_MATERIAL, { message: 'Tip material invalid' })
export const stareMaterial = z.enum(STARI_MATERIAL, { message: 'Stare material invalidă' })
export const stare = z.enum(['activ', 'inactiv'])
