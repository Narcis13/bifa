import { z } from 'zod'
import { dataIso, id, stare } from './common'

export const STARI_MF = ['in_functiune', 'casat'] as const
export type StareMf = (typeof STARI_MF)[number]
export const DENUMIRI_STARI_MF: Record<StareMf, string> = {
  in_functiune: 'În funcțiune',
  casat: 'Casat',
}
export const GRAPE_MF = [1, 2, 3] as const
export const DENUMIRI_GRUPA_MF: Record<(typeof GRAPE_MF)[number], string> = {
  1: '1 – Construcții',
  2: '2 – Instalații tehnice, mijloace de transport, animale și plantații',
  3: '3 – Mobilier, aparatură birotică și alte active corporale',
}

const zecimalPozitiv = (scale: number, label: string) =>
  z.union([z.string(), z.number()])
    .transform(v => String(v).trim().replace(',', '.'))
    .refine(v => new RegExp(String.raw`^\d{1,10}(\.\d{1,${scale}})?$`).test(v), `${label}: maxim ${scale} zecimale`)
    .refine(v => Number(v) > 0, `${label} trebuie să fie mai mare decât zero`)

const zecimalNonNeg = (scale: number, label: string) =>
  z.union([z.string(), z.number()])
    .transform(v => String(v).trim().replace(',', '.'))
    .refine(v => new RegExp(String.raw`^\d{1,10}(\.\d{1,${scale}})?$`).test(v), `${label}: maxim ${scale} zecimale`)
    .refine(v => Number(v) >= 0, `${label} nu poate fi negativă`)

/** Registration of a new fixed asset (document tip `i`) + asset card. */
export const inregistrareMfSchema = z.object({
  idgestiune: id,
  idtipoperatiuni: id,
  data: dataIso,
  nrdoc: z.string().trim().min(1, 'Numărul documentului este obligatoriu').max(25),
  observatii: z.string().trim().max(255).optional(),
  nr_inventar: z.string().trim().min(1, 'Numărul de inventar este obligatoriu').max(45),
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(255),
  caracteristici: z.string().trim().max(500).optional(),
  idcateg: id,
  idloc: id,
  cod_clasificare: z.string().trim().min(1, 'Codul de clasificare este obligatoriu').max(30),
  grupa: z.coerce.number().int().refine(v => GRAPE_MF.includes(v as 1 | 2 | 3), 'Grupa trebuie să fie 1, 2 sau 3'),
  valoare_intrare: zecimalPozitiv(4, 'Valoarea de intrare'),
  /** Already amortized when bringing in a partially/fully amortized asset. */
  amortizare_initiala: zecimalNonNeg(4, 'Amortizarea cumulată').default('0'),
  /** Normal useful life in years (HG 2139/2004 catalog). Stored as months. */
  durata_ani: z.coerce.number().int().min(1, 'Durata minimă este 1 an').max(100, 'Durata maximă este 100 de ani'),
  data_punere_functiune: dataIso,
}).refine(v => Number(v.amortizare_initiala) <= Number(v.valoare_intrare), {
  message: 'Amortizarea cumulată nu poate depăși valoarea de intrare',
  path: ['amortizare_initiala'],
})
export type InregistrareMfInput = z.infer<typeof inregistrareMfSchema>

export const transferMfSchema = z.object({
  idgestiune: id,
  idtipoperatiuni: id,
  data: dataIso,
  nrdoc: z.string().trim().min(1, 'Numărul documentului este obligatoriu').max(25),
  observatii: z.string().trim().max(255).optional(),
  idloc_destinatie: id,
  idmijloace: z.array(id).min(1, 'Selectați cel puțin un mijloc fix').max(200),
})
export type TransferMfInput = z.infer<typeof transferMfSchema>

export const casareMfSchema = z.object({
  idgestiune: id,
  idtipoperatiuni: id,
  data: dataIso,
  nrdoc: z.string().trim().min(1, 'Numărul documentului este obligatoriu').max(25),
  observatii: z.string().trim().max(255).optional(),
  idmijloace: z.array(id).min(1, 'Selectați cel puțin un mijloc fix').max(200),
})
export type CasareMfInput = z.infer<typeof casareMfSchema>

export const amortizareMfSchema = z.object({
  idgestiune: id,
  an: z.coerce.number().int().min(1990).max(2100),
  luna: z.coerce.number().int().min(1).max(12),
  data_calcul: dataIso.optional(),
})
export type AmortizareMfInput = z.infer<typeof amortizareMfSchema>

export const listaMfQuery = z.object({
  idgestiune: id,
  q: z.string().trim().max(100).optional(),
  stare_mf: z.enum(['in_functiune', 'casat', 'toate']).default('in_functiune'),
  stare: z.enum(['activ', 'inactiv', 'toate']).default('activ'),
  idloc: id.optional(),
  idcateg: id.optional(),
  page: z.coerce.number().int().min(1).default(1),
  rows: z.coerce.number().int().min(1).max(200).default(50),
})

export const documenteMfQuery = z.object({
  idgestiune: id,
  inceput: dataIso,
  sfarsit: dataIso,
  stare: z.enum(['activ', 'inactiv', 'toate']).default('activ'),
})

export const fisaMfQuery = z.object({
  idgestiune: id,
  idmijloc: id,
})

export const situatieAmortizareQuery = z.object({
  idgestiune: id,
  an: z.coerce.number().int().min(1990).max(2100),
  luna: z.coerce.number().int().min(1).max(12),
  idcateg: id.optional(),
  idloc: id.optional(),
})

export const anulareAmortizareSchema = z.object({
  idgestiune: id,
  an: z.coerce.number().int().min(1990).max(2100),
  luna: z.coerce.number().int().min(1).max(12),
})

export { stare }
