import { locSchema } from '#shared/schemas/locuri'
import { adaugaLoc } from '../../services/locuri'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, locSchema)
  setResponseStatus(event, 201)
  return adaugaLoc(useDb(), input)
})
