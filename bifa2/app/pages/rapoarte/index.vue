<script setup lang="ts">
import { DENUMIRI_TIP_MATERIAL, STARI_MATERIAL, TIPURI_MATERIAL } from '#shared/schemas/common'
import type { TipMaterial } from '#shared/schemas/common'

useHead({ title: 'Rapoarte – BIFA' })
const route = useRoute()
const { idCurent, gestiuneCurenta } = useSesiune()

const RAPOARTE = [
  { v: 'balanta', l: 'Balanța analitică', icon: 'pi pi-chart-bar', desc: 'Stoc inițial, intrări, ieșiri și stoc final, cantitativ și valoric, pe material.' },
  { v: 'inventar', l: 'Lista de inventariere', icon: 'pi pi-list-check', desc: 'Stocul scriptic la sfârșitul perioadei, cu comisia de inventariere a gestiunii.' },
  { v: 'situatie', l: 'Situație repere', icon: 'pi pi-map', desc: 'Cartografierea stocului pe reper: cantitate, preț mediu, valoare, categorie, loc și stare.' },
  { v: 'fisa', l: 'Fișa de cont', icon: 'pi pi-id-card', desc: 'Soldul inițial și toate mișcările unui material, cu soldul după fiecare operațiune.' },
  { v: 'registru', l: 'Registru documente', icon: 'pi pi-book', desc: 'Documentele justificative din perioadă, cu totalurile debit și credit.' },
  { v: 'fisa-mf', l: 'Fișa mijlocului fix', icon: 'pi pi-building', desc: 'Identificare, mișcări și amortizarea liniară a unui mijloc fix (cod 14-2-2).' },
  { v: 'amortizare-mf', l: 'Situație amortizare', icon: 'pi pi-percentage', desc: 'Amortizarea liniară lunară pe mijloace fixe, cu total pe gestiune.' },
] as const
type Raport = (typeof RAPOARTE)[number]['v']

const esteMf = (r: Raport) => r === 'fisa-mf' || r === 'amortizare-mf'

const raport = ref<Raport>((RAPOARTE.some(r => r.v === route.query.raport) ? route.query.raport : 'balanta') as Raport)
watch(() => route.query.raport, (r) => {
  if (RAPOARTE.some(x => x.v === r)) raport.value = r as Raport
})

const azi = new Date()
const LUNI = [
  { v: 1, l: 'Ianuarie' }, { v: 2, l: 'Februarie' }, { v: 3, l: 'Martie' },
  { v: 4, l: 'Aprilie' }, { v: 5, l: 'Mai' }, { v: 6, l: 'Iunie' },
  { v: 7, l: 'Iulie' }, { v: 8, l: 'August' }, { v: 9, l: 'Septembrie' },
  { v: 10, l: 'Octombrie' }, { v: 11, l: 'Noiembrie' }, { v: 12, l: 'Decembrie' },
]
const f = reactive({
  tipMaterial: 'M' as TipMaterial,
  idcateg: null as number | null,
  idloc: null as number | null,
  stareMaterial: null as string | null,
  perioada: [new Date(azi.getFullYear(), 0, 1), azi] as Date[],
  includeFaraStoc: false,
  faraCantitati: false,
  doarPret: false,
  material: null as { id: number, denumire: string } | null,
  mijloc: null as { id: number, nr_inventar: string, denumire: string } | null,
  an: azi.getFullYear(),
  luna: azi.getMonth() + 1,
})

const tipCateg = computed(() => (esteMf(raport.value) ? 'MF' : f.tipMaterial))
const { data: categorii } = await useFetch<{ id: number, denumire: string, lipsa_import?: boolean }[]>('/api/categorii', {
  query: computed(() => ({ idgestiune: idCurent.value, tipmaterial: tipCateg.value })),
  default: () => [],
  watch: [idCurent, tipCateg],
})
const { data: locuri } = await useFetch('/api/locuri', { default: () => [] })

const sugestii = ref<{ id: number, denumire: string, um: string }[]>([])
async function cautaMaterial(e: { query: string }) {
  const r = await $fetch<{ rows: { id: number, denumire: string, um: string }[] }>('/api/materiale', { query: { idgestiune: idCurent.value, q: e.query, rows: 30, stare: 'toate' } })
  sugestii.value = r.rows
}

const sugestiiMf = ref<{ id: number, nr_inventar: string, denumire: string }[]>([])
async function cautaMf(e: { query: string }) {
  const r = await $fetch<{ rows: { id: number, nr_inventar: string, denumire: string }[] }>('/api/mijloace-fixe', {
    query: { idgestiune: idCurent.value, q: e.query, stare_mf: 'toate', rows: 30 },
  })
  sugestiiMf.value = r.rows
}

