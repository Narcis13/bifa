import { materialSchema } from '#shared/schemas/materiale'
import { adaugaMaterial } from '../../services/materiale'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await validBody(event, materialSchema)
  await requireGestiune(event, input.idgestiune)
  const r = await adaugaMaterial(useDb(), { ...input, iduser: user.id })
  setResponseStatus(event, 201)
  return r
})
