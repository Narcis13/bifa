import { citesteSetari } from '../../services/setari'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return citesteSetari(useDb())
})
