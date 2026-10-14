import { raportQuery } from '#shared/schemas/rapoarte'
import { situatieRepere } from '../../services/rapoarte'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, raportQuery)
  await requireGestiune(event, q.idgestiune)
  return situatieRepere(useDb(), q)
})
