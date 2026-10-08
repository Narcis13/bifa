/** Every /api route except login requires a session. Admin and gestiune checks happen in handlers. */
const PUBLIC = new Set(['/api/auth/login'])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/') || PUBLIC.has(path) || path.startsWith('/api/_auth/')) return
  await requireUser(event)
})
