import { analiticNou } from '#shared/schemas/conturi'
import { adaugaAnalitic } from '../../services/conturi'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = await validBody(event, analiticNou)
  const r = await adaugaAnalitic(useDb(), input)
    .catch(e => conflictOnDuplicate(e, 'Contul există deja.'))
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 201)
  return r.valoare
})
