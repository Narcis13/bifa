<script setup lang="ts">
import { DENUMIRI_TIP_MATERIAL, STARI_MATERIAL, TIPURI_MATERIAL } from '#shared/schemas/common'
import type { StareMaterial, TipMaterial } from '#shared/schemas/common'

interface Pozitie { idloc: number, idcateg: number, stareMaterial: StareMaterial }
interface LinieUI {
  idreper: number
  material: string
  um: string
  cantitate: string
  /** Entry: unit price typed by the user. Exit/transfer: current average price (final price is set by the server). */
  pret: string
  sursa?: Pozitie
  destinatie?: Pozitie
}
interface StocRand { id_reper: number, denumire: string, um: string, cod_import: string | null, stare_material: StareMaterial, stoc: string, valoarestoc: string, pretmediu: string }
interface MaterialRand { id: number, denumire: string, um: string, cod_import: string | null, pretpredefinit: string }

const route = useRoute()
const notify = useNotify()
const { idCurent, gestiuneCurenta } = useSesiune()
const idDoc = computed(() => (route.params.id === 'nou' ? null : Number(route.params.id)))
useHead({ title: computed(() => (idDoc.value ? `Document ${idDoc.value}` : 'Document nou') + ' – BIFA') })

// ---- nomenclatures ----
const { data: tipuri } = await useFetch<{ id: number, denumire: string, tip: 'i' | 'e' | 't', denumire_scurta: string }[]>('/api/tipuri-documente', { default: () => [] })
const { data: locuri } = await useFetch('/api/locuri', { query: { stare: 'activ' }, default: () => [] })

// ---- header ----
const antet = reactive({
  idtipoperatiuni: null as number | null,
  tipMaterial: 'M' as TipMaterial,
  data: isoData(new Date()),
  nrdoc: '',
})
const linii = ref<LinieUI[]>([])
const stareDoc = ref<'activ' | 'inactiv'>('activ')
const needitabil = ref('')
const tipDoc = computed(() => tipuri.value.find(t => t.id === antet.idtipoperatiuni)?.tip ?? null)
const areSursa = computed(() => tipDoc.value === 'e' || tipDoc.value === 't')
const areDestinatie = computed(() => tipDoc.value === 'i' || tipDoc.value === 't')
const dataDoc = computed<Date>({
  get: () => dinIso(antet.data),
  set: (v) => {
    if (v) antet.data = isoData(v)
  },
})
const tipuriOptiuni = computed(() => tipuri.value.map(t => ({ ...t, eticheta: `${t.denumire} (${t.denumire_scurta})` })))
const blocat = computed(() => stareDoc.value !== 'activ' || !!needitabil.value)

const { data: categorii } = await useFetch<{ id: number, denumire: string }[]>('/api/categorii', {
  query: computed(() => ({ idgestiune: idCurent.value, tipmaterial: antet.tipMaterial, stare: 'activ' })),
  default: () => [],
  watch: [idCurent, () => antet.tipMaterial],
})
const numeLoc = (id?: number) => locuri.value.find(l => l.id === id)?.denumire ?? `#${id}`
const numeCateg = (id?: number) => categorii.value.find(c => c.id === id)?.denumire ?? `#${id}`

// ---- load an existing document ----
if (idDoc.value) {
  try {
    // useRequestFetch forwards the session cookie during SSR
    const doc = await useRequestFetch()(`/api/documente/${idDoc.value}`)
    Object.assign(antet, { idtipoperatiuni: doc.idtipoperatiuni, tipMaterial: doc.tipMaterial, data: doc.data, nrdoc: doc.nrdoc })
    stareDoc.value = doc.stare
    const r = linieDinDocument(doc.tip, doc.linii)
    linii.value = r.linii
    needitabil.value = r.motiv
    if (new Set(doc.linii.map(l => l.tip_material)).size > 1) needitabil.value = 'Documentul are linii cu tipuri de material diferite.'
  }
  catch (e) {
    notify.err(e)
    await navigateTo('/documente')
  }
}

