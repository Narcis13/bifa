<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { UM_UZUALE, materialPatchSchema, materialSchema } from '#shared/schemas/materiale'
import type { MaterialRezultat, MaterialRow, SortFieldMateriale } from '#shared/schemas/materiale'

useHead({ title: 'Materiale – BIFA' })
const notify = useNotify()
const confirm = useConfirm()
const { idCurent, gestiuneCurenta } = useSesiune()

const STARI_FILTRU = [
  { label: 'Active', value: 'activ' },
  { label: 'Inactive', value: 'inactiv' },
  { label: 'Toate', value: 'toate' },
]

// ---- list (lazy, server-side) ----
const rows = ref<MaterialRow[]>([])
const total = ref(0)
const loading = ref(false)
const cautare = ref('')
const stareFiltru = ref<'activ' | 'inactiv' | 'toate'>('activ')
const first = ref(0)
const pe = ref(20)
const sortField = ref<SortFieldMateriale>('denumire')
const sortOrder = ref<1 | -1>(1)

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
    const r = await $fetch<{ rows: MaterialRow[], total: number }>('/api/materiale', {
      query: {
        idgestiune: idCurent.value,
        q: cautare.value.trim() || undefined,
        stare: stareFiltru.value,
        page: Math.floor(first.value / pe.value) + 1,
        rows: pe.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value,
      },
    })
    if (nr !== cerere) return
    if (!r.rows.length && r.total > 0 && first.value > 0) {
      first.value = Math.max(0, (Math.ceil(r.total / pe.value) - 1) * pe.value)
      return incarca()
    }
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

let timerCautare: ReturnType<typeof setTimeout> | undefined
watch(cautare, () => {
  clearTimeout(timerCautare)
  timerCautare = setTimeout(() => {
    first.value = 0
    incarca()
  }, 350)
})
watch([stareFiltru, idCurent], () => {
  first.value = 0
  incarca()
})
onMounted(incarca)
onBeforeUnmount(() => {
  clearTimeout(timerCautare)
  clearTimeout(timerDuplicat)
})

function laPagina(e: { first: number, rows: number }) {
  first.value = e.first
  pe.value = e.rows
  incarca()
}
function laSortare(e: { sortField?: unknown, sortOrder?: number | null }) {
  sortField.value = e.sortOrder && typeof e.sortField === 'string' ? e.sortField as SortFieldMateriale : 'denumire'
  sortOrder.value = e.sortOrder === -1 ? -1 : 1
  first.value = 0
  incarca()
}

// ---- add / edit ----
const dialog = ref(false)
const editId = ref<number | null>(null)
const denumireInitiala = ref('')
const form = reactive({ denumire: '', um: 'buc', cod_import: '' })
const pret = ref<number | null>(0)
const erori = ref<Record<string, string>>({})
const salvare = ref(false)
const duplicat = ref<{ id: number, denumire: string } | null>(null)
const seCautaCod = ref(false)

function deschide(m?: MaterialRow) {
  editId.value = m?.id ?? null
  denumireInitiala.value = m?.denumire ?? ''
  Object.assign(form, { denumire: m?.denumire ?? '', um: m?.um ?? 'buc', cod_import: m?.cod_import ?? '' })
  pret.value = m ? Number(m.pretpredefinit) : 0
  erori.value = {}
  duplicat.value = null
  dialog.value = true
}

/** InputNumber works with JS numbers; the API takes the exact 4-decimal string. */
const pretText = computed(() => (pret.value == null ? '0' : pret.value.toFixed(4)))

let timerDuplicat: ReturnType<typeof setTimeout> | undefined
watch(() => form.denumire, (den) => {
  clearTimeout(timerDuplicat)
  duplicat.value = null
  const d = den.trim()
  if (!dialog.value || !d || !idCurent.value || (editId.value && d === denumireInitiala.value)) return
  timerDuplicat = setTimeout(async () => {
    try {
      const r = await $fetch<{ duplicat: { id: number, denumire: string } | null }>('/api/materiale/duplicate', {
        query: { idgestiune: idCurent.value, denumire: d, excludeId: editId.value ?? undefined },
      })
      if (form.denumire.trim() === d) duplicat.value = r.duplicat
    }
    catch { /* the warning is only a convenience */ }
  }, 350)
})

