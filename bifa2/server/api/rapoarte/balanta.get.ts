import { raportQuery } from '#shared/schemas/rapoarte'
import { balantaAnalitica } from '../../services/rapoarte'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, raportQuery)
  await requireGestiune(event, q.idgestiune)
  return balantaAnalitica(useDb(), q)
})
