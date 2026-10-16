import { casareMfSchema } from '#shared/schemas/mijloace-fixe'
import { caseazaMf } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, casareMfSchema)
  await requireGestiune(event, input.idgestiune)
  const r = await regula(() => caseazaMf(useDb(), input))
  setResponseStatus(event, 201)
  return r
})
