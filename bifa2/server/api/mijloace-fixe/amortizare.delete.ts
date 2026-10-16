import { anulareAmortizareSchema } from '#shared/schemas/mijloace-fixe'
import { anuleazaAmortizare } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, anulareAmortizareSchema)
  await requireGestiune(event, q.idgestiune)
  return regula(() => anuleazaAmortizare(useDb(), q.idgestiune, q.an, q.luna))
})
