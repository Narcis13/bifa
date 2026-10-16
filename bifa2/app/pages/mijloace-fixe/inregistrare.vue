<script setup lang="ts">
import { DENUMIRI_GRUPA_MF, GRAPE_MF, inregistrareMfSchema } from '#shared/schemas/mijloace-fixe'

useHead({ title: 'Înregistrare mijloc fix – BIFA' })
const notify = useNotify()
const { idCurent, gestiuneCurenta } = useSesiune()

const { data: tipuri } = await useFetch<{ id: number, denumire: string, tip: string, denumire_scurta: string }[]>(
  '/api/tipuri-documente',
  { default: () => [] },
)
const tipuriIntrare = computed(() => (tipuri.value ?? [])
  .filter(t => t.tip === 'i')
  .map(t => ({ ...t, eticheta: `${t.denumire} (${t.denumire_scurta})` })))

const { data: locuri } = await useFetch<{ id: number, denumire: string }[]>('/api/locuri', {
  query: { stare: 'activ' },
  default: () => [],
})
const { data: categorii } = await useFetch<{ id: number, denumire: string }[]>('/api/categorii', {
  query: computed(() => ({ idgestiune: idCurent.value, tipmaterial: 'MF', stare: 'activ' })),
  default: () => [],
  watch: [idCurent],
})

const form = reactive({
  idtipoperatiuni: null as number | null,
  data: isoData(new Date()),
  nrdoc: '',
  observatii: '',
  nr_inventar: '',
  denumire: '',
  caracteristici: '',
  idcateg: null as number | null,
  idloc: null as number | null,
  cod_clasificare: '',
  grupa: 3 as 1 | 2 | 3,
  valoare_intrare: null as number | null,
  amortizare_initiala: null as number | null,
  durata_ani: 5,
  data_punere_functiune: isoData(new Date()),
})
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

const dataDoc = computed<Date>({
  get: () => dinIso(form.data),
  set: (v) => { if (v) form.data = isoData(v) },
})
const dataPunere = computed<Date>({
  get: () => dinIso(form.data_punere_functiune),
  set: (v) => { if (v) form.data_punere_functiune = isoData(v) },
})

const valoareText = computed(() => (form.valoare_intrare == null ? '0' : form.valoare_intrare.toFixed(4)))
const amortText = computed(() => (form.amortizare_initiala == null ? '0' : form.amortizare_initiala.toFixed(4)))
const amortLunaraPrev = computed(() => {
  if (!form.valoare_intrare || !form.durata_ani) return '0.0000'
  return Dec.toFixed(Dec.div(Dec.from(valoareText.value), Dec.from(String(form.durata_ani * 12))), 4)
})
const valoareRamasaPrev = computed(() =>
  Dec.toFixed(Dec.sub(Dec.from(valoareText.value), Dec.from(amortText.value)), 4))

watch(idCurent, async () => {
  if (!idCurent.value) return
  try {
    const r = await $fetch<{ nr_inventar: string }>('/api/mijloace-fixe/ultimul-nr', {
      query: { idgestiune: idCurent.value },
    })
    form.nr_inventar = r.nr_inventar
  }
  catch { /* ignore */ }
}, { immediate: true })

watch(() => form.cod_clasificare, (c) => {
  const g = Number(c?.trim().charAt(0))
  if (g === 1 || g === 2 || g === 3) form.grupa = g
})

