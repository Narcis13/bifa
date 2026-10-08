import { materialeQuery } from '#shared/schemas/materiale'
import { listaMateriale } from '../../services/materiale'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, materialeQuery)
  await requireGestiune(event, q.idgestiune)
  return listaMateriale(useDb(), q)
})
