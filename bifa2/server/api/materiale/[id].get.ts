import { idParam } from '#shared/schemas/common'
import { gasesteMaterial } from '../../services/materiale'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { id } = validParams(event, idParam)
  const material = found(await gasesteMaterial(useDb(), id), 'Materialul')
  await requireGestiune(event, material.idgestiune)
  return material
})
