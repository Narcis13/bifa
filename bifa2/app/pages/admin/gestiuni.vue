<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { gestiuneNoua } from '#shared/schemas/gestiuni'

definePageMeta({ admin: true })
useHead({ title: 'Gestiuni – BIFA' })

const notify = useNotify()
const confirm = useConfirm()
const { incarca } = useSesiune()

const { data: gestiuni, refresh, status } = await useFetch('/api/gestiuni', { default: () => [] })
const { data: utilizatori } = await useFetch('/api/utilizatori', { default: () => [] })
const optiuniUtilizatori = computed(() => utilizatori.value
  .map(u => ({ id: u.id, eticheta: u.name ? `${u.username} (${u.name})` : u.username, stare: u.stare })))

type Rand = (typeof gestiuni.value)[number]

const cautare = ref('')
const filtrate = computed(() => {
  const q = cautare.value.trim().toLowerCase()
  if (!q) return gestiuni.value
  return gestiuni.value.filter(g => [g.denumire, g.gestionar, g.utilizator].some(v => v?.toLowerCase().includes(q)))
})

const gol = () => ({
  denumire: '',
  userid: null as number | null,
  gestionar: '',
  r_presedinte: '',
  r_membru1: '',
  r_membru2: '',
  r_membru3: '',
  i_presedinte: '',
  i_membru1: '',
  i_membru2: '',
  i_membru3: '',
  stare: 'activ' as 'activ' | 'inactiv',
})

const dialog = ref(false)
const editId = ref<number | null>(null)
const form = reactive(gol())
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

function deschide(g?: Rand) {
  editId.value = g?.id ?? null
  const baza = gol()
  Object.assign(form, g
    ? Object.fromEntries(Object.keys(baza).map(k => [k, (g as Record<string, unknown>)[k] ?? (k === 'userid' ? null : '')]))
    : baza)
  erori.value = {}
  dialog.value = true
}

async function dupaModificare() {
  await refresh()
  await incarca() // the gestiune switcher in the top bar
}

async function salveaza() {
  const r = gestiuneNoua.safeParse({ ...form, userid: form.userid ?? null })
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  salvare.value = true
  try {
    if (editId.value) await $fetch(`/api/gestiuni/${editId.value}`, { method: 'PATCH', body: r.data })
    else await $fetch('/api/gestiuni', { method: 'POST', body: r.data })
    notify.ok(editId.value ? 'Gestiunea a fost modificată.' : 'Gestiunea a fost adăugată.')
    dialog.value = false
    await dupaModificare()
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

async function comutaStare(g: Rand) {
  try {
    await $fetch(`/api/gestiuni/${g.id}`, { method: 'PATCH', body: { stare: g.stare === 'activ' ? 'inactiv' : 'activ' } })
    await dupaModificare()
  }
  catch (e) {
    notify.err(e)
  }
}

function sterge(g: Rand) {
  confirm.require({
    header: 'Ștergere gestiune',
    message: `Ștergeți definitiv gestiunea „${g.denumire}”? Se poate șterge doar o gestiune fără documente, materiale sau categorii; altfel dezactivați-o.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Șterge',
    rejectLabel: 'Renunță',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      try {
        await $fetch(`/api/gestiuni/${g.id}`, { method: 'DELETE' })
        notify.ok('Gestiunea a fost ștearsă.')
        await dupaModificare()
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
      <h1>Gestiuni <span class="sub">Gestiunile, gestionarii și comisiile de recepție și inventariere</span></h1>
      <Button
        label="Gestiune nouă"
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
            placeholder="Caută gestiune…"
            aria-label="Caută gestiune"
          />
        </IconField>
      </div>
      <DataTable
        :value="filtrate"
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
          Nicio gestiune găsită.
        </template>
        <Column
          field="denumire"
          header="Denumire"
          sortable
        />
        <Column
          field="utilizator"
          header="Utilizator"
          sortable
        />
        <Column
          field="gestionar"
          header="Gestionar"
          sortable
        />
        <Column
          field="r_presedinte"
          header="Președinte recepție"
        />
        <Column
          field="i_presedinte"
          header="Președinte inventariere"
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
          style="width: 11rem; text-align: right"
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
            <Button
              v-tooltip.top="'Șterge'"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Șterge"
              @click="sterge(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="editId ? 'Modifică gestiunea' : 'Gestiune nouă'"
      modal
      :style="{ width: 'min(720px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field field-wide">
          <label for="g-den">Denumire</label>
          <InputText
            id="g-den"
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
          <label for="g-user">Utilizator asignat</label>
          <Select
            v-model="form.userid"
            input-id="g-user"
            :options="optiuniUtilizatori"
            option-label="eticheta"
            option-value="id"
            placeholder="Niciun utilizator"
            show-clear
            filter
          />
        </div>
        <div class="field">
          <label for="g-gest">Gestionar</label>
          <InputText
            id="g-gest"
            v-model="form.gestionar"
            :invalid="!!erori.gestionar"
          />
          <small
            v-if="erori.gestionar"
            class="err"
          >{{ erori.gestionar }}</small>
        </div>

        <h3 class="field-wide sectiune">
          Comisia de recepție
        </h3>
        <div class="field">
          <label for="g-rp">Președinte</label>
          <InputText
            id="g-rp"
            v-model="form.r_presedinte"
          />
        </div>
        <div class="field">
          <label for="g-r1">Membru 1</label>
          <InputText
            id="g-r1"
            v-model="form.r_membru1"
          />
        </div>
        <div class="field">
          <label for="g-r2">Membru 2</label>
          <InputText
            id="g-r2"
            v-model="form.r_membru2"
          />
        </div>
        <div class="field">
          <label for="g-r3">Membru 3</label>
          <InputText
            id="g-r3"
            v-model="form.r_membru3"
          />
        </div>

        <h3 class="field-wide sectiune">
          Comisia de inventariere
        </h3>
        <div class="field">
          <label for="g-ip">Președinte</label>
          <InputText
            id="g-ip"
            v-model="form.i_presedinte"
          />
        </div>
        <div class="field">
          <label for="g-i1">Membru 1</label>
          <InputText
            id="g-i1"
            v-model="form.i_membru1"
          />
        </div>
        <div class="field">
          <label for="g-i2">Membru 2</label>
          <InputText
            id="g-i2"
            v-model="form.i_membru2"
          />
        </div>
        <div class="field">
          <label for="g-i3">Membru 3</label>
          <InputText
            id="g-i3"
            v-model="form.i_membru3"
          />
        </div>

        <div class="field">
          <label for="g-stare">Stare</label>
          <Select
            v-model="form.stare"
            input-id="g-stare"
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

<style scoped>
.sectiune {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 0.25rem;
}
</style>
