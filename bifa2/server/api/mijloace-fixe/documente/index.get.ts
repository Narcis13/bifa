import { documenteMfQuery } from '#shared/schemas/mijloace-fixe'
import { listaDocumenteMf } from '../../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, documenteMfQuery)
  await requireGestiune(event, q.idgestiune)
  return { documente: await listaDocumenteMf(useDb(), q) }
})
