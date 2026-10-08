import { categorieNoua } from '#shared/schemas/categorii'
import { adaugaCategorie } from '../../services/categorii'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = await validBody(event, categorieNoua)
  const r = await adaugaCategorie(useDb(), input)
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 201)
  return r.valoare
})
