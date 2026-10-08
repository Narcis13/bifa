export interface GestiuneAccesibila {
  id: number
  denumire: string
}

/**
 * Logged-in user, their gestiuni and the current gestiune ("gestiune curentă").
 * The current gestiune is kept in a cookie so reloads and report tabs keep it.
 */
export function useSesiune() {
  const { loggedIn, user, fetch: refreshSession, clear } = useUserSession()
  const gestiuni = useState<GestiuneAccesibila[]>('gestiuni', () => [])
  const idCurent = useCookie<number | null>('gestiune', { default: () => null, sameSite: 'lax' })

  const gestiuneCurenta = computed(() => gestiuni.value.find(g => g.id === idCurent.value) ?? null)
  const esteAdmin = computed(() => user.value?.rol === 'admin')

  function alegeGestiune(list: GestiuneAccesibila[]) {
    gestiuni.value = list
    if (!list.some(g => g.id === idCurent.value)) idCurent.value = list[0]?.id ?? null
  }

  async function incarca() {
    if (!loggedIn.value) return
    const me = await $fetch('/api/me', { headers: useRequestHeaders(['cookie']) })
    alegeGestiune(me.gestiuni)
  }

  async function login(username: string, password: string) {
    const r = await $fetch('/api/auth/login', { method: 'POST', body: { username, password } })
    await refreshSession()
    alegeGestiune(r.gestiuni)
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    gestiuni.value = []
    await navigateTo('/login')
  }

  return { loggedIn, user, esteAdmin, gestiuni, idCurent, gestiuneCurenta, incarca, login, logout }
}
