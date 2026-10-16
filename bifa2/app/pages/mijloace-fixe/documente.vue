<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

useHead({ title: 'Documente mijloace fixe – BIFA' })
const { idCurent, gestiuneCurenta } = useSesiune()
const notify = useNotify()
const confirm = useConfirm()

const azi = new Date()
const interval = useCookie<[string, string]>('mf-documente-interval', {
  default: () => [isoData(new Date(azi.getFullYear(), azi.getMonth(), 1)), isoData(azi)],
})
const perioada = computed<Date[]>({
  get: () => interval.value.map(dinIso),
  set: (v) => {
    if (v?.[0] && v[1]) interval.value = [isoData(v[0]), isoData(v[1])]
  },
})
const stare = ref<'activ' | 'inactiv' | 'toate'>('activ')

const { data, status, refresh } = await useFetch('/api/mijloace-fixe/documente', {
  query: computed(() => ({
    idgestiune: idCurent.value,
    inceput: interval.value[0],
    sfarsit: interval.value[1],
    stare: stare.value,
  })),
  immediate: !!idCurent.value,
  watch: [idCurent, interval, stare],
})

const ETICHETE_TIP = { i: 'Intrare', e: 'Casare', t: 'Transfer' } as const
const SEVERITATE_TIP = { i: 'success', e: 'warn', t: 'info' } as const

function invalideaza(d: { id: number, denumireScurta: string, nrdoc: string }) {
  confirm.require({
    header: 'Invalidare document MF',
    message: `Invalidați documentul ${d.denumireScurta} ${d.nrdoc}? Efectele asupra mijloacelor fixe vor fi reverseate dacă este posibil.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Renunță', severity: 'secondary', text: true },
    acceptProps: { label: 'Invalidează', severity: 'danger' },
    accept: async () => {
      try {
        await $fetch(`/api/mijloace-fixe/documente/${d.id}`, { method: 'DELETE' })
        notify.ok('Documentul a fost invalidat.')
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
      <h1>
        Documente mijloace fixe
        <span class="sub">{{ gestiuneCurenta?.denumire }} · {{ fmtData(interval[0]) }} – {{ fmtData(interval[1]) }}</span>
      </h1>
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
          class="perioada"
        />
        <SelectButton
          v-model="stare"
          :options="[
            { v: 'activ', l: 'Active' },
            { v: 'inactiv', l: 'Invalidate' },
            { v: 'toate', l: 'Toate' },
          ]"
          option-label="l"
          option-value="v"
          :allow-empty="false"
        />
      </div>
      <DataTable
        :value="data?.documente ?? []"
        :loading="status === 'pending'"
        data-key="id"
        striped-rows
        size="small"
      >
        <Column
          field="data"
          header="Data"
          style="width: 7rem"
        >
          <template #body="{ data: d }">
            {{ fmtData(d.data) }}
          </template>
        </Column>
        <Column
          field="denumireScurta"
          header="Tip"
          style="width: 6rem"
        />
        <Column
          field="nrdoc"
          header="Nr. doc"
          style="width: 7rem"
        />
        <Column
          field="tip"
          header="Operațiune"
          style="width: 8rem"
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
          style="width: 5rem"
        />
        <Column
          field="observatii"
          header="Observații"
        />
        <Column
          field="stare"
          header="Stare"
          style="width: 6rem"
        >
          <template #body="{ data: d }">
            <Tag
              :value="d.stare === 'activ' ? 'Activ' : 'Invalidat'"
              :severity="d.stare === 'activ' ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column style="width: 4rem">
          <template #body="{ data: d }">
            <Button
              v-if="d.stare === 'activ'"
              v-tooltip.top="'Invalidează'"
              icon="pi pi-ban"
              text
              rounded
              severity="danger"
              @click="invalideaza(d)"
            />
          </template>
        </Column>
        <template #empty>
          <div class="empty">
            Nu există documente în perioadă.
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
.perioada { min-width: 16rem; }
.empty { padding: 1.5rem; text-align: center; color: var(--app-muted); }
</style>
