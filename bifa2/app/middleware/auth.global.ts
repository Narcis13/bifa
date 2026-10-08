/** Login required everywhere except /login; pages with `meta.admin` need the admin role. */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, esteAdmin, gestiuni, incarca } = useSesiune()
  if (to.path === '/login') return loggedIn.value ? navigateTo('/') : undefined
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { r: to.fullPath } })
  if (!gestiuni.value.length) await incarca()
  if (to.meta.admin && !esteAdmin.value) return navigateTo('/')
})
