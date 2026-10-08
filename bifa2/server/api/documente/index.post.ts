import { documentSchema } from '#shared/schemas/documente'
import { salveazaDocument } from '../../services/documente'

export default defineEventHandler(async (event) => {
  const input = await validBody(event, documentSchema)
  await requireGestiune(event, input.idgestiune)
  const r = await regula(() => salveazaDocument(useDb(), input))
  setResponseStatus(event, 201)
  return r
})
