import { z } from 'zod'
import { dataIso, id, stareMaterial, tipMaterial, zecimal } from './common'

/** Where a line takes stock from (exit) or puts it (entry). */
export const pozitieStoc = z.object({
  idloc: id,
  idcateg: id,
  stareMaterial,
})

/**
 * One document line, as entered by the user. The document type decides which side is used:
 * entry (`i`) needs `destinatie` and `pret`; exit (`e`) needs `sursa` and takes the average
 * price from stock; transfer (`t`) needs both and moves stock at average price.
 */
export const linieDocument = z.object({
  idreper: id,
  cantitate: zecimal(2, 'Cantitate').refine(v => Number(v) > 0, 'Cantitatea trebuie să fie mai mare decât zero'),
  pret: zecimal(4, 'Preț').optional(),
  sursa: pozitieStoc.optional(),
  destinatie: pozitieStoc.optional(),
})
export type LinieDocumentInput = z.infer<typeof linieDocument>

export const documentSchema = z.object({
  idgestiune: id,
  idtipoperatiuni: id,
  tipMaterial,
  data: dataIso,
  nrdoc: z.string().trim().min(1, 'Numărul documentului este obligatoriu').max(25, 'Maxim 25 de caractere'),
  linii: z.array(linieDocument).min(1, 'Documentul trebuie să aibă cel puțin o linie').max(500),
})
export type DocumentInput = z.infer<typeof documentSchema>

export const documenteQuery = z.object({
  idgestiune: id,
  inceput: dataIso,
  sfarsit: dataIso,
  stare: z.enum(['activ', 'inactiv', 'toate']).default('activ'),
})

export const stocQuery = z.object({
  idgestiune: id,
  idloc: id,
  idcateg: id,
  tipMaterial,
  data: dataIso,
  /** While editing a document, its own lines are not counted as existing stock. */
  exceptDocument: id.optional(),
})