async function salveaza() {
  erori.value = {}
  const payload = {
    idgestiune: idCurent.value!,
    idtipoperatiuni: form.idtipoperatiuni!,
    data: form.data,
    nrdoc: form.nrdoc,
    observatii: form.observatii || undefined,
    nr_inventar: form.nr_inventar,
    denumire: form.denumire,
    caracteristici: form.caracteristici || undefined,
    idcateg: form.idcateg!,
    idloc: form.idloc!,
    cod_clasificare: form.cod_clasificare,
    grupa: form.grupa,
    valoare_intrare: valoareText.value,
    amortizare_initiala: amortText.value,
    durata_ani: form.durata_ani,
    data_punere_functiune: form.data_punere_functiune,
  }
  const parsed = inregistrareMfSchema.safeParse(payload)
  if (!parsed.success) {
    for (const i of parsed.error.issues) erori.value[i.path.join('.')] = i.message
    return
  }
  if (!categorii.value?.length) {
    notify.err('Nu există categorii de tip MF în gestiunea curentă. Creați una la Administrare → Categorii.')
    return
  }
  salvare.value = true
  try {
    const r = await $fetch<{ id: number }>('/api/mijloace-fixe', { method: 'POST', body: parsed.data })
    notify.ok('Mijlocul fix a fost înregistrat.')
    await navigateTo(`/mijloace-fixe/${r.id}`)
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

const optiuniGrupa = GRAPE_MF.map(g => ({ v: g, l: DENUMIRI_GRUPA_MF[g] }))
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Înregistrare mijloc fix
        <span class="sub">{{ gestiuneCurenta?.denumire }}</span>
      </h1>
      <Button
        as="router-link"
        to="/mijloace-fixe"
        label="Înapoi"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
      />
      <Button
        label="Salvează"
        icon="pi pi-check"
        :loading="salvare"
        @click="salveaza"
      />
    </div>

    <Message
      v-if="!(categorii ?? []).length"
      severity="warn"
      class="mb"
    >
      Nu există categorii cu tipul „Mijloace fixe” în gestiunea curentă. Creați una din Administrare → Categorii (tip MF).
    </Message>

    <div class="grid">
      <div class="card">
        <h2>Document de intrare</h2>
        <div class="campuri">
          <label>
            Tip act
            <Select
              v-model="form.idtipoperatiuni"
              :options="tipuriIntrare"
              option-label="eticheta"
              option-value="id"
              placeholder="Alegeți tipul"
              class="w"
              :invalid="!!erori.idtipoperatiuni"
            />
            <small
              v-if="erori.idtipoperatiuni"
              class="err"
            >{{ erori.idtipoperatiuni }}</small>
          </label>
          <label>
            Data document
            <DatePicker
              v-model="dataDoc"
              date-format="dd.mm.yy"
              show-icon
              icon-display="input"
              class="w"
            />
          </label>
          <label>
            Nr. document
            <InputText
              v-model="form.nrdoc"
              class="w"
              :invalid="!!erori.nrdoc"
            />
            <small
              v-if="erori.nrdoc"
              class="err"
            >{{ erori.nrdoc }}</small>
          </label>
          <label class="span2">
            Observații
            <InputText
              v-model="form.observatii"
              class="w"
            />
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Identificare</h2>
        <div class="campuri">
          <label>
            Nr. inventar
            <InputText
              v-model="form.nr_inventar"
              class="w"
              :invalid="!!erori.nr_inventar"
            />
            <small
              v-if="erori.nr_inventar"
              class="err"
            >{{ erori.nr_inventar }}</small>
          </label>
          <label class="span2">
            Denumire
            <InputText
              v-model="form.denumire"
              class="w"
              :invalid="!!erori.denumire"
            />
            <small
              v-if="erori.denumire"
              class="err"
            >{{ erori.denumire }}</small>
          </label>
          <label class="span3">
            Caracteristici tehnice
            <InputText
              v-model="form.caracteristici"
              class="w"
            />
          </label>
          <label>
            Categorie (MF)
            <Select
              v-model="form.idcateg"
              :options="categorii ?? []"
              option-label="denumire"
              option-value="id"
              placeholder="Categorie"
              class="w"
              :invalid="!!erori.idcateg"
            />
          </label>
          <label>
            Loc de dispunere
            <Select
              v-model="form.idloc"
              :options="locuri ?? []"
              option-label="denumire"
              option-value="id"
              placeholder="Loc"
              class="w"
              :invalid="!!erori.idloc"
            />
          </label>
          <label>
            Cod clasificare (HG 2139/2004)
            <InputText
              v-model="form.cod_clasificare"
              class="w"
              placeholder="ex. 3.1.1"
              :invalid="!!erori.cod_clasificare"
            />
            <small
              v-if="erori.cod_clasificare"
              class="err"
            >{{ erori.cod_clasificare }}</small>
          </label>
          <label class="span2">
            Grupa
            <Select
              v-model="form.grupa"
              :options="optiuniGrupa"
              option-label="l"
              option-value="v"
              class="w"
            />
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Valori și amortizare liniară</h2>
        <p class="hint">
          Amortizare lunară = valoare de intrare ÷ (durata × 12), conform Legii 15/1994. Pentru mijloace
          parțial sau integral amortizate completați amortizarea cumulată deja înregistrată.
        </p>
        <div class="campuri">
          <label>
            Valoare de intrare (lei)
            <InputNumber
              v-model="form.valoare_intrare"
              mode="decimal"
              :min-fraction-digits="2"
              :max-fraction-digits="4"
              locale="ro-RO"
              class="w"
              :invalid="!!erori.valoare_intrare"
            />
            <small
              v-if="erori.valoare_intrare"
              class="err"
            >{{ erori.valoare_intrare }}</small>
          </label>
          <label>
            Amortizare cumulată deja (lei)
            <InputNumber
              v-model="form.amortizare_initiala"
              mode="decimal"
              :min-fraction-digits="2"
              :max-fraction-digits="4"
              locale="ro-RO"
              class="w"
              :invalid="!!erori.amortizare_initiala"
            />
            <small
              v-if="erori.amortizare_initiala"
              class="err"
            >{{ erori.amortizare_initiala }}</small>
          </label>
          <label>
            Durata normală (ani)
            <InputNumber
              v-model="form.durata_ani"
              :min="1"
              :max="100"
              show-buttons
              class="w"
              :invalid="!!erori.durata_ani"
            />
          </label>
          <label>
            Data punerii în funcțiune
            <DatePicker
              v-model="dataPunere"
              date-format="dd.mm.yy"
              show-icon
              icon-display="input"
              class="w"
            />
          </label>
        </div>
        <div class="previzualizare">
          <div>
            <span>Amortizare lunară</span>
            <strong>{{ fmtNum(amortLunaraPrev, 4) }} lei</strong>
          </div>
          <div>
            <span>Valoare rămasă de amortizat</span>
            <strong>{{ fmtNum(valoareRamasaPrev, 2) }} lei</strong>
          </div>
          <div>
            <span>Cota anuală</span>
            <strong>{{ form.durata_ani ? fmtNum(100 / form.durata_ani, 2) : '—' }} %</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb { margin-bottom: 1rem; }
.grid { display: flex; flex-direction: column; gap: 1rem; }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
.hint { margin: 0 0 1rem; color: var(--app-muted); font-size: 0.9rem; }
.campuri {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem 1rem;
}
@media (max-width: 900px) { .campuri { grid-template-columns: 1fr; } }
.campuri label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--app-muted); }
.span2 { grid-column: span 2; }
.span3 { grid-column: span 3; }
@media (max-width: 900px) { .span2, .span3 { grid-column: span 1; } }
.w { width: 100%; }
.err { color: var(--p-red-500); }
.previzualizare {
  display: flex; flex-wrap: wrap; gap: 1.5rem;
  margin-top: 1rem; padding-top: 1rem;
  border-top: 1px solid var(--app-border);
}
.previzualizare span { display: block; font-size: 0.8rem; color: var(--app-muted); }
.previzualizare strong { font-size: 1.05rem; }
</style>
