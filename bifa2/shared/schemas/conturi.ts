import { z } from 'zod'
import { id } from './common'

export const conturiQuery = z.object({
  q: z.string().trim().max(100).optional(),
  /** '1' = only the analytic accounts created by users (tip = 'N'). */
  analitice: z.enum(['0', '1']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  rows: z.coerce.number().int().min(1).max(200).default(50),
})
export type ConturiQuery = z.infer<typeof conturiQuery>

export const analiticNou = z.object({
  idsintetic: id,
  sufix: z.string().trim()
    .min(1, 'Sufixul contului este obligatoriu')
    .max(15, 'Sufix: maxim 15 caractere')
    .regex(/^[A-Za-z0-9.\-/]+$/, 'Sufixul poate conține doar litere, cifre, punct, cratimă și bară'),
  denumire: z.string().trim().min(1, 'Denumirea este obligatorie').max(120, 'Denumire: maxim 120 de caractere'),
})
export type AnaliticNou = z.infer<typeof analiticNou>
