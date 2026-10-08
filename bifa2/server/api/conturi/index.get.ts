import { conturiQuery } from '#shared/schemas/conturi'
import { cautaConturi } from '../../services/conturi'

/** Paginated search over the chart of accounts: { rows, total }. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  return cautaConturi(useDb(), validQuery(event, conturiQuery))
})