const eroare = ref('')
function genereaza() {
  eroare.value = ''
  if (raport.value === 'fisa-mf') {
    if (!f.mijloc) return (eroare.value = 'Alegeți mijlocul fix pentru fișă.')
    return navigateTo({
      path: '/rapoarte/fisa-mf',
      query: { idgestiune: String(idCurent.value), idmijloc: String(f.mijloc.id) },
    })
  }
  if (raport.value === 'amortizare-mf') {
    const query: Record<string, string> = {
      idgestiune: String(idCurent.value),
      an: String(f.an),
      luna: String(f.luna),
    }
    if (f.idcateg) query.idcateg = String(f.idcateg)
    if (f.idloc) query.idloc = String(f.idloc)
    return navigateTo({ path: '/rapoarte/amortizare-mf', query })
  }
  const [di, ds] = f.perioada
  if (!di || !ds) return (eroare.value = 'Alegeți perioada (data de început și de sfârșit).')
  if (raport.value === 'fisa' && !f.material) return (eroare.value = 'Alegeți materialul pentru fișa de cont.')
  const query: Record<string, string> = {
    idgestiune: String(idCurent.value),
    datainceput: isoData(di),
    datasfarsit: isoData(ds),
  }
  if (raport.value !== 'registru') {
    query.tipMaterial = f.tipMaterial
    if (raport.value !== 'situatie') {
      if (f.idcateg) query.idcateg = String(f.idcateg)
      if (f.idloc) query.idloc = String(f.idloc)
      if (f.stareMaterial) query.stareMaterial = f.stareMaterial
    }
  }
  if (raport.value !== 'fisa' && raport.value !== 'registru' && raport.value !== 'situatie' && f.includeFaraStoc) query.includeFaraStoc = 'true'
  if (raport.value === 'inventar' && f.doarPret) query.doarPret = 'true'
  else if (raport.value === 'inventar' && f.faraCantitati) query.faraCantitati = 'true'
  if (raport.value === 'fisa') query.idreper = String(f.material!.id)
  return navigateTo({ path: `/rapoarte/${raport.value}`, query })
}

