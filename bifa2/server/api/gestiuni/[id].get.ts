import { idParam } from '#shared/schemas/common'
import { gasesteGestiune } from '../../services/gestiuni'

/** Full row (gestionar and committees): reports and documents read it. */
export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  await requireGestiune(event, id)
  return found(await gasesteGestiune(useDb(), id), 'Gestiunea')
})
