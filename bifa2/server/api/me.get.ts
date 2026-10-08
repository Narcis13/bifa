import { gestiuniAccesibile } from '../services/gestiuni'

/** The current user and the gestiuni they may work in. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { user, gestiuni: await gestiuniAccesibile(useDb(), user) }
})