type LinieDb = { id_reper: number, material: string, um: string, id_locdispunere: number, id_categ: number, stare_material: StareMaterial, cantitate_debit: string, cantitate_credit: string, pret: string }
function linieDinDocument(tip: 'i' | 'e' | 't', rows: LinieDb[]): { linii: LinieUI[], motiv: string } {
  const poz = (r: LinieDb): Pozitie => ({ idloc: r.id_locdispunere, idcateg: r.id_categ, stareMaterial: r.stare_material })
  const baza = (r: LinieDb, cant: string) => ({ idreper: r.id_reper, material: r.material, um: r.um, cantitate: Dec.toFixed(Dec.from(cant), 2), pret: r.pret })
  const out: LinieUI[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const debit = Dec.from(r.cantitate_debit) > 0n
    if (tip === 'i' && debit) out.push({ ...baza(r, r.cantitate_debit), destinatie: poz(r) })
    else if (tip === 'e' && !debit) out.push({ ...baza(r, r.cantitate_credit), sursa: poz(r) })
    else if (tip === 't' && !debit && rows[i + 1] && rows[i + 1]!.id_reper === r.id_reper && rows[i + 1]!.cantitate_debit === r.cantitate_credit) {
      out.push({ ...baza(r, r.cantitate_credit), sursa: poz(r), destinatie: poz(rows[i + 1]!) })
      i++
    }
    else return { linii: rows.map(x => ({ ...baza(x, Dec.from(x.cantitate_debit) > 0n ? x.cantitate_debit : x.cantitate_credit), destinatie: Dec.from(x.cantitate_debit) > 0n ? poz(x) : undefined, sursa: Dec.from(x.cantitate_debit) > 0n ? undefined : poz(x) })), motiv: 'Documentul importat are linii care nu se potrivesc tipului său (de ex. transfer fără pereche); poate fi doar vizualizat, tipărit sau invalidat.' }
  }
  return { linii: out, motiv: '' }
}

// ---- line entry panel ----
const editIndex = ref<number | null>(null)
const panou = reactive({
  sursaLoc: null as number | null,
  sursaCateg: null as number | null,
  destLoc: null as number | null,
  destCateg: null as number | null,
  destStare: 'NOU' as StareMaterial,
  /** Chosen stock row, as `id_reper|stare_material` (stable across stock reloads). */
  stocCheie: null as string | null,
  materialAles: null as MaterialRand | null,
  cantitate: '',
  pret: '',
})
const eroarePanou = ref('')
const refMaterial = ref()
const refCantitate = ref()

// stock for the chosen source (exits and transfers)
const stoc = ref<StocRand[]>([])
const seIncarcaStoc = ref(false)
let cerereStoc = 0
async function incarcaStoc() {
  const nr = ++cerereStoc
  stoc.value = []
  if (!areSursa.value || !panou.sursaLoc || !panou.sursaCateg || !idCurent.value) return
  seIncarcaStoc.value = true
  try {
    const r = await $fetch<StocRand[]>('/api/stocuri', {
      query: { idgestiune: idCurent.value, idloc: panou.sursaLoc, idcateg: panou.sursaCateg, tipMaterial: antet.tipMaterial, data: antet.data, exceptDocument: idDoc.value ?? undefined },
    })
    if (nr === cerereStoc) stoc.value = r
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    if (nr === cerereStoc) seIncarcaStoc.value = false
  }
}
watch(() => [panou.sursaLoc, panou.sursaCateg, antet.data, antet.tipMaterial, tipDoc.value], incarcaStoc)

const cheie = (p: Pozitie, idreper: number) => `${p.idloc}|${p.idcateg}|${p.stareMaterial}|${idreper}`
/** Quantity of a stock group already used by the other lines of this document. */
function folositInDocument(k: string) {
  return linii.value.reduce((s, l, i) => (i !== editIndex.value && l.sursa && cheie(l.sursa, l.idreper) === k ? s + Dec.from(l.cantitate) : s), 0n)
}
const optiuniStoc = computed(() => stoc.value.map((s) => {
  const disponibil = Dec.from(s.stoc) - folositInDocument(cheie({ idloc: panou.sursaLoc!, idcateg: panou.sursaCateg!, stareMaterial: s.stare_material }, s.id_reper))
  return { ...s, cheie: `${s.id_reper}|${s.stare_material}`, disponibil: Dec.toFixed(disponibil, 2), eticheta: `${s.denumire} · ${s.stare_material}` }
}).filter(s => Dec.from(s.disponibil) > 0n))
const stocAles = computed(() => optiuniStoc.value.find(o => o.cheie === panou.stocCheie) ?? null)

