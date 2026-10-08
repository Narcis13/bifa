<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { DENUMIRI_TIP_MATERIAL, TIPURI_MATERIAL } from '#shared/schemas/common'
import type { TipMaterial } from '#shared/schemas/common'
import { categorieNoua } from '#shared/schemas/categorii'

definePageMeta({ admin: true })
useHead({ title: 'Categorii repere – BIFA' })

const notify = useNotify()
const confirm = useConfirm()
const { incarca } = useSesiune()

interface OptiuneCont { id: number, eticheta: string }

const filtruGestiune = ref<number | null>(null)
const filtruTip = ref<TipMaterial | null>(null)
const arataInactive = ref(false)

const { data: gestiuni } = await useFetch('/api/gestiuni', { default: () => [] })
const { data: categorii, refresh, status } = await useFetch('/api/categorii', {
  query: computed(() => ({
    idgestiune: filtruGestiune.value ?? undefined,
    tipmaterial: filtruTip.value ?? undefined,
    stare: arataInactive.value ? undefined : 'activ',
  })),
  default: () => [],
})
type Rand = (typeof categorii.value)[number]

const optiuniTip = TIPURI_MATERIAL.map(t => ({ value: t, label: DENUMIRI_TIP_MATERIAL[t] }))
const optiuniGestiune = computed(() => gestiuni.value.map(g => ({ id: g.id, denumire: g.stare === 'activ' ? g.denumire : `${g.denumire} (inactivă)` })))

const dialog = ref(false)
const editId = ref<number | null>(null)
const lipsaImport = ref(false)
const form = reactive({
  denumire: '',
  idgestiune: null as number | null,
  tipmaterial: 'M' as TipMaterial,
  cont: null as OptiuneCont | null,
  contchelt: null as OptiuneCont | null,
  info: '',
  stare: 'activ' as 'activ' | 'inactiv',
})
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

const sugestii = ref<OptiuneCont[]>([])
async function cautaConturi(e: { query: string }) {
  try {
    const r = await $fetch('/api/conturi', { query: { q: e.query || undefined, rows: 30 } })
    sugestii.value = r.rows.map(c => ({ id: c.id, eticheta: `${c.cont} ${c.denumire}` }))
  }
  catch (err) {
    notify.err(err)
  }
}

function deschide(c?: Rand) {
  editId.value = c?.id ?? null
  lipsaImport.value = c?.lipsa_import ?? false
  Object.assign(form, c
    ? {
        denumire: c.denumire,
        idgestiune: c.idgestiune,
        tipmaterial: c.tipmaterial,
        cont: c.idcont && c.cont ? { id: c.idcont, eticheta: c.cont } : null,
        contchelt: c.idcontchelt && c.contcheltuiala ? { id: c.idcontchelt, eticheta: c.contcheltuiala } : null,
        info: c.info ?? '',
        stare: c.stare,
      }
    : { denumire: '', idgestiune: filtruGestiune.value, tipmaterial: filtruTip.value ?? 'M', cont: null, contchelt: null, info: '', stare: 'activ' })
  erori.value = {}
  dialog.value = true
}

