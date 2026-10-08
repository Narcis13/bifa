import { idParam } from '#shared/schemas/common'
import { citesteDocument } from '../../services/documente'

export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const doc = found(await citesteDocument(useDb(), id), 'Documentul')
  await requireGestiune(event, doc.idgestiune)
  return doc
})
