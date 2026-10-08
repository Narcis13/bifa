<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

useHead({ title: 'Documente – BIFA' })
const { idCurent, gestiuneCurenta } = useSesiune()
const notify = useNotify()
const confirm = useConfirm()

const azi = new Date()
const interval = useCookie<[string, string]>('documente-interval', {
  default: () => [isoData(new Date(azi.getFullYear(), azi.getMonth(), 1)), isoData(azi)],
})
const perioada = computed<Date[]>({
  get: () => interval.value.map(dinIso),
  set: (v) => {
    if (v?.[0] && v[1]) interval.value = [isoData(v[0]), isoData(v[1])]
  },
})
const stare = ref<'activ' | 'inactiv' | 'toate'>('activ')
const cautare = ref('')

const { data, status, refresh } = await useFetch('/api/documente', {
  query: computed(() => ({ idgestiune: idCurent.value, inceput: interval.value[0], sfarsit: interval.value[1], stare: stare.value })),
  immediate: !!idCurent.value,
  watch: [idCurent, interval, stare],
})

const documente = computed(() => {
  const q = cautare.value.trim().toLowerCase()
  const all = data.value?.documente ?? []
  return q ? all.filter(d => `${d.denumireScurta} ${d.nrdoc} ${d.denumireTip}`.toLowerCase().includes(q)) : all
})

const ETICHETE_TIP = { i: 'Intrare', e: 'Ieșire', t: 'Transfer' } as const
const SEVERITATE_TIP = { i: 'success', e: 'warn', t: 'info' } as const

function invalideaza(d: { id: number, denumireScurta: string, nrdoc: string }) {
  confirm.require({
    header: 'Invalidare document',
    message: `Invalidați documentul ${d.denumireScurta} ${d.nrdoc}? Liniile lui nu vor mai intra în stocuri și rapoarte. Documentul rămâne în baza de date.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Renunță', severity: 'secondary', text: true },
    acceptProps: { label: 'Invalidează', severity: 'danger' },
    accept: async () => {
      try {
        await $fetch(`/api/documente/${d.id}`, { method: 'DELETE' })
        notify.ok('Documentul a fost invalidat.')
        await refresh()
      }
      catch (e) {
        notify.err(e)
      }
    },
  })
}

const registru = computed(() => `/rapoarte/registru?inceput=${interval.value[0]}&sfarsit=${interval.value[1]}`)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Documente
        <span class="sub">{{ gestiuneCurenta?.denumire }} · {{ fmtData(interval[0]) }} – {{ fmtData(interval[1]) }}</span>
      </h1>
      <Button
        as="a"
        :href="registru"
        target="_blank"
        label="Registru"
        icon="pi pi-print"
        severity="secondary"
        outlined
      />
      <Button
        as="router-link"
        to="/documente/nou"
        label="Document nou"
        icon="pi pi-plus"
      />
    </div>
    <div class="card">
      <div class="toolbar">
        <DatePicker
          v-model="perioada"
          selection-mode="range"
          :manual-input="false"
          date-format="dd.mm.yy"
          show-icon
          icon-display="input"
          aria-label="Perioada"
          class="perioada"
        />
        <SelectButton
          v-model="stare"
          :options="[{ v: 'activ', l: 'Active' }, { v: 'inactiv', l: 'Invalidate' }, { v: 'toate', l: 'Toate' }]"
          option-label="l"
          option-value="v"
          :allow-empty="false"
          aria-label="Stare documente"
        />
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="cautare"
            placeholder="Caută după număr sau tip…"
            aria-label="Caută document"
          />
        </IconField>
      </div>
      <DataTable
        :value="documente"
        :loading="status === 'pending'"
        data-key="id"
        size="small"
        striped-rows
        paginator
        :rows="25"
        :rows-per-page-options="[25, 50, 100, 500]"
        scrollable
        removable-sort
        @row-dblclick="e => navigateTo(`/documente/${e.data.id}`)"
      >
        <template #empty>
          Niciun document în perioada aleasă.
        </template>
        <Column
          field="data"
          header="Data"
          sortable
          style="width: 7rem"
        >
          <template #body="{ data: d }">
            {{ fmtData(d.data) }}
          </template>
        </Column>
        <Column
          field="denumireScurta"
          header="Document"
          sortable
        >
          <template #body="{ data: d }">
            <NuxtLink
              :to="`/documente/${d.id}`"
              class="doc-link"
            >
              <strong>{{ d.denumireScurta }} {{ d.nrdoc }}</strong>
            </NuxtLink>
            <div class="muted small">
              {{ d.denumireTip }} · nr. intern {{ d.id }}
            </div>
          </template>
        </Column>
        <Column
          field="tip"
          header="Tip"
          sortable
          style="width: 7rem"
        >
          <template #body="{ data: d }">
            <Tag
              :value="ETICHETE_TIP[d.tip as 'i' | 'e' | 't']"
              :severity="SEVERITATE_TIP[d.tip as 'i' | 'e' | 't']"
            />
          </template>
        </Column>
        <Column
          field="nrLinii"
          header="Linii"
          sortable
          style="width: 5rem"
          class="num"
        >
          <template #body="{ data: d }">
            <span v-if="Number(d.nrLinii)">{{ d.nrLinii }}</span>
            <Tag
              v-else
              v-tooltip.top="'Document fără linii (salvat incomplet în aplicația veche)'"
              value="fără linii"
              severity="danger"
            />
          </template>
        </Column>
        <Column
          field="debit"
          header="Intrări (lei)"
          sortable
          class="num"
        >
          <template #body="{ data: d }">
            {{ fmtNum(d.debit) }}
          </template>
        </Column>
        <Column
          field="credit"
          header="Ieșiri (lei)"
          sortable
          class="num"
        >
          <template #body="{ data: d }">
            {{ fmtNum(d.credit) }}
          </template>
        </Column>
        <Column
          v-if="stare !== 'activ'"
          field="stare"
          header="Stare"
          style="width: 6rem"
        >
          <template #body="{ data: d }">
            <Tag
              :value="d.stare"
              :severity="d.stare === 'activ' ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column style="width: 9rem; text-align: right">
          <template #body="{ data: d }">
            <Button
              v-tooltip.top="'Deschide'"
              as="router-link"
              :to="`/documente/${d.id}`"
              icon="pi pi-pencil"
              text
              rounded
              aria-label="Deschide"
            />
            <Button
              v-tooltip.top="'Tipărește'"
              as="a"
              :href="`/rapoarte/document/${d.id}`"
              target="_blank"
              icon="pi pi-print"
              text
              rounded
              aria-label="Tipărește"
            />
            <Button
              v-if="d.stare === 'activ'"
              v-tooltip.top="'Invalidează'"
              icon="pi pi-ban"
              text
              rounded
              severity="danger"
              aria-label="Invalidează"
              @click="invalideaza(d)"
            />
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column
              footer="Total"
              :colspan="4"
              footer-style="text-align: right"
            />
            <Column
              :footer="fmtNum(data?.totaluri.debit)"
              class="num"
            />
            <Column
              :footer="fmtNum(data?.totaluri.credit)"
              class="num"
            />
            <Column :colspan="stare !== 'activ' ? 2 : 1" />
          </Row>
        </ColumnGroup>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.perioada { width: 15rem; }
.small { font-size: 0.8rem; }
.doc-link { color: inherit; text-decoration: none; }
.doc-link:hover strong { color: var(--p-primary-color); }
</style>
