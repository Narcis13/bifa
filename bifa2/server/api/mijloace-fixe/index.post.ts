import { inregistrareMfSchema } from '#shared/schemas/mijloace-fixe'
import { inregistreazaMf } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, inregistrareMfSchema)
  await requireGestiune(event, input.idgestiune)
  const r = await regula(() => inregistreazaMf(useDb(), input))
  setResponseStatus(event, 201)
  return r
})
