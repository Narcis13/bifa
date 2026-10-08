import { idParam } from '#shared/schemas/common'
import { locPatchSchema } from '#shared/schemas/locuri'
import { gasesteLoc, modificaLoc } from '../../services/locuri'

export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const input = await validBody(event, locPatchSchema)
  found(await gasesteLoc(useDb(), id), 'Locul de dispunere')
  return modificaLoc(useDb(), id, input)
})
