import { listaTipuriDocumente } from '../../services/tipuri-documente'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return listaTipuriDocumente(useDb())
})
