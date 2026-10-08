import { idParam } from '#shared/schemas/common'
import { materialPatchSchema } from '#shared/schemas/materiale'
import { gasesteMaterial, modificaMaterial } from '../../services/materiale'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { id } = validParams(event, idParam)
  const input = await validBody(event, materialPatchSchema)
  const existent = found(await gasesteMaterial(useDb(), id), 'Materialul')
  await requireGestiune(event, existent.idgestiune)
  return found(await modificaMaterial(useDb(), id, input), 'Materialul')
})
