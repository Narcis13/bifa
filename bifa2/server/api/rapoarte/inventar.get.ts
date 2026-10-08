import { raportQuery } from '#shared/schemas/rapoarte'
import { listaInventariere } from '../../services/rapoarte'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, raportQuery)
  await requireGestiune(event, q.idgestiune)
  return listaInventariere(useDb(), q)
})
