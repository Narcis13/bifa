import { situatieAmortizareQuery } from '#shared/schemas/mijloace-fixe'
import { situatieAmortizare } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, situatieAmortizareQuery)
  await requireGestiune(event, q.idgestiune)
  return situatieAmortizare(useDb(), q)
})
