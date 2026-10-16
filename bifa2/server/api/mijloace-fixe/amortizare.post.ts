import { amortizareMfSchema } from '#shared/schemas/mijloace-fixe'
import { calculeazaAmortizare } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, amortizareMfSchema)
  const user = await requireGestiune(event, input.idgestiune)
  const r = await regula(() => calculeazaAmortizare(useDb(), input, user.id))
  setResponseStatus(event, 201)
  return r
})
