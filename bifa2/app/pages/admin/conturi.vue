<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { analiticNou } from '#shared/schemas/conturi'

definePageMeta({ admin: true })
useHead({ title: 'Plan de conturi – BIFA' })

const notify = useNotify()
const confirm = useConfirm()

const cautare = ref('')
const q = ref('')
const doarAnalitice = ref(false)
const page = ref(1)
const rows = ref(50)

const { data, refresh, status } = await useFetch('/api/conturi', {
  query: computed(() => ({ q: q.value || undefined, analitice: doarAnalitice.value ? '1' : undefined, page: page.value, rows: rows.value })),
  default: () => ({ rows: [], total: 0 }),
})
type Rand = (typeof data.value)['rows'][number]

let timer: ReturnType<typeof setTimeout> | undefined
watch(cautare, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    q.value = v.trim()
    page.value = 1
  }, 300)
})
watch(doarAnalitice, () => {
  page.value = 1
})
onBeforeUnmount(() => clearTimeout(timer))

function laPagina(e: { page: number, rows: number }) {
  page.value = e.page + 1
  rows.value = e.rows
}

const poateAvea = (c: Rand) => c.tip !== 'N' && c.nivel < 3

const dialog = ref(false)
const parinte = ref<Rand | null>(null)
const form = reactive({ sufix: '', denumire: '' })
const erori = ref<Record<string, string>>({})
const salvare = ref(false)
const contComplet = computed(() => `${parinte.value?.cont ?? ''}${form.sufix.trim()}`)

function deschide(c: Rand) {
  parinte.value = c
  Object.assign(form, { sufix: '', denumire: '' })
  erori.value = {}
  dialog.value = true
}

async function salveaza() {
  if (!parinte.value) return
  const r = analiticNou.safeParse({ idsintetic: parinte.value.id, ...form })
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  salvare.value = true
  try {
    await $fetch('/api/conturi', { method: 'POST', body: r.data })
    notify.ok(`Contul analitic ${contComplet.value} a fost adăugat.`)
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

function sterge(c: Rand) {
  confirm.require({
    header: 'Ștergere cont analitic',
    message: `Ștergeți contul ${c.cont} ${c.denumire}? Contul nu trebuie să fie folosit de nicio categorie.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Șterge',
    rejectLabel: 'Renunță',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      try {
        await $fetch(`/api/conturi/${c.id}`, { method: 'DELETE' })
        notify.ok('Contul analitic a fost șters.')
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
      <h1>Plan de conturi <span class="sub">Conturile sintetice și analitice folosite la categoriile de repere</span></h1>
    </div>
    <div class="card">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="cautare"
            placeholder="Caută după cont sau denumire…"
            aria-label="Caută cont"
          />
        </IconField>
        <label class="comuta">
          <ToggleSwitch v-model="doarAnalitice" />
          <span>Doar conturi analitice</span>
        </label>
        <span class="muted total">{{ data.total }} conturi</span>
      </div>
      <DataTable
        :value="data.rows"
        :loading="status === 'pending'"
        data-key="id"
        size="small"
        striped-rows
        scrollable
        lazy
        paginator
        :total-records="data.total"
        :first="(page - 1) * rows"
        :rows="rows"
        :rows-per-page-options="[25, 50, 100, 200]"
        @page="laPagina"
      >
        <template #empty>
          Niciun cont găsit.
        </template>
        <Column
          header="Cont"
          style="min-width: 11rem"
        >
          <template #body="{ data: c }">
            <span
              class="cont"
              :style="{ paddingLeft: `${Math.min(c.nivel, 3) * 1}rem` }"
            >
              <i
                v-if="c.tip === 'N'"
                class="pi pi-angle-right muted"
              />
              {{ c.cont }}
            </span>
          </template>
        </Column>
        <Column
          field="denumire"
          header="Denumire"
          style="min-width: 16rem"
        />
        <Column
          field="sintetic"
          header="Cont sintetic"
          style="width: 9rem"
        />
        <Column
          header="Tip"
          style="width: 9rem"
        >
          <template #body="{ data: c }">
            <Tag
              :value="c.tip === 'N' ? 'Analitic' : 'Sintetic'"
              :severity="c.tip === 'N' ? 'info' : 'secondary'"
            />
          </template>
        </Column>
        <Column
          style="width: 8rem; text-align: right"
          frozen
          align-frozen="right"
        >
          <template #body="{ data: c }">
            <Button
              v-if="poateAvea(c)"
              v-tooltip.top="'Adaugă cont analitic'"
              icon="pi pi-plus"
              text
              rounded
              aria-label="Adaugă cont analitic"
              @click="deschide(c)"
            />
            <Button
              v-if="c.tip === 'N'"
              v-tooltip.top="'Șterge'"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Șterge"
              @click="sterge(c)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialog"
      header="Cont analitic nou"
      modal
      :style="{ width: 'min(520px, 95vw)' }"
    >
      <form
        class="form-grid"
        @submit.prevent="salveaza"
      >
        <div class="field field-wide">
          <span class="eticheta">Cont sintetic</span>
          <strong>{{ parinte?.cont }} {{ parinte?.denumire }}</strong>
        </div>
        <div class="field">
          <label for="c-sufix">Sufix (se adaugă după {{ parinte?.cont }})</label>
          <InputText
            id="c-sufix"
            v-model="form.sufix"
            autofocus
            :invalid="!!erori.sufix"
          />
          <small
            v-if="erori.sufix"
            class="err"
          >{{ erori.sufix }}</small>
        </div>
        <div class="field">
          <span class="eticheta">Cont rezultat</span>
          <strong>{{ contComplet }}</strong>
        </div>
        <div class="field field-wide">
          <label for="c-den">Denumire</label>
          <InputText
            id="c-den"
            v-model="form.denumire"
            :invalid="!!erori.denumire"
          />
          <small
            v-if="erori.denumire"
            class="err"
          >{{ erori.denumire }}</small>
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
          label="Adaugă"
          icon="pi pi-check"
          :loading="salvare"
          @click="salveaza"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.comuta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.total {
  margin-left: auto;
}
.cont {
  display: inline-block;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.eticheta {
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
