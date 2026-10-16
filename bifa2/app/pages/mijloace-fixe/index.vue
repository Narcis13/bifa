<script setup lang="ts">
import { DENUMIRI_STARI_MF } from '#shared/schemas/mijloace-fixe'

useHead({ title: 'Mijloace fixe – BIFA' })
const { idCurent, gestiuneCurenta } = useSesiune()
const notify = useNotify()

interface Rand {
  id: number
  nr_inventar: string
  denumire: string
  cod_clasificare: string
  grupa: number
  valoare_intrare: string
  amortizare_cumulata: string
  valoare_ramasa: string
  amortizare_lunara: string
  durata_luni: number
  data_punere_functiune: string
  stare_mf: 'in_functiune' | 'casat'
  loc: string
  categorie: string
}

const cautare = ref('')
const stareMf = ref<'in_functiune' | 'casat' | 'toate'>('in_functiune')
const idloc = ref<number | null>(null)
const first = ref(0)
const pe = ref(50)
const rows = ref<Rand[]>([])
const total = ref(0)
const loading = ref(false)

const { data: locuri } = await useFetch<{ id: number, denumire: string }[]>('/api/locuri', {
  query: { stare: 'activ' },
  default: () => [],
})

let cerere = 0
async function incarca() {
  if (!idCurent.value) {
    rows.value = []
    total.value = 0
    return
  }
  const nr = ++cerere
  loading.value = true
  try {
    const r = await $fetch<{ rows: Rand[], total: number }>('/api/mijloace-fixe', {
      query: {
        idgestiune: idCurent.value,
        q: cautare.value.trim() || undefined,
        stare_mf: stareMf.value,
        idloc: idloc.value ?? undefined,
        page: Math.floor(first.value / pe.value) + 1,
        rows: pe.value,
      },
    })
    if (nr !== cerere) return
    rows.value = r.rows
    total.value = r.total
  }
  catch (e) {
    if (nr === cerere) notify.err(e)
  }
  finally {
    if (nr === cerere) loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(cautare, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    first.value = 0
    incarca()
  }, 350)
})
watch([stareMf, idloc, idCurent], () => {
  first.value = 0
  incarca()
})
onMounted(incarca)
onBeforeUnmount(() => clearTimeout(timer))

function laPagina(e: { first: number, rows: number }) {
  first.value = e.first
  pe.value = e.rows
  incarca()
}

const fisaUrl = (id: number) => `/rapoarte/fisa-mf?idgestiune=${idCurent.value}&idmijloc=${id}`
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Registru mijloace fixe
        <span class="sub">{{ gestiuneCurenta?.denumire }}</span>
      </h1>
      <Button
        as="router-link"
        to="/mijloace-fixe/inregistrare"
        label="Înregistrare"
        icon="pi pi-plus"
      />
    </div>
    <div class="card">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="cautare"
            placeholder="Caută nr. inventar, denumire, clasificare…"
            class="cautare"
          />
        </IconField>
        <SelectButton
          v-model="stareMf"
          :options="[
            { v: 'in_functiune', l: 'În funcțiune' },
            { v: 'casat', l: 'Casate' },
            { v: 'toate', l: 'Toate' },
          ]"
          option-label="l"
          option-value="v"
          :allow-empty="false"
        />
        <Select
          v-model="idloc"
          :options="[{ id: null, denumire: 'Toate locurile' }, ...(locuri ?? [])]"
          option-label="denumire"
          option-value="id"
          placeholder="Loc"
          class="loc"
          show-clear
        />
      </div>
      <DataTable
        :value="rows"
        :loading="loading"
        :lazy="true"
        :paginator="true"
        :rows="pe"
        :total-records="total"
        :first="first"
        data-key="id"
        striped-rows
        size="small"
        @page="laPagina"
      >
        <Column
          field="nr_inventar"
          header="Nr. inventar"
          style="width: 8rem"
        >
          <template #body="{ data }">
            <NuxtLink :to="`/mijloace-fixe/${data.id}`">
              {{ data.nr_inventar }}
            </NuxtLink>
          </template>
        </Column>
        <Column
          field="denumire"
          header="Denumire"
        />
        <Column
          field="cod_clasificare"
          header="Clasificare"
          style="width: 7rem"
        />
        <Column
          field="loc"
          header="Loc"
          style="width: 9rem"
        />
        <Column
          field="categorie"
          header="Categorie"
          style="width: 10rem"
        />
        <Column
          field="valoare_intrare"
          header="Val. intrare"
          style="width: 8rem"
        >
          <template #body="{ data }">
            {{ fmtNum(data.valoare_intrare, 2) }}
          </template>
        </Column>
        <Column
          field="amortizare_cumulata"
          header="Amort. cumulată"
          style="width: 8rem"
        >
          <template #body="{ data }">
            {{ fmtNum(data.amortizare_cumulata, 2) }}
          </template>
        </Column>
        <Column
          field="valoare_ramasa"
          header="Val. rămasă"
          style="width: 8rem"
        >
          <template #body="{ data }">
            {{ fmtNum(data.valoare_ramasa, 2) }}
          </template>
        </Column>
        <Column
          field="stare_mf"
          header="Stare"
          style="width: 7rem"
        >
          <template #body="{ data }">
            <Tag
              :value="DENUMIRI_STARI_MF[data.stare_mf as 'in_functiune' | 'casat']"
              :severity="data.stare_mf === 'in_functiune' ? 'success' : 'danger'"
            />
          </template>
        </Column>
        <Column style="width: 5rem">
          <template #body="{ data }">
            <Button
              v-tooltip.top="'Fișa mijlocului fix'"
              as="a"
              :href="fisaUrl(data.id)"
              target="_blank"
              icon="pi pi-print"
              text
              rounded
              severity="secondary"
            />
          </template>
        </Column>
        <template #empty>
          <div class="empty">
            Nu există mijloace fixe pentru filtrele alese.
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
.cautare { min-width: 16rem; }
.loc { min-width: 12rem; }
.empty { padding: 1.5rem; text-align: center; color: var(--app-muted); }
</style>
