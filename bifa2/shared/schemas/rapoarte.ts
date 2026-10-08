import { z } from 'zod'
import { dataIso, id, stareMaterial, tipMaterial } from './common'

const optionalId = z.preprocess(v => (v === '' || v === '*' || v === 'toate' ? undefined : v), id.optional())

export const raportQuery = z.object({
  idgestiune: id,
  tipMaterial,
  idcateg: optionalId,
  idloc: optionalId,
  stareMaterial: z.preprocess(v => (v === '' || v === '*' || v === 'toate' ? undefined : v), stareMaterial.optional()),
  datainceput: dataIso,
  datasfarsit: dataIso,
  includeFaraStoc: z.preprocess(v => v === 'true' || v === '1' || v === true, z.boolean()).default(false),
}).refine(q => q.datainceput <= q.datasfarsit, { message: 'Data de început trebuie să fie înaintea datei de sfârșit', path: ['datainceput'] })

export const fisaQuery = raportQuery.and(z.object({ idreper: id }))
export type RaportQuery = z.infer<typeof raportQuery>
