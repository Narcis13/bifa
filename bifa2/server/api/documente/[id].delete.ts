import { idParam } from '#shared/schemas/common'
import { antetDocument, invalideazaDocument } from '../../services/documente'

/** Invalidates (soft-deletes) a document: stare = 'inactiv'. Nothing is removed from the database. */
export default defineEventHandler(async (event) => {
  const { id } = validParams(event, idParam)
  const doc = found(await antetDocument(useDb(), id), 'Documentul')
  await requireGestiune(event, doc.idgestiune)
  if (!(await regula(() => invalideazaDocument(useDb(), id)))) apiError(409, 'Documentul este deja invalidat.')
  setResponseStatus(event, 204)
  return null
})
