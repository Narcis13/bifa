<script setup lang="ts">
import { locSchema } from '#shared/schemas/locuri'
import type { LocInput } from '#shared/schemas/locuri'

useHead({ title: 'Locuri de dispunere – BIFA' })
const notify = useNotify()

const { data: locuri, refresh, status } = await useFetch('/api/locuri', { default: () => [] })
const cautare = ref('')
const filtrate = computed(() => {
  const q = cautare.value.trim().toLowerCase()
  return q ? locuri.value.filter(l => l.denumire.toLowerCase().includes(q)) : locuri.value
})

const dialog = ref(false)
const editId = ref<number | null>(null)
const form = reactive<LocInput>({ denumire: '', prioritate: 1, stare: 'activ' })
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

function deschide(loc?: { id: number } & LocInput) {
  editId.value = loc?.id ?? null
  Object.assign(form, loc ? { denumire: loc.denumire, prioritate: loc.prioritate, stare: loc.stare } : { denumire: '', prioritate: 1, stare: 'activ' })
  erori.value = {}
  dialog.value = true
}

async function salveaza() {
  const r = locSchema.safeParse(form)
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  salvare.value = true
  try {
    if (editId.value) await $fetch(`/api/locuri/${editId.value}`, { method: 'PATCH', body: r.data })
    else await $fetch('/api/locuri', { method: 'POST', body: r.data })
    notify.ok(editId.value ? 'Locul a fost modificat.' : 'Locul a fost adăugat.')
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

async function comutaStare(loc: { id: number, stare: 'activ' | 'inactiv' }) {
  try {
    await $fetch(`/api/locuri/${loc.id}`, { method: 'PATCH', body: { stare: loc.stare === 'activ' ? 'inactiv' : 'activ' } })
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Locuri de dispunere <span class="sub">Secții, depozite și alte locuri unde se află materialele</span></h1>
      <Button
        label="Loc nou"
        icon="pi pi-plus"
        @click="deschide()"
      />
    </div>
    <div class="card">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="cautare"
            placeholder="Caută loc…"
            aria-label="Caută loc"
          />
        </IconField>
      </div>
      <DataTable
        :value="filtrate"
        :loading="status === 'pending'"
        data-key="id"
        size="small"
        striped-rows
        paginator
        :rows="20"
        :rows-per-page-options="[20, 50, 100]"
        sort-mode="single"
      >
        <template #empty>
          Niciun loc găsit.
        </template>
        <Column
          field="id"
          header="Cod"
          sortable
          style="width: 6rem"
        />
        <Column
          field="denumire"
          header="Denumire"
          sortable
        />
        <Column
          field="prioritate"
          header="Prioritate"
          sortable
          style="width: 8rem"
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
        <Column style="width: 7rem; text-align: right">
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
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="editId ? 'Modifică locul' : 'Loc nou'"
      modal
      :style="{ width: 'min(480px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field field-wide">
          <label for="loc-den">Denumire</label>
          <InputText
            id="loc-den"
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
          <label for="loc-prio">Prioritate</label>
          <InputNumber
            v-model="form.prioritate"
            input-id="loc-prio"
            :min="0"
            :max="999"
            show-buttons
          />
        </div>
        <div class="field">
          <label for="loc-stare">Stare</label>
          <Select
            v-model="form.stare"
            input-id="loc-stare"
            :options="['activ', 'inactiv']"
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