// materials for entries (server-side search)
const sugestii = ref<MaterialRand[]>([])
async function cautaMaterial(e: { query: string }) {
  try {
    const r = await $fetch<{ rows: MaterialRand[] }>('/api/materiale', { query: { idgestiune: idCurent.value, q: e.query, rows: 30, stare: 'activ' } })
    sugestii.value = r.rows
  }
  catch (err) {
    notify.err(err)
  }
}

const pretPanou = computed(() => (areSursa.value ? (stocAles.value?.pretmediu ?? '') : panou.pret))
const valoarePanou = computed(() => {
  try {
    if (!panou.cantitate || !pretPanou.value) return ''
    return Dec.toFixed(Dec.mul(Dec.from(normal(panou.cantitate)), Dec.from(normal(pretPanou.value))), 4)
  }
  catch {
    return ''
  }
})
const normal = (v: string) => v.trim().replace(',', '.')

watch(stocAles, (s) => {
  if (s && tipDoc.value === 't') panou.destStare = s.stare_material
})
watch(() => panou.materialAles, (m) => {
  if (m && typeof m === 'object' && !panou.pret && Dec.from(m.pretpredefinit) > 0n) panou.pret = m.pretpredefinit
})

function golestePanou() {
  Object.assign(panou, { stocCheie: null, materialAles: null, cantitate: '', pret: '' })
  eroarePanou.value = ''
  editIndex.value = null
}

function adaugaLinie() {
  eroarePanou.value = ''
  const cant = normal(panou.cantitate)
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cant) || Dec.from(cant) <= 0n) return (eroarePanou.value = 'Cantitate invalidă (maxim 2 zecimale, mai mare decât zero).')
  let linie: LinieUI
  if (areSursa.value) {
    const s = stocAles.value
    if (!panou.sursaLoc || !panou.sursaCateg || !s) return (eroarePanou.value = 'Alegeți locul, categoria și materialul din stoc.')
    const disp = s.disponibil
    if (Dec.from(cant) > Dec.from(disp)) return (eroarePanou.value = `Stoc insuficient: disponibil ${fmtNum(disp)} ${s.um}.`)
    linie = { idreper: s.id_reper, material: s.denumire, um: s.um, cantitate: cant, pret: s.pretmediu, sursa: { idloc: panou.sursaLoc, idcateg: panou.sursaCateg, stareMaterial: s.stare_material } }
    if (tipDoc.value === 't') {
      if (!panou.destLoc || !panou.destCateg) return (eroarePanou.value = 'Alegeți locul și categoria de destinație.')
      linie.destinatie = { idloc: panou.destLoc, idcateg: panou.destCateg, stareMaterial: panou.destStare }
    }
  }
  else {
    const m = panou.materialAles
    const pret = normal(panou.pret)
    if (!m || typeof m !== 'object') return (eroarePanou.value = 'Alegeți materialul.')
    if (!panou.destLoc || !panou.destCateg) return (eroarePanou.value = 'Alegeți locul și categoria.')
    if (!/^\d{1,10}(\.\d{1,4})?$/.test(pret)) return (eroarePanou.value = 'Preț unitar invalid (maxim 4 zecimale).')
    linie = { idreper: m.id, material: m.denumire, um: m.um, cantitate: cant, pret, destinatie: { idloc: panou.destLoc, idcateg: panou.destCateg, stareMaterial: panou.destStare } }
  }
  if (editIndex.value !== null) linii.value.splice(editIndex.value, 1, linie)
  else linii.value.push(linie)
  golestePanou()
  nextTick(() => refMaterial.value?.$el?.querySelector('input')?.focus())
}

function editeazaLinie(i: number) {
  const l = linii.value[i]!
  editIndex.value = i
  if (l.sursa) {
    // the stock row is resolved from the key once the stock list (re)loads
    Object.assign(panou, { sursaLoc: l.sursa.idloc, sursaCateg: l.sursa.idcateg, stocCheie: `${l.idreper}|${l.sursa.stareMaterial}` })
    incarcaStoc()
  }
  else {
    panou.materialAles = { id: l.idreper, denumire: l.material, um: l.um, cod_import: null, pretpredefinit: '0' }
    panou.pret = l.pret
  }
  if (l.destinatie) Object.assign(panou, { destLoc: l.destinatie.idloc, destCateg: l.destinatie.idcateg, destStare: l.destinatie.stareMaterial })
  panou.cantitate = l.cantitate
}

