import { setariSchema } from '#shared/schemas/setari'
import { salveazaSetari } from '../../services/setari'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = await validBody(event, setariSchema)
  return salveazaSetari(useDb(), input)
})
