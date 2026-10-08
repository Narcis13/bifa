import { locuriQuery } from '#shared/schemas/locuri'
import { listaLocuri } from '../../services/locuri'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, locuriQuery)
  return listaLocuri(useDb(), q)
})