async function ultimulCod() {
  if (!idCurent.value) return
  seCautaCod.value = true
  try {
    const r = await $fetch<{ ultimulCod: string | null, urmatorulCod: string | null }>('/api/materiale/ultimul-cod', {
      query: { idgestiune: idCurent.value },
    })
    if (!r.ultimulCod) {
      notify.warn('Gestiunea nu are încă niciun cod de import.')
      return
    }
    form.cod_import = r.urmatorulCod ?? r.ultimulCod
    notify.ok(r.urmatorulCod ? `Ultimul cod este ${r.ultimulCod}; s-a propus ${r.urmatorulCod}.` : `Ultimul cod este ${r.ultimulCod}.`)
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    seCautaCod.value = false
  }
}

async function salveaza() {
  const date = { denumire: form.denumire, um: form.um, pretpredefinit: pretText.value, cod_import: form.cod_import }
  const r = editId.value
    ? materialPatchSchema.safeParse(date)
    : materialSchema.safeParse({ ...date, idgestiune: idCurent.value })
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  erori.value = {}
  salvare.value = true
  try {
    const body = editId.value ? date : { ...date, idgestiune: idCurent.value }
    const res = editId.value
      ? await $fetch<MaterialRezultat>(`/api/materiale/${editId.value}`, { method: 'PATCH', body })
      : await $fetch<MaterialRezultat>('/api/materiale', { method: 'POST', body })
    notify.ok(editId.value ? 'Materialul a fost modificat.' : `Materialul a fost adăugat (cod ${res.material.id}).`)
    res.avertismente.forEach(a => notify.warn(a))
    dialog.value = false
    await incarca()
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

// ---- activate / deactivate ----
function comutaStare(m: MaterialRow) {
  const dezactivare = m.stare === 'activ'
  confirm.require({
    header: dezactivare ? 'Dezactivare material' : 'Activare material',
    message: dezactivare
      ? `Dezactivați materialul „${m.denumire}”? Rămâne în documentele existente, dar nu mai poate fi ales în documente noi.`
      : `Activați din nou materialul „${m.denumire}”?`,
    icon: dezactivare ? 'pi pi-exclamation-triangle' : 'pi pi-question-circle',
    acceptLabel: dezactivare ? 'Dezactivează' : 'Activează',
    rejectLabel: 'Renunță',
    rejectProps: { severity: 'secondary', text: true },
    acceptProps: { severity: dezactivare ? 'danger' : 'primary' },
    accept: async () => {
      try {
        const res = await $fetch<MaterialRezultat>(`/api/materiale/${m.id}`, {
          method: 'PATCH',
          body: { stare: dezactivare ? 'inactiv' : 'activ' },
        })
        notify.ok(dezactivare ? 'Materialul a fost dezactivat.' : 'Materialul a fost activat.')
        res.avertismente.forEach(a => notify.warn(a))
        await incarca()
      }
      catch (e) {
        notify.err(e)
      }
    },
  })
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Materiale
        <span class="sub">Nomenclatorul de materiale{{ gestiuneCurenta ? ` – ${gestiuneCurenta.denumire}` : '' }}</span>
      </h1>
      <Button
        label="Material nou"
        icon="pi pi-plus"
        :disabled="!idCurent"
        @click="deschide()"
      />
    </div>

    <div class="card">
      <p
        v-if="!idCurent"
        class="muted"
      >
        Alegeți o gestiune pentru a vedea materialele.
      </p>
      <template v-else>
        <div class="toolbar">
          <IconField class="cautare">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="cautare"
              placeholder="Caută după denumire, cod import sau cod…"
              aria-label="Caută material"
            />
          </IconField>
          <SelectButton
            v-model="stareFiltru"
            :options="STARI_FILTRU"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-label="Filtru stare"
          />
        </div>

        <DataTable
          :value="rows"
          :loading="loading"
          lazy
          paginator
          scrollable
          striped-rows
          size="small"
          data-key="id"
          :rows="pe"
          :first="first"
          :total-records="total"
          :rows-per-page-options="[20, 50, 100]"
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @page="laPagina"
          @sort="laSortare"
        >
          <template #empty>
            Niciun material găsit.
          </template>
          <Column
            field="id"
            header="Cod"
            sortable
            style="min-width: 5.5rem"
          />
          <Column
            field="denumire"
            header="Denumire"
            sortable
            style="min-width: 16rem"
          />
          <Column
            field="um"
            header="UM"
            sortable
            style="min-width: 5rem"
          />
          <Column
            field="pretpredefinit"
            header="Preț predefinit"
            sortable
            style="min-width: 9rem"
          >
            <template #body="{ data }">
              <span class="num">{{ fmtNum(data.pretpredefinit, 4) }}</span>
            </template>
          </Column>
          <Column
            field="cod_import"
            header="Cod import"
            sortable
            style="min-width: 8rem"
          />
          <Column
            field="creat_de"
            header="Creat de"
            sortable
            style="min-width: 9rem"
          />
          <Column
            field="stare"
            header="Stare"
            sortable
            style="min-width: 6.5rem"
          >
            <template #body="{ data }">
              <Tag
                :value="data.stare"
                :severity="data.stare === 'activ' ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column
            style="min-width: 7rem; text-align: right"
            frozen
            align-frozen="right"
          >
            <template #body="{ data }">
              <Button
                v-tooltip.top="'Modifică'"
                icon="pi pi-pencil"
                text
                rounded
                aria-label="Modifică"
                @click="deschide(data)"
              />
              <Button
                v-tooltip.top="data.stare === 'activ' ? 'Dezactivează' : 'Activează'"
                :icon="data.stare === 'activ' ? 'pi pi-eye-slash' : 'pi pi-eye'"
                text
                rounded
                :aria-label="data.stare === 'activ' ? 'Dezactivează' : 'Activează'"
                @click="comutaStare(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="editId ? `Modifică materialul ${editId}` : 'Material nou'"
      modal
      :style="{ width: 'min(520px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field field-wide">
          <label for="mat-den">Denumire</label>
          <InputText
            id="mat-den"
            v-model="form.denumire"
            autofocus
            maxlength="100"
            :invalid="!!erori.denumire"
          />
          <small
            v-if="erori.denumire"
            class="err"
          >{{ erori.denumire }}</small>
          <Message
            v-if="duplicat"
            severity="warn"
            size="small"
            variant="simple"
          >
            Există deja un material activ cu această denumire în gestiune (cod {{ duplicat.id }}). Îl puteți salva oricum.
          </Message>
        </div>
        <div class="field">
          <label for="mat-um">Unitate de măsură</label>
          <Select
            v-model="form.um"
            input-id="mat-um"
            :options="[...UM_UZUALE]"
            editable
            maxlength="15"
            :invalid="!!erori.um"
          />
          <small
            v-if="erori.um"
            class="err"
          >{{ erori.um }}</small>
        </div>
        <div class="field">
          <label for="mat-pret">Preț predefinit</label>
          <InputNumber
            v-model="pret"
            input-id="mat-pret"
            locale="ro-RO"
            :min="0"
            :max="9999999999"
            :min-fraction-digits="4"
            :max-fraction-digits="4"
            :invalid="!!erori.pretpredefinit"
          />
          <small
            v-if="erori.pretpredefinit"
            class="err"
          >{{ erori.pretpredefinit }}</small>
        </div>
        <div class="field field-wide">
          <label for="mat-cod">Cod import</label>
          <InputGroup>
            <InputText
              id="mat-cod"
              v-model="form.cod_import"
              maxlength="45"
              :invalid="!!erori.cod_import"
            />
            <Button
              v-tooltip.top="'Propune următorul cod, după ultimul din gestiune'"
              icon="pi pi-search"
              label="Ultimul cod"
              severity="secondary"
              :loading="seCautaCod"
              @click="ultimulCod"
            />
          </InputGroup>
          <small
            v-if="erori.cod_import"
            class="err"
          >{{ erori.cod_import }}</small>
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
          @click="dialog = false"
        />
        <Button
          label="Salvează"
          icon="pi pi-check"
          :loading="salvare"
          @click="salveaza"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.cautare { flex: 1 1 18rem; max-width: 32rem; }
.cautare :deep(input) { width: 100%; }
.card { min-width: 0; }
</style>
