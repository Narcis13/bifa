import { idParam } from '#shared/schemas/common'
import { documentSchema } from '#shared/schemas/documente'
import { antetDocument, salveazaDocument } from '../../services/documente'

/** Edits a document in place (same id): header updated, previous lines soft-deactivated, new lines written. */
export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const input = await validBody(event, documentSchema)
  const doc = found(await antetDocument(useDb(), id), 'Documentul')
  await requireGestiune(event, doc.idgestiune)
  return regula(() => salveazaDocument(useDb(), input, id))
})