const tipuriMaterial = TIPURI_MATERIAL.map(v => ({ v, l: DENUMIRI_TIP_MATERIAL[v] }))
const optiuniCateg = computed(() => [{ id: null, denumire: 'Toate categoriile' }, ...(categorii.value ?? []).map(c => ({ ...c, denumire: c.lipsa_import ? `${c.denumire} (nu intră în „toate”)` : c.denumire }))])
const optiuniLoc = computed(() => [{ id: null, denumire: 'Toate locurile' }, ...(locuri.value ?? [])])
const optiuniStare = [{ v: null, l: 'Toate stările' }, ...STARI_MATERIAL.map(s => ({ v: s, l: s }))]
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Rapoarte
        <span class="sub">{{ gestiuneCurenta?.denumire }}</span>
      </h1>
    </div>
    <div class="rapoarte">
      <nav
        class="alegere"
        aria-label="Tip raport"
      >
        <button
          v-for="r in RAPOARTE"
          :key="r.v"
          type="button"
          class="card optiune"
          :class="{ activ: raport === r.v }"
          :aria-pressed="raport === r.v"
          @click="raport = r.v"
        >
          <i :class="r.icon" />
          <span>
            <strong>{{ r.l }}</strong>
            <small>{{ r.desc }}</small>
          </span>
        </button>
      </nav>

      <form
        class="card form-grid"
        @submit.prevent="genereaza"
      >
        <template v-if="raport === 'fisa-mf'">
          <div class="field field-wide">
            <label for="mijloc">Mijloc fix</label>
            <AutoComplete
              v-model="f.mijloc"
              input-id="mijloc"
              :suggestions="sugestiiMf"
              option-label="denumire"
              :delay="250"
              force-selection
              placeholder="Caută după nr. inventar sau denumire…"
              fluid
              @complete="cautaMf"
            >
              <template #option="{ option }">
                {{ option.nr_inventar }} — {{ option.denumire }}
              </template>
            </AutoComplete>
          </div>
        </template>
        <template v-else-if="raport === 'amortizare-mf'">
          <div class="field">
            <label for="an-mf">An</label>
            <InputNumber
              v-model="f.an"
              input-id="an-mf"
              :min="1990"
              :max="2100"
              show-buttons
            />
          </div>
          <div class="field">
            <label for="luna-mf">Luna</label>
            <Select
              v-model="f.luna"
              input-id="luna-mf"
              :options="LUNI"
              option-label="l"
              option-value="v"
            />
          </div>
          <div class="field">
            <label for="categ-mf">Categorie MF</label>
            <Select
              v-model="f.idcateg"
              input-id="categ-mf"
              :options="optiuniCateg"
              placeholder="Toate categoriile"
              option-label="denumire"
              option-value="id"
            />
          </div>
          <div class="field">
            <label for="loc-mf">Loc de dispunere</label>
            <Select
              v-model="f.idloc"
              input-id="loc-mf"
              :options="optiuniLoc"
              placeholder="Toate locurile"
              option-label="denumire"
              option-value="id"
              filter
            />
          </div>
        </template>
        <template v-else>
          <div class="field field-wide">
            <label for="perioada">Perioada</label>
            <DatePicker
              v-model="f.perioada"
              input-id="perioada"
              selection-mode="range"
              :manual-input="false"
              date-format="dd.mm.yy"
              show-icon
              icon-display="input"
            />
          </div>
          <template v-if="raport !== 'registru'">
            <div class="field field-wide">
              <label for="tipmat">Tip material</label>
              <SelectButton
                v-model="f.tipMaterial"
                :options="tipuriMaterial"
                option-label="l"
                option-value="v"
                :allow-empty="false"
                aria-labelledby="tipmat"
              />
            </div>
            <template v-if="raport !== 'situatie'">
              <div class="field">
                <label for="categ">Categorie</label>
                <Select
                  v-model="f.idcateg"
                  input-id="categ"
                  :options="optiuniCateg"
                  placeholder="Toate categoriile"
                  option-label="denumire"
                  option-value="id"
                />
              </div>
              <div class="field">
                <label for="loc">Loc de dispunere</label>
                <Select
                  v-model="f.idloc"
                  input-id="loc"
                  :options="optiuniLoc"
                  placeholder="Toate locurile"
                  option-label="denumire"
                  option-value="id"
                  filter
                />
              </div>
              <div class="field">
                <label for="stare">Stare material</label>
                <Select
                  v-model="f.stareMaterial"
                  input-id="stare"
                  :options="optiuniStare"
                  placeholder="Toate stările"
                  option-label="l"
                  option-value="v"
                />
              </div>
            </template>
          </template>
          <div
            v-if="raport === 'fisa'"
            class="field field-wide"
          >
            <label for="material">Material</label>
            <AutoComplete
              v-model="f.material"
              input-id="material"
              :suggestions="sugestii"
              option-label="denumire"
              :delay="250"
              force-selection
              placeholder="Caută după denumire sau cod…"
              fluid
              @complete="cautaMaterial"
            >
              <template #option="{ option }">
                {{ option.denumire }} <span class="muted">({{ option.um }}) · cod {{ option.id }}</span>
              </template>
            </AutoComplete>
          </div>
          <div
            v-if="raport === 'balanta' || raport === 'inventar'"
            class="field field-wide check"
          >
            <Checkbox
              v-model="f.includeFaraStoc"
              input-id="farastoc"
              binary
            />
            <label for="farastoc">Include și materialele fără stoc la începutul și sfârșitul perioadei (cu mișcări în perioadă)</label>
          </div>
          <div
            v-if="raport === 'inventar'"
            class="field field-wide check"
          >
            <Checkbox
              v-model="f.faraCantitati"
              input-id="faracantitati"
              binary
              :disabled="f.doarPret"
            />
            <label for="faracantitati">Afișează lista fără cantități (stoc scriptic și valoare goale, pentru inventariere faptică)</label>
          </div>
          <div
            v-if="raport === 'inventar'"
            class="field field-wide check"
          >
            <Checkbox
              v-model="f.doarPret"
              input-id="doarpret"
              binary
              @update:model-value="(v: boolean) => { if (v) f.faraCantitati = false }"
            />
            <label for="doarpret">Doar denumire și preț (fără cantități)</label>
          </div>
        </template>
        <Message
          v-if="eroare"
          severity="error"
          size="small"
          variant="simple"
          class="field-wide"
        >
          {{ eroare }}
        </Message>
        <div class="field-wide">
          <Button
            type="submit"
            label="Generează raportul"
            icon="pi pi-file"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.rapoarte { display: grid; grid-template-columns: minmax(240px, 340px) 1fr; gap: 1rem; align-items: start; }
.alegere { display: flex; flex-direction: column; gap: 0.5rem; }
.optiune { display: flex; gap: 0.75rem; align-items: flex-start; text-align: left; cursor: pointer; font: inherit; color: inherit; }
.optiune i { font-size: 1.3rem; color: var(--p-primary-color); margin-top: 0.15rem; }
.optiune strong { display: block; }
.optiune small { color: var(--app-muted); }
.optiune.activ { border-color: var(--p-primary-color); box-shadow: 0 0 0 1px var(--p-primary-color); }
.check { flex-direction: row; align-items: center; gap: 0.5rem; }
.check label { font-weight: 400; }
@media (max-width: 900px) { .rapoarte { grid-template-columns: 1fr; } }
</style>
