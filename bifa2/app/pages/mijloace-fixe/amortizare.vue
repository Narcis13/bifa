<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

useHead({ title: 'Amortizare lunară MF – BIFA' })
const notify = useNotify()
const confirm = useConfirm()
const { idCurent, gestiuneCurenta } = useSesiune()

const azi = new Date()
const an = ref(azi.getFullYear())
const luna = ref(azi.getMonth() + 1)
const salvare = ref(false)
type RezultatAmort = { create: number, deja: number, sarite: number, total: number, detalii: { nr_inventar: string, suma: string }[] }
const rezultat = ref<RezultatAmort | null>(null)

const LUNI = [
  { v: 1, l: 'Ianuarie' }, { v: 2, l: 'Februarie' }, { v: 3, l: 'Martie' },
  { v: 4, l: 'Aprilie' }, { v: 5, l: 'Mai' }, { v: 6, l: 'Iunie' },
  { v: 7, l: 'Iulie' }, { v: 8, l: 'August' }, { v: 9, l: 'Septembrie' },
  { v: 10, l: 'Octombrie' }, { v: 11, l: 'Noiembrie' }, { v: 12, l: 'Decembrie' },
]

const situatieUrl = computed(() =>
  `/rapoarte/amortizare-mf?idgestiune=${idCurent.value}&an=${an.value}&luna=${luna.value}`)

async function calculeaza() {
  salvare.value = true
  rezultat.value = null
  try {
    const r = await $fetch<RezultatAmort>('/api/mijloace-fixe/amortizare', {
      method: 'POST',
      body: { idgestiune: idCurent.value, an: an.value, luna: luna.value },
    })
    rezultat.value = r
    notify.ok(`Amortizare generată: ${r.create} înregistrări noi.`)
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}

function anuleaza() {
  confirm.require({
    header: 'Anulare amortizare',
    message: `Anulați amortizările active pentru ${LUNI.find(l => l.v === luna.value)?.l} ${an.value}?`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Renunță', severity: 'secondary', text: true },
    acceptProps: { label: 'Anulează', severity: 'danger' },
    accept: async () => {
      try {
        const r = await $fetch<{ anulate: number }>('/api/mijloace-fixe/amortizare', {
          method: 'DELETE',
          query: { idgestiune: idCurent.value, an: an.value, luna: luna.value },
        })
        notify.ok(`Au fost anulate ${r.anulate} înregistrări.`)
        rezultat.value = null
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
        Amortizare lunară
        <span class="sub">{{ gestiuneCurenta?.denumire }}</span>
      </h1>
      <Button
        as="a"
        :href="situatieUrl"
        target="_blank"
        label="Situație lunară"
        icon="pi pi-print"
        severity="secondary"
        outlined
      />
      <Button
        label="Anulează luna"
        icon="pi pi-times"
        severity="danger"
        outlined
        @click="anuleaza"
      />
      <Button
        label="Calculează"
        icon="pi pi-calculator"
        :loading="salvare"
        @click="calculeaza"
      />
    </div>

    <Message
      severity="info"
      class="mb"
    >
      Amortizare liniară (Legea 15/1994): suma lunară = valoarea de intrare ÷ durata în luni.
      Se calculează începând cu luna următoare punerii în funcțiune, până la amortizarea integrală sau casare.
    </Message>

    <div class="card">
      <div class="campuri">
        <label>
          An
          <InputNumber
            v-model="an"
            :min="1990"
            :max="2100"
            show-buttons
            class="w"
          />
        </label>
        <label>
          Luna
          <Select
            v-model="luna"
            :options="LUNI"
            option-label="l"
            option-value="v"
            class="w"
          />
        </label>
      </div>
    </div>

    <div
      v-if="rezultat"
      class="card"
    >
      <h2>Rezultat {{ LUNI.find(l => l.v === luna)?.l }} {{ an }}</h2>
      <div class="statistici">
        <div><span>Mijloace în funcțiune</span><strong>{{ rezultat.total }}</strong></div>
        <div><span>Amortizări noi</span><strong>{{ rezultat.create }}</strong></div>
        <div><span>Deja calculate</span><strong>{{ rezultat.deja }}</strong></div>
        <div><span>Sărite (neeligibile / amortizate)</span><strong>{{ rezultat.sarite }}</strong></div>
      </div>
      <DataTable
        v-if="rezultat.detalii.length"
        :value="rezultat.detalii"
        striped-rows
        size="small"
        class="mt"
      >
        <Column
          field="nr_inventar"
          header="Nr. inventar"
        />
        <Column
          field="suma"
          header="Amortizare lunară"
        >
          <template #body="{ data }">
            {{ fmtNum(data.suma, 4) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.mb { margin-bottom: 1rem; }
.campuri { display: grid; grid-template-columns: repeat(2, minmax(10rem, 16rem)); gap: 1rem; }
.campuri label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--app-muted); }
.w { width: 100%; }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
.card + .card { margin-top: 1rem; }
.statistici { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.statistici span { display: block; font-size: 0.8rem; color: var(--app-muted); }
.statistici strong { font-size: 1.2rem; }
.mt { margin-top: 1rem; }
</style>
