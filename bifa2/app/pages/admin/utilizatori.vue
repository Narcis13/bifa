<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { DENUMIRI_ROL, ROLURI, utilizatorModificat, utilizatorNou } from '#shared/schemas/utilizatori'

definePageMeta({ admin: true })
useHead({ title: 'Utilizatori – BIFA' })

const notify = useNotify()
const confirm = useConfirm()
const { user: eu } = useSesiune()

type Rand = NonNullable<typeof utilizatori.value>[number]

const { data: utilizatori, refresh, status } = await useFetch('/api/utilizatori', { default: () => [] })
const cautare = ref('')
const filtrati = computed(() => {
  const q = cautare.value.trim().toLowerCase()
  if (!q) return utilizatori.value
  return utilizatori.value.filter(u => [u.username, u.name, u.email].some(v => v?.toLowerCase().includes(q)))
})

const optiuniRol = ROLURI.map(r => ({ value: r, label: DENUMIRI_ROL[r] }))
const optiuniStare = ['activ', 'inactiv']

const dialog = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ username: '', password: '', name: '', email: '', rol: 'operator' as 'admin' | 'operator', stare: 'activ' as 'activ' | 'inactiv' })
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

const esteEu = (u: { id: number }) => u.id === eu.value?.id

function deschide(u?: Rand) {
  editId.value = u?.id ?? null
  Object.assign(form, u
    ? { username: u.username, password: '', name: u.name ?? '', email: u.email ?? '', rol: u.rol, stare: u.stare }
    : { username: '', password: '', name: '', email: '', rol: 'operator', stare: 'activ' })
  erori.value = {}
  dialog.value = true
}

async function salveaza() {
  const r = editId.value
    ? utilizatorModificat.safeParse({ password: form.password, name: form.name, email: form.email, rol: form.rol, stare: form.stare })
    : utilizatorNou.safeParse(form)
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  salvare.value = true
  try {
    if (editId.value) await $fetch(`/api/utilizatori/${editId.value}`, { method: 'PATCH', body: r.data })
    else await $fetch('/api/utilizatori', { method: 'POST', body: r.data })
    notify.ok(editId.value ? 'Utilizatorul a fost modificat.' : 'Utilizatorul a fost adăugat.')
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

async function comutaStare(u: Rand) {
  try {
    await $fetch(`/api/utilizatori/${u.id}`, { method: 'PATCH', body: { stare: u.stare === 'activ' ? 'inactiv' : 'activ' } })
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
}

function sterge(u: Rand) {
  confirm.require({
    header: 'Ștergere utilizator',
    message: `Ștergeți definitiv utilizatorul „${u.username}”? Dacă este folosit în gestiuni sau materiale, dezactivați-l în loc să-l ștergeți.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Șterge',
    rejectLabel: 'Renunță',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      try {
        await $fetch(`/api/utilizatori/${u.id}`, { method: 'DELETE' })
        notify.ok('Utilizatorul a fost șters.')
        await refresh()
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
      <h1>Utilizatori <span class="sub">Conturile care pot folosi aplicația și rolul lor</span></h1>
      <Button
        label="Utilizator nou"
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
            placeholder="Caută utilizator…"
            aria-label="Caută utilizator"
          />
        </IconField>
      </div>
      <DataTable
        :value="filtrati"
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
          Niciun utilizator găsit.
        </template>
        <Column
          field="username"
          header="Utilizator"
          sortable
        >
          <template #body="{ data }">
            {{ data.username }}
            <Tag
              v-if="esteEu(data)"
              value="Dvs."
              severity="info"
            />
          </template>
        </Column>
        <Column
          field="name"
          header="Nume"
          sortable
        />
        <Column
          field="email"
          header="E-mail"
        />
        <Column
          field="rol"
          header="Rol"
          sortable
          style="width: 9rem"
        >
          <template #body="{ data }">
            <Tag
              :value="DENUMIRI_ROL[data.rol as keyof typeof DENUMIRI_ROL]"
              :severity="data.rol === 'admin' ? 'warn' : 'secondary'"
            />
          </template>
        </Column>
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
              :disabled="esteEu(data)"
              :aria-label="data.stare === 'activ' ? 'Dezactivează' : 'Activează'"
              @click="comutaStare(data)"
            />
            <Button
              v-tooltip.top="'Șterge'"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              :disabled="esteEu(data)"
              aria-label="Șterge"
              @click="sterge(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="editId ? 'Modifică utilizatorul' : 'Utilizator nou'"
      modal
      :style="{ width: 'min(560px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field">
          <label for="u-user">Nume de utilizator</label>
          <InputText
            id="u-user"
            v-model="form.username"
            autocomplete="off"
            :disabled="!!editId"
            :invalid="!!erori.username"
          />
          <small
            v-if="erori.username"
            class="err"
          >{{ erori.username }}</small>
        </div>
        <div class="field">
          <label for="u-pass">{{ editId ? 'Parolă nouă (opțional)' : 'Parolă' }}</label>
          <Password
            v-model="form.password"
            input-id="u-pass"
            :feedback="false"
            toggle-mask
            fluid
            autocomplete="new-password"
            :invalid="!!erori.password"
          />
          <small
            v-if="erori.password"
            class="err"
          >{{ erori.password }}</small>
        </div>
        <div class="field">
          <label for="u-name">Nume complet</label>
          <InputText
            id="u-name"
            v-model="form.name"
            :invalid="!!erori.name"
          />
          <small
            v-if="erori.name"
            class="err"
          >{{ erori.name }}</small>
        </div>
        <div class="field">
          <label for="u-email">E-mail</label>
          <InputText
            id="u-email"
            v-model="form.email"
            type="email"
            :invalid="!!erori.email"
          />
          <small
            v-if="erori.email"
            class="err"
          >{{ erori.email }}</small>
        </div>
        <div class="field">
          <label for="u-rol">Rol</label>
          <Select
            v-model="form.rol"
            input-id="u-rol"
            :options="optiuniRol"
            option-label="label"
            option-value="value"
            :disabled="!!editId && editId === eu?.id"
          />
        </div>
        <div class="field">
          <label for="u-stare">Stare</label>
          <Select
            v-model="form.stare"
            input-id="u-stare"
            :options="optiuniStare"
            :disabled="!!editId && editId === eu?.id"
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
