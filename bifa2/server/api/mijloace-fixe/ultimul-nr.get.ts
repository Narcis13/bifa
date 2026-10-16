import { z } from 'zod'
import { id } from '#shared/schemas/common'
import { urmatorNrInventar } from '../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const q = validQuery(event, z.object({ idgestiune: id }))
  await requireGestiune(event, q.idgestiune)
  return { nr_inventar: await urmatorNrInventar(useDb(), q.idgestiune) }
})
