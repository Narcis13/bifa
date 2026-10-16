import { transferMfSchema } from '#shared/schemas/mijloace-fixe'
import { transferaMf } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, transferMfSchema)
  await requireGestiune(event, input.idgestiune)
  const r = await regula(() => transferaMf(useDb(), input))
  setResponseStatus(event, 201)
  return r
})
