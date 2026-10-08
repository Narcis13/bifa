import { duplicateQuery } from '#shared/schemas/materiale'
import { gasesteDuplicat } from '../../services/materiale'

/** Live warning while typing a name: { duplicat: { id, denumire } | null }. */
export default defineEventHandler(async (event) => {
  const q = validQuery(event, duplicateQuery)
  await requireGestiune(event, q.idgestiune)
  const duplicat = await gasesteDuplicat(useDb(), q.idgestiune, q.denumire, q.excludeId)
  return { duplicat: duplicat ?? null }
})
