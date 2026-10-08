import { documenteQuery } from '#shared/schemas/documente'
import { listaDocumente, totaluriLista } from '../../services/documente'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, documenteQuery)
  await requireGestiune(event, q.idgestiune)
  const documente = await listaDocumente(useDb(), q)
  return { documente, totaluri: totaluriLista(documente) }
})
