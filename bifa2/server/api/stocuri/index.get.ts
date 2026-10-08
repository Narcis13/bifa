import { stocQuery } from '#shared/schemas/documente'
import { stocPretMediu } from '../../services/stoc'

/** Stock at average price for a place and category on a date (exit lines pick from it). */
export default defineEventHandler(async (event) => {
  const q = validQuery(event, stocQuery)
  await requireGestiune(event, q.idgestiune)
  return stocPretMediu(useDb(), { ...q, exceptAntet: q.exceptDocument })
})
