import { idParam } from '#shared/schemas/common'
import { citesteMf } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const mf = found(await citesteMf(useDb(), id), 'Mijlocul fix')
  await requireGestiune(event, mf.idgestiune)
  return mf
})