async function salveaza() {
  const r = categorieNoua.safeParse({
    denumire: form.denumire,
    idgestiune: form.idgestiune ?? undefined,
    tipmaterial: form.tipmaterial,
    idcont: form.cont?.id ?? null,
    idcontchelt: form.contchelt?.id ?? null,
    info: form.info,
    stare: form.stare,
  })
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  salvare.value = true
  try {
    if (editId.value) await $fetch(`/api/categorii/${editId.value}`, { method: 'PATCH', body: r.data })
    else await $fetch('/api/categorii', { method: 'POST', body: r.data })
    notify.ok(editId.value ? 'Categoria a fost modificată.' : 'Categoria a fost adăugată.')
    dialog.value = false
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

async function activeaza(c: Rand) {
  try {
    await $fetch(`/api/categorii/${c.id}`, { method: 'PATCH', body: { stare: 'activ' } })
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
}

function dezactiveaza(c: Rand) {
  confirm.require({
    header: 'Dezactivare categorie',
    message: `Dezactivați categoria „${c.denumire}”? Nu va mai putea fi aleasă în documente noi; istoricul rămâne neschimbat.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Dezactivează',
    rejectLabel: 'Renunță',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      try {
        await $fetch(`/api/categorii/${c.id}`, { method: 'DELETE' })
        notify.ok('Categoria a fost dezactivată.')
        await refresh()
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
      <h1>Categorii repere <span class="sub">Categoriile de materiale ale fiecărei gestiuni și conturile asociate</span></h1>
      <Button
        label="Categorie nouă"
        icon="pi pi-plus"
        @click="deschide()"
      />
    </div>
    <div class="card">
      <div class="toolbar">
        <Select
          v-model="filtruGestiune"
          :options="optiuniGestiune"
          option-label="denumire"
          option-value="id"
          placeholder="Toate gestiunile"
          show-clear
          class="filtru"
          aria-label="Filtrează după gestiune"
        />
        <Select
          v-model="filtruTip"
          :options="optiuniTip"
          option-label="label"
          option-value="value"
          placeholder="Toate tipurile"
          show-clear
          class="filtru"
          aria-label="Filtrează după tip"
        />
        <label class="comuta">
          <ToggleSwitch v-model="arataInactive" />
          <span>Arată și cele inactive</span>
        </label>
      </div>
      <DataTable
        :value="categorii"
        :loading="status === 'pending'"
        data-key="id"
        size="small"
        striped-rows
        scrollable
        paginator
        :rows="20"
        :rows-per-page-options="[20, 50, 100]"
      >
        <template #empty>
          Nicio categorie găsită.
        </template>
        <Column
          field="denumire"
          header="Denumire"
          sortable
          style="min-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.denumire }}
            <Tag
              v-if="data.lipsa_import"
              value="Creată la import"
              severity="warn"
            />
          </template>
        </Column>
        <Column
          field="gestiune"
          header="Gestiune"
          sortable
          style="min-width: 10rem"
        />
        <Column
          field="tipmaterial"
          header="Tip"
          sortable
          style="min-width: 10rem"
        >
          <template #body="{ data }">
            {{ DENUMIRI_TIP_MATERIAL[data.tipmaterial as TipMaterial] }}
          </template>
        </Column>
        <Column
          field="cont"
          header="Cont stoc"
          style="min-width: 14rem"
        />
        <Column
          field="contcheltuiala"
          header="Cont cheltuieli"
          style="min-width: 14rem"
        />
        <Column
          field="stare"
          header="Stare"
          sortable
          style="width: 8rem"
        >
          <template #body="{ data }">
            <Tag
              :value="data.stare"
              :severity="data.stare === 'activ' ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column
          style="width: 8rem; text-align: right"
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
              v-if="data.stare === 'activ'"
              v-tooltip.top="data.lipsa_import ? 'Categoria creată la import nu poate fi dezactivată' : 'Dezactivează'"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              :disabled="data.lipsa_import"
              aria-label="Dezactivează"
              @click="dezactiveaza(data)"
            />
            <Button
              v-else
              v-tooltip.top="'Activează'"
              icon="pi pi-eye"
              text
              rounded
              aria-label="Activează"
              @click="activeaza(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="editId ? 'Modifică categoria' : 'Categorie nouă'"
      modal
      :style="{ width: 'min(600px, 95vw)' }"
    >
      <Message
        v-if="lipsaImport"
        severity="warn"
        :closable="false"
        class="mesaj"
      >
        Categorie creată la import pentru liniile care nu aveau categorie în aplicația veche.
      </Message>
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field field-wide">
          <label for="k-den">Denumire</label>
          <InputText
            id="k-den"
            v-model="form.denumire"
            autofocus
            :invalid="!!erori.denumire"
          />
          <small
            v-if="erori.denumire"
            class="err"
          >{{ erori.denumire }}</small>
        </div>
        <div class="field">
          <label for="k-gest">Gestiune</label>
          <Select
            v-model="form.idgestiune"
            input-id="k-gest"
            :options="optiuniGestiune"
            option-label="denumire"
            option-value="id"
            placeholder="Alegeți gestiunea"
            :invalid="!!erori.idgestiune"
          />
          <small
            v-if="erori.idgestiune"
            class="err"
          >Alegeți gestiunea</small>
        </div>
        <div class="field">
          <label for="k-tip">Tip material</label>
          <Select
            v-model="form.tipmaterial"
            input-id="k-tip"
            :options="optiuniTip"
            option-label="label"
            option-value="value"
          />
        </div>
        <div class="field field-wide">
          <label for="k-cont">Cont stoc</label>
          <AutoComplete
            v-model="form.cont"
            input-id="k-cont"
            :suggestions="sugestii"
            option-label="eticheta"
            dropdown
            force-selection
            fluid
            placeholder="Căutați după cont sau denumire"
            @complete="cautaConturi"
          />
        </div>
        <div class="field field-wide">
          <label for="k-chelt">Cont cheltuieli</label>
          <AutoComplete
            v-model="form.contchelt"
            input-id="k-chelt"
            :suggestions="sugestii"
            option-label="eticheta"
            dropdown
            force-selection
            fluid
            placeholder="Căutați după cont sau denumire"
            @complete="cautaConturi"
          />
        </div>
        <div class="field field-wide">
          <label for="k-info">Informații</label>
          <InputText
            id="k-info"
            v-model="form.info"
            :invalid="!!erori.info"
          />
          <small
            v-if="erori.info"
            class="err"
          >{{ erori.info }}</small>
        </div>
        <div class="field">
          <label for="k-stare">Stare</label>
          <Select
            v-model="form.stare"
            input-id="k-stare"
            :options="['activ', 'inactiv']"
            :disabled="lipsaImport"
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
.filtru {
  min-width: 14rem;
  max-width: 100%;
}
.comuta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.mesaj {
  margin-bottom: 0.85rem;
}
</style>
