import { listaUtilizatori } from '../../services/utilizatori'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return listaUtilizatori(useDb())
})
