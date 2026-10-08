import { ultimulCodQuery } from '#shared/schemas/materiale'
import { ultimulCod } from '../../services/materiale'

/** Last import code of the gestiune and a suggestion for the next one. */
export default defineEventHandler(async (event) => {
  const q = validQuery(event, ultimulCodQuery)
  await requireGestiune(event, q.idgestiune)
  return ultimulCod(useDb(), q.idgestiune)
})
