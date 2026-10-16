<script setup lang="ts">
useHead({ title: 'Casare mijloace fixe – BIFA' })
const notify = useNotify()
const { idCurent, gestiuneCurenta } = useSesiune()

const { data: tipuri } = await useFetch<{ id: number, denumire: string, tip: string, denumire_scurta: string }[]>(
  '/api/tipuri-documente', { default: () => [] },
)
const tipuriIesire = computed(() => (tipuri.value ?? [])
  .filter(t => t.tip === 'e')
  .map(t => ({ ...t, eticheta: `${t.denumire} (${t.denumire_scurta})` })))

const form = reactive({
  idtipoperatiuni: null as number | null,
  data: isoData(new Date()),
  nrdoc: '',
  observatii: '',
})
type RandMf = {
  id: number
  nr_inventar: string
  denumire: string
  valoare_intrare: string
  amortizare_cumulata: string
  valoare_ramasa: string
  loc: string
}
const selectate = ref<RandMf[]>([])
const cautare = ref('')
const salvare = ref(false)

const dataDoc = computed<Date>({
  get: () => dinIso(form.data),
  set: (v) => { if (v) form.data = isoData(v) },
})

const { data: lista, refresh, status } = await useFetch<{ rows: RandMf[], total: number }>(
  '/api/mijloace-fixe',
  {
    query: computed(() => ({
      idgestiune: idCurent.value,
      stare_mf: 'in_functiune',
      q: cautare.value.trim() || undefined,
      rows: 200,
    })),
    watch: [idCurent, cautare],
  },
)

async function salveaza() {
  if (!form.idtipoperatiuni || !form.nrdoc || !selectate.value.length) {
    notify.err('Completați tipul, numărul documentului și selectați cel puțin un mijloc fix.')
    return
  }
  salvare.value = true
  try {
    const r = await $fetch<{ casate: number }>('/api/mijloace-fixe/casare', {
      method: 'POST',
      body: {
        idgestiune: idCurent.value,
        idtipoperatiuni: form.idtipoperatiuni,
        data: form.data,
        nrdoc: form.nrdoc,
        observatii: form.observatii || undefined,
        idmijloace: selectate.value.map(m => m.id),
      },
    })
    notify.ok(`Au fost casate ${r.casate} mijloace fixe.`)
    selectate.value = []
    form.nrdoc = ''
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Casare (ieșire)
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
        label="Casează"
        icon="pi pi-trash"
        severity="danger"
        :loading="salvare"
        :disabled="!selectate.length"
        @click="salveaza"
      />
    </div>

    <Message
      severity="warn"
      class="mb"
    >
      Casarea scoate mijlocul fix din funcțiune. Amortizarea lunară se oprește; valoarea rămasă rămâne evidențiată pe fișă.
    </Message>

    <div class="card">
      <div class="campuri">
        <label>
          Tip act (ieșire)
          <Select
            v-model="form.idtipoperatiuni"
            :options="tipuriIesire"
            option-label="eticheta"
            option-value="id"
            class="w"
          />
        </label>
        <label>
          Data
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
          />
        </label>
        <label class="span2">
          Observații / motiv casare
          <InputText
            v-model="form.observatii"
            class="w"
          />
        </label>
        <label>
          Caută
          <InputText
            v-model="cautare"
            placeholder="Nr. inventar / denumire"
            class="w"
          />
        </label>
      </div>
    </div>

    <div class="card">
      <h2>Selectați mijloacele de casat ({{ selectate.length }})</h2>
      <DataTable
        v-model:selection="selectate"
        :value="lista?.rows ?? []"
        :loading="status === 'pending'"
        data-key="id"
        selection-mode="multiple"
        striped-rows
        size="small"
      >
        <Column
          selection-mode="multiple"
          header-style="width: 3rem"
        />
        <Column
          field="nr_inventar"
          header="Nr. inventar"
        />
        <Column
          field="denumire"
          header="Denumire"
        />
        <Column
          field="loc"
          header="Loc"
        />
        <Column
          field="valoare_intrare"
          header="Val. intrare"
        >
          <template #body="{ data }">
            {{ fmtNum(data.valoare_intrare, 2) }}
          </template>
        </Column>
        <Column
          field="amortizare_cumulata"
          header="Amort. cumulată"
        >
          <template #body="{ data }">
            {{ fmtNum(data.amortizare_cumulata, 2) }}
          </template>
        </Column>
        <Column
          field="valoare_ramasa"
          header="Val. rămasă"
        >
          <template #body="{ data }">
            {{ fmtNum(data.valoare_ramasa, 2) }}
          </template>
        </Column>
        <template #empty>
          <div class="empty">
            Nu există mijloace fixe în funcțiune.
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.mb { margin-bottom: 1rem; }
.campuri { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem 1rem; }
@media (max-width: 900px) { .campuri { grid-template-columns: 1fr; } }
.campuri label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--app-muted); }
.span2 { grid-column: span 2; }
.w { width: 100%; }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
.card + .card { margin-top: 1rem; }
.empty { padding: 1.5rem; text-align: center; color: var(--app-muted); }
</style>