// quick material creation from the entry panel (legacy MaterialAdd)
const dialogMaterial = ref(false)
const materialNou = reactive({ denumire: '', um: 'buc', cod_import: '' })
const salvareMaterial = ref(false)
function deschideMaterialNou() {
  const text = typeof panou.materialAles === 'string' ? panou.materialAles as string : ''
  Object.assign(materialNou, { denumire: text, um: 'buc', cod_import: '' })
  dialogMaterial.value = true
}
async function creeazaMaterial() {
  salvareMaterial.value = true
  try {
    const r = await $fetch<{ material: MaterialRand, avertismente: string[] }>('/api/materiale', {
      method: 'POST',
      body: { idgestiune: idCurent.value, denumire: materialNou.denumire, um: materialNou.um, cod_import: materialNou.cod_import, pretpredefinit: '0' },
    })
    r.avertismente.forEach(a => notify.warn(a))
    panou.materialAles = r.material
    dialogMaterial.value = false
    notify.ok(`Materialul „${r.material.denumire}” a fost adăugat (cod ${r.material.id}).`)
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvareMaterial.value = false
  }
}

const valoareLinie = (l: LinieUI) => Dec.toFixed(Dec.mul(Dec.from(l.cantitate), Dec.from(l.pret)), 4)
const total = computed(() => Dec.toFixed(Dec.add(...linii.value.map(l => Dec.from(valoareLinie(l)))), 4))

// changing the document type or material type invalidates the lines
watch(tipDoc, (nou, vechi) => {
  if (vechi && nou !== vechi && linii.value.length && !blocat.value) {
    linii.value = []
    notify.warn('Liniile au fost șterse deoarece tipul documentului s-a schimbat (intrare / ieșire / transfer).')
  }
  golestePanou()
})
watch(() => antet.tipMaterial, (nou, vechi) => {
  if (nou !== vechi && linii.value.length && !blocat.value) {
    linii.value = []
    notify.warn('Liniile au fost șterse deoarece tipul de material s-a schimbat.')
  }
  Object.assign(panou, { sursaCateg: null, destCateg: null })
})

