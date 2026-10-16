import { listaMfQuery } from '#shared/schemas/mijloace-fixe'
import { listaMf } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, listaMfQuery)
  await requireGestiune(event, q.idgestiune)
  return listaMf(useDb(), q)
})
