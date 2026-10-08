/** Light/dark theme: toggles the `.app-dark` class used as PrimeVue's darkModeSelector. */
export function useTema() {
  const tema = useCookie<'light' | 'dark'>('tema', { default: () => 'light', sameSite: 'lax' })
  useHead({ htmlAttrs: { class: computed(() => (tema.value === 'dark' ? 'app-dark' : '')) } })
  return {
    tema,
    comuta: () => {
      tema.value = tema.value === 'dark' ? 'light' : 'dark'
    },
  }
}
