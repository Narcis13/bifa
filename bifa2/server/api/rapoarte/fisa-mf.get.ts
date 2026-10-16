import { fisaMfQuery } from '#shared/schemas/mijloace-fixe'
import { fisaMijlocFix } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, fisaMfQuery)
  await requireGestiune(event, q.idgestiune)
  return found(await fisaMijlocFix(useDb(), q.idgestiune, q.idmijloc), 'Mijlocul fix')
})
