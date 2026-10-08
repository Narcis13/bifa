import { fisaQuery } from '#shared/schemas/rapoarte'
import { fisaCont } from '../../services/rapoarte'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, fisaQuery)
  await requireGestiune(event, q.idgestiune)
  return fisaCont(useDb(), q)
})
