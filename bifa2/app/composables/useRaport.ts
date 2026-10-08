import { DENUMIRI_TIP_MATERIAL } from '#shared/schemas/common'
import type { TipMaterial } from '#shared/schemas/common'

export interface GestiuneDetalii {
  id: number
  denumire: string
  gestionar: string | null
  r_presedinte: string | null
  r_membru1: string | null
  r_membru2: string | null
  r_membru3: string | null
  i_presedinte: string | null
  i_membru1: string | null
  i_membru2: string | null
  i_membru3: string | null
}
export interface Setari {
  institutie: string
  grad_dir_fin_con: string
  nume_dir_fin_con: string
  grad_comandant: string
  nume_comandant: string
}

/** Report filters read from the URL, their human labels, the gestiune details and the settings. */
export function useRaport() {
  const route = useRoute()
  const { idCurent } = useSesiune()
  const q = computed(() => {
    const s = (k: string) => (typeof route.query[k] === 'string' && route.query[k] !== '' ? route.query[k] as string : undefined)
    return {
      idgestiune: Number(s('idgestiune') ?? idCurent.value),
      tipMaterial: (s('tipMaterial') ?? 'M') as TipMaterial,
      idcateg: s('idcateg'),
      idloc: s('idloc'),
      stareMaterial: s('stareMaterial'),
      datainceput: s('datainceput') ?? `${new Date().getFullYear()}-01-01`,
      datasfarsit: s('datasfarsit') ?? isoData(new Date()),
      includeFaraStoc: s('includeFaraStoc'),
      idreper: s('idreper'),
    }
  })
  const { data: gestiune } = useFetch<GestiuneDetalii>(() => `/api/gestiuni/${q.value.idgestiune}`)
  const { data: setari } = useFetch<Setari>('/api/setari')
  const { data: locuri } = useFetch<{ id: number, denumire: string }[]>('/api/locuri', { default: () => [] })
  const { data: categorii } = useFetch<{ id: number, denumire: string }[]>('/api/categorii', { query: computed(() => ({ idgestiune: q.value.idgestiune })), default: () => [] })

  const filtre = computed(() => [
    { eticheta: 'Gestiunea', valoare: gestiune.value?.denumire ?? '' },
    { eticheta: 'Tip material', valoare: DENUMIRI_TIP_MATERIAL[q.value.tipMaterial] },
    { eticheta: 'Categoria', valoare: q.value.idcateg ? ((categorii.value ?? []).find(c => c.id === Number(q.value.idcateg))?.denumire ?? q.value.idcateg) : 'toate' },
    { eticheta: 'Locul', valoare: q.value.idloc ? ((locuri.value ?? []).find(l => l.id === Number(q.value.idloc))?.denumire ?? q.value.idloc) : 'toate' },
    { eticheta: 'Starea', valoare: q.value.stareMaterial ?? 'toate' },
  ])
  const perioada = computed(() => `${fmtData(q.value.datainceput)} – ${fmtData(q.value.datasfarsit)}`)
  /** Query for the report API: only defined values. */
  const apiQuery = computed(() => Object.fromEntries(Object.entries(q.value).filter(([, v]) => v !== undefined)))
  const dirFin = computed(() => [setari.value?.grad_dir_fin_con, setari.value?.nume_dir_fin_con].filter(Boolean).join(' '))
  const comandant = computed(() => [setari.value?.grad_comandant, setari.value?.nume_comandant].filter(Boolean).join(' '))
  return { q, apiQuery, gestiune, setari, filtre, perioada, dirFin, comandant }
}
