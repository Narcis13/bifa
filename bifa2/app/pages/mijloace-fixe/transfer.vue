<script setup lang="ts">
useHead({ title: 'Transfer mijloace fixe – BIFA' })
const notify = useNotify()
const { idCurent, gestiuneCurenta } = useSesiune()

const { data: tipuri } = await useFetch<{ id: number, denumire: string, tip: string, denumire_scurta: string }[]>(
  '/api/tipuri-documente', { default: () => [] },
)
const tipuriTransfer = computed(() => (tipuri.value ?? [])
  .filter(t => t.tip === 't')
  .map(t => ({ ...t, eticheta: `${t.denumire} (${t.denumire_scurta})` })))

const { data: locuri } = await useFetch<{ id: number, denumire: string }[]>('/api/locuri', {
  query: { stare: 'activ' }, default: () => [],
})

const form = reactive({
  idtipoperatiuni: null as number | null,
  data: isoData(new Date()),
  nrdoc: '',
  observatii: '',
  idloc_sursa: null as number | null,
  idloc_destinatie: null as number | null,
})
type RandMf = { id: number, nr_inventar: string, denumire: string, valoare_intrare: string, loc: string }
const selectate = ref<RandMf[]>([])
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
      idloc: form.idloc_sursa ?? undefined,
      rows: 200,
    })),
    immediate: false,
    watch: false,
  },
)

watch(() => form.idloc_sursa, () => {
  selectate.value = []
  if (form.idloc_sursa) refresh()
})

async function salveaza() {
  if (!form.idtipoperatiuni || !form.nrdoc || !form.idloc_destinatie || !selectate.value.length) {
    notify.err('Completați tipul, numărul documentului, destinația și selectați cel puțin un mijloc fix.')
    return
  }
  if (form.idloc_sursa === form.idloc_destinatie) {
    notify.err('Locul de destinație trebuie să fie diferit de sursă.')
    return
  }
  salvare.value = true
  try {
    const r = await $fetch<{ transferate: number }>('/api/mijloace-fixe/transfer', {
      method: 'POST',
      body: {
        idgestiune: idCurent.value,
        idtipoperatiuni: form.idtipoperatiuni,
        data: form.data,
        nrdoc: form.nrdoc,
        observatii: form.observatii || undefined,
        idloc_destinatie: form.idloc_destinatie,
        idmijloace: selectate.value.map(m => m.id),
      },
    })
    notify.ok(`Au fost transferate ${r.transferate} mijloace fixe.`)
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
        Transfer între locuri
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
        label="Transferă"
        icon="pi pi-check"
        :loading="salvare"
        :disabled="!selectate.length"
        @click="salveaza"
      />
    </div>

    <div class="card">
      <div class="campuri">
        <label>
          Tip act (transfer)
          <Select
            v-model="form.idtipoperatiuni"
            :options="tipuriTransfer"
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
        <label>
          Loc sursă
          <Select
            v-model="form.idloc_sursa"
            :options="locuri ?? []"
            option-label="denumire"
            option-value="id"
            placeholder="Alegeți locul"
            class="w"
          />
        </label>
        <label>
          Loc destinație
          <Select
            v-model="form.idloc_destinatie"
            :options="(locuri ?? []).filter(l => l.id !== form.idloc_sursa)"
            option-label="denumire"
            option-value="id"
            placeholder="Alegeți destinația"
            class="w"
          />
        </label>
        <label>
          Observații
          <InputText
            v-model="form.observatii"
            class="w"
          />
        </label>
      </div>
    </div>

    <div class="card">
      <h2>Mijloace fixe la locul sursă ({{ selectate.length }} selectate)</h2>
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
          field="valoare_intrare"
          header="Valoare"
        >
          <template #body="{ data }">
            {{ fmtNum(data.valoare_intrare, 2) }}
          </template>
        </Column>
        <template #empty>
          <div class="empty">
            {{ form.idloc_sursa ? 'Nu există mijloace fixe la acest loc.' : 'Alegeți locul sursă.' }}
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.campuri { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem 1rem; margin-bottom: 0.5rem; }
@media (max-width: 900px) { .campuri { grid-template-columns: 1fr; } }
.campuri label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--app-muted); }
.w { width: 100%; }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
.card + .card { margin-top: 1rem; }
.empty { padding: 1.5rem; text-align: center; color: var(--app-muted); }
</style>