// ---- save ----
const salvare = ref(false)
async function salveaza() {
  if (blocat.value || salvare.value) return
  if (!antet.idtipoperatiuni) return notify.warn('Alegeți tipul documentului.')
  if (!antet.nrdoc.trim()) return notify.warn('Completați numărul documentului.')
  if (!linii.value.length) return notify.warn('Adăugați cel puțin o linie.')
  salvare.value = true
  try {
    const body = {
      idgestiune: idCurent.value,
      idtipoperatiuni: antet.idtipoperatiuni,
      tipMaterial: antet.tipMaterial,
      data: antet.data,
      nrdoc: antet.nrdoc,
      linii: linii.value.map(l => ({ idreper: l.idreper, cantitate: l.cantitate, pret: tipDoc.value === 'i' ? l.pret : undefined, sursa: l.sursa, destinatie: l.destinatie })),
    }
    const r = idDoc.value
      ? await $fetch<{ id: number, avertismente: string[] }>(`/api/documente/${idDoc.value}`, { method: 'PUT', body })
      : await $fetch<{ id: number, avertismente: string[] }>('/api/documente', { method: 'POST', body })
    notify.ok(idDoc.value ? 'Documentul a fost modificat.' : `Documentul a fost salvat (nr. intern ${r.id}).`)
    r.avertismente.forEach(a => notify.warn(a))
    await navigateTo('/documente')
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

function laTasta(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    salveaza()
  }
}
onMounted(() => window.addEventListener('keydown', laTasta))
onBeforeUnmount(() => window.removeEventListener('keydown', laTasta))

const tipuriMaterial = TIPURI_MATERIAL.map(v => ({ v, l: DENUMIRI_TIP_MATERIAL[v] }))
</script>

<template>
  <div class="doc-page">
    <div class="page-head">
      <h1>
        {{ idDoc ? `Document nr. intern ${idDoc}` : 'Document nou' }}
        <span class="sub">{{ gestiuneCurenta?.denumire }}</span>
      </h1>
      <Button
        v-if="idDoc"
        as="a"
        :href="`/rapoarte/document/${idDoc}`"
        target="_blank"
        label="Tipărește"
        icon="pi pi-print"
        severity="secondary"
        outlined
      />
      <Button
        as="router-link"
        to="/documente"
        label="Înapoi la listă"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
      />
    </div>

    <Message
      v-if="stareDoc !== 'activ'"
      severity="warn"
      class="mb"
    >
      Documentul este invalidat și nu mai poate fi modificat.
    </Message>
    <Message
      v-else-if="needitabil"
      severity="warn"
      class="mb"
    >
      {{ needitabil }}
    </Message>

    <section class="card antet">
      <div class="field">
        <label for="tip-mat">Tip material</label>
        <SelectButton
          v-model="antet.tipMaterial"
          :options="tipuriMaterial"
          option-label="l"
          option-value="v"
          :allow-empty="false"
          :disabled="blocat"
          aria-labelledby="tip-mat"
        />
      </div>
      <div class="field">
        <label for="tip-doc">Tip document</label>
        <Select
          v-model="antet.idtipoperatiuni"
          input-id="tip-doc"
          :options="tipuriOptiuni"
          option-label="eticheta"
          option-value="id"
          placeholder="Alegeți tipul"
          filter
          auto-filter-focus
          :disabled="blocat"
        />
      </div>
      <div class="field">
        <label for="data-doc">Data</label>
        <DatePicker
          v-model="dataDoc"
          input-id="data-doc"
          date-format="dd.mm.yy"
          show-icon
          icon-display="input"
          :disabled="blocat"
        />
      </div>
      <div class="field">
        <label for="nr-doc">Număr document</label>
        <InputText
          id="nr-doc"
          v-model="antet.nrdoc"
          maxlength="25"
          :disabled="blocat"
        />
      </div>
    </section>

    <section
      v-if="tipDoc && !blocat"
      class="card panou"
      @keydown.enter.prevent="adaugaLinie"
    >
      <h2>{{ editIndex !== null ? `Modifică linia ${editIndex + 1}` : 'Linie nouă' }}</h2>
      <div class="panou-grid">
        <fieldset v-if="areSursa">
          <legend>{{ tipDoc === 't' ? 'Din (sursă)' : 'Ieșire din' }}</legend>
          <div class="field">
            <label for="s-loc">Loc de dispunere</label>
            <Select
              v-model="panou.sursaLoc"
              input-id="s-loc"
              :options="locuri"
              option-label="denumire"
              option-value="id"
              filter
              auto-filter-focus
              placeholder="Loc"
            />
          </div>
          <div class="field">
            <label for="s-categ">Categorie</label>
            <Select
              v-model="panou.sursaCateg"
              input-id="s-categ"
              :options="categorii"
              option-label="denumire"
              option-value="id"
              placeholder="Categorie"
            />
          </div>
          <div class="field">
            <label for="s-mat">Material din stoc</label>
            <Select
              ref="refMaterial"
              v-model="panou.stocCheie"
              input-id="s-mat"
              :options="optiuniStoc"
              option-label="eticheta"
              option-value="cheie"
              filter
              auto-filter-focus
              :loading="seIncarcaStoc"
              :disabled="!panou.sursaLoc || !panou.sursaCateg"
              :placeholder="panou.sursaLoc && panou.sursaCateg ? (optiuniStoc.length ? 'Alegeți materialul' : 'Niciun material în stoc') : 'Alegeți întâi locul și categoria'"
              :virtual-scroller-options="optiuniStoc.length > 60 ? { itemSize: 52 } : undefined"
            >
              <template #option="{ option }">
                <div class="opt">
                  <span>{{ option.denumire }} <span class="muted">({{ option.um }})</span></span>
                  <small class="muted">{{ option.stare_material }} · stoc {{ fmtNum(option.disponibil) }} · preț mediu {{ fmtNum(option.pretmediu, 4) }}</small>
                </div>
              </template>
            </Select>
            <small
              v-if="stocAles"
              class="muted"
            >Disponibil: {{ fmtNum(stocAles.disponibil) }} {{ stocAles.um }} · stare {{ stocAles.stare_material }}</small>
          </div>
        </fieldset>

        <fieldset v-if="areDestinatie">
          <legend>{{ tipDoc === 't' ? 'În (destinație)' : 'Intrare în' }}</legend>
          <div class="field">
            <label for="d-loc">Loc de dispunere</label>
            <Select
              v-model="panou.destLoc"
              input-id="d-loc"
              :options="locuri"
              option-label="denumire"
              option-value="id"
              filter
              auto-filter-focus
              placeholder="Loc"
            />
          </div>
          <div class="field">
            <label for="d-categ">Categorie</label>
            <Select
              v-model="panou.destCateg"
              input-id="d-categ"
              :options="categorii"
              option-label="denumire"
              option-value="id"
              placeholder="Categorie"
            />
          </div>
          <div class="field">
            <label for="d-stare">Stare material</label>
            <SelectButton
              v-model="panou.destStare"
              :options="[...STARI_MATERIAL]"
              :allow-empty="false"
              aria-labelledby="d-stare"
            />
          </div>
          <div
            v-if="tipDoc === 'i'"
            class="field"
          >
            <label for="d-mat">Material</label>
            <AutoComplete
              ref="refMaterial"
              v-model="panou.materialAles"
              input-id="d-mat"
              :suggestions="sugestii"
              option-label="denumire"
              :delay="250"
              force-selection
              placeholder="Caută după denumire sau cod…"
              fluid
              @complete="cautaMaterial"
            >
              <template #option="{ option }">
                <div class="opt">
                  <span>{{ option.denumire }} <span class="muted">({{ option.um }})</span></span>
                  <small class="muted">cod {{ option.id }}{{ option.cod_import ? ` · cod import ${option.cod_import}` : '' }}</small>
                </div>
              </template>
            </AutoComplete>
            <Button
              label="Material nou"
              icon="pi pi-plus"
              size="small"
              text
              class="self-start"
              @click="deschideMaterialNou"
            />
          </div>
        </fieldset>

        <fieldset class="cant">
          <legend>Cantitate și valoare</legend>
          <div class="field">
            <label for="cant">Cantitate {{ stocAles?.um ?? (panou.materialAles as MaterialRand | null)?.um ?? '' }}</label>
            <InputText
              id="cant"
              ref="refCantitate"
              v-model="panou.cantitate"
              inputmode="decimal"
              placeholder="0,00"
            />
          </div>
          <div class="field">
            <label for="pret">Preț unitar (lei)</label>
            <InputText
              v-if="tipDoc === 'i'"
              id="pret"
              v-model="panou.pret"
              inputmode="decimal"
              placeholder="0,0000"
            />
            <InputText
              v-else
              id="pret"
              :model-value="pretPanou ? fmtNum(pretPanou, 4) : ''"
              readonly
              placeholder="preț mediu din stoc"
            />
          </div>
          <div class="valoare">
            <span class="muted">Valoare</span>
            <strong>{{ valoarePanou ? `${fmtNum(valoarePanou, 2)} lei` : '—' }}</strong>
          </div>
          <Message
            v-if="eroarePanou"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ eroarePanou }}
          </Message>
          <div class="panou-actiuni">
            <Button
              :label="editIndex !== null ? 'Actualizează linia' : 'Adaugă linia'"
              icon="pi pi-plus"
              @click="adaugaLinie"
            />
            <Button
              v-if="editIndex !== null"
              label="Renunță"
              severity="secondary"
              text
              @click="golestePanou"
            />
          </div>
          <small class="muted">Enter adaugă linia · Ctrl+S salvează documentul</small>
        </fieldset>
      </div>
    </section>

    <section class="card">
      <DataTable
        :value="linii"
        size="small"
        scrollable
        striped-rows
      >
        <template #empty>
          Nicio linie. {{ tipDoc ? 'Completați panoul de mai sus și apăsați Enter.' : 'Alegeți întâi tipul documentului.' }}
        </template>
        <Column
          header="#"
          style="width: 3rem"
        >
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column header="Material">
          <template #body="{ data: l }">
            {{ l.material }} <span class="muted">({{ l.um }})</span>
          </template>
        </Column>
        <Column
          v-if="areSursa || (blocat && linii.some(l => l.sursa))"
          header="Din"
        >
          <template #body="{ data: l }">
            <span v-if="l.sursa">{{ numeLoc(l.sursa.idloc) }} · {{ numeCateg(l.sursa.idcateg) }} · {{ l.sursa.stareMaterial }}</span>
          </template>
        </Column>
        <Column
          v-if="areDestinatie || (blocat && linii.some(l => l.destinatie))"
          header="În"
        >
          <template #body="{ data: l }">
            <span v-if="l.destinatie">{{ numeLoc(l.destinatie.idloc) }} · {{ numeCateg(l.destinatie.idcateg) }} · {{ l.destinatie.stareMaterial }}</span>
          </template>
        </Column>
        <Column
          header="Cantitate"
          class="num"
        >
          <template #body="{ data: l }">
            {{ fmtNum(l.cantitate) }}
          </template>
        </Column>
        <Column
          header="Preț"
          class="num"
        >
          <template #body="{ data: l }">
            {{ fmtNum(l.pret, 4) }}
          </template>
        </Column>
        <Column
          header="Valoare"
          class="num"
        >
          <template #body="{ data: l }">
            {{ fmtNum(valoareLinie(l)) }}
          </template>
        </Column>
        <Column
          v-if="!blocat"
          style="width: 6rem; text-align: right"
        >
          <template #body="{ index }">
            <Button
              v-tooltip.top="'Modifică linia'"
              icon="pi pi-pencil"
              text
              rounded
              aria-label="Modifică linia"
              @click="editeazaLinie(index)"
            />
            <Button
              v-tooltip.top="'Șterge linia'"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Șterge linia"
              @click="linii.splice(index, 1); golestePanou()"
            />
          </template>
        </Column>
      </DataTable>
      <div class="doc-footer">
        <div class="total">
          <span class="muted">Total document{{ areSursa ? ' (estimat la preț mediu)' : '' }}</span>
          <strong>{{ fmtNum(total) }} lei</strong>
        </div>
        <Button
          v-if="!blocat"
          :label="idDoc ? 'Salvează modificările' : 'Salvează documentul'"
          icon="pi pi-check"
          :loading="salvare"
          :disabled="!linii.length"
          @click="salveaza"
        />
      </div>
    </section>

    <Dialog
      v-model:visible="dialogMaterial"
      header="Material nou"
      modal
      :style="{ width: 'min(460px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="creeazaMaterial"
        @keydown.enter.stop
      >
        <div class="field field-wide">
          <label for="mn-den">Denumire</label>
          <InputText
            id="mn-den"
            v-model="materialNou.denumire"
            maxlength="100"
            autofocus
          />
        </div>
        <div class="field">
          <label for="mn-um">U.M.</label>
          <InputText
            id="mn-um"
            v-model="materialNou.um"
            maxlength="15"
          />
        </div>
        <div class="field">
          <label for="mn-cod">Cod import</label>
          <InputText
            id="mn-cod"
            v-model="materialNou.cod_import"
            maxlength="45"
          />
        </div>
        <button
          type="submit"
          hidden
        />
      </form>
      <template #footer>
        <Button
          label="Renunță"
          severity="secondary"
          text
          @click="dialogMaterial = false"
        />
        <Button
          label="Adaugă materialul"
          icon="pi pi-check"
          :loading="salvareMaterial"
          @click="creeazaMaterial"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.doc-page { display: flex; flex-direction: column; gap: 1rem; }
.mb { margin-bottom: 0; }
.antet { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end; }
.panou h2 { font-size: 1rem; margin: 0 0 0.75rem; }
.panou-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
fieldset { border: 1px solid var(--app-border); border-radius: 10px; padding: 0.75rem; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; min-width: 0; }
legend { font-weight: 600; padding: 0 0.35rem; color: var(--p-primary-color); }
.opt { display: flex; flex-direction: column; }
.self-start { align-self: flex-start; }
.valoare { display: flex; justify-content: space-between; align-items: baseline; font-size: 1.05rem; }
.panou-actiuni { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.doc-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem; }
.total { display: flex; flex-direction: column; }
.total strong { font-size: 1.3rem; }
</style>
