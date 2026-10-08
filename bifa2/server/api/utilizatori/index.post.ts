import { utilizatorNou } from '#shared/schemas/utilizatori'
import { adaugaUtilizator } from '../../services/utilizatori'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { password, ...input } = await validBody(event, utilizatorNou)
  const passwordHash = await hashPassword(password)
  const r = await adaugaUtilizator(useDb(), { ...input, passwordHash })
    .catch(e => conflictOnDuplicate(e, 'Acest nume de utilizator există deja.'))
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 201)
  return r.valoare
})
