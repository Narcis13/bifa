import { idParam } from '#shared/schemas/common'
import { citesteDocumentMf } from '../../../services/mijloace-fixe'

export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const doc = found(await citesteDocumentMf(useDb(), id), 'Documentul')
  await requireGestiune(event, doc.idgestiune)
  return doc
})
