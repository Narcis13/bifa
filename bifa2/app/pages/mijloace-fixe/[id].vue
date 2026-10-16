<script setup lang="ts">
import { DENUMIRI_GRUPA_MF, DENUMIRI_STARI_MF } from '#shared/schemas/mijloace-fixe'

const route = useRoute()
const id = Number(route.params.id)
useHead({ title: `Mijloc fix ${id} – BIFA` })
const notify = useNotify()

const { data: mf, error } = await useAsyncData(`mf-${id}`, () => useRequestFetch()(`/api/mijloace-fixe/${id}`))
if (error.value || !mf.value) {
  if (import.meta.client) notify.err(error.value)
  await navigateTo('/mijloace-fixe')
}

const fisaUrl = computed(() =>
  `/rapoarte/fisa-mf?idgestiune=${mf.value?.idgestiune}&idmijloc=${id}`)
</script>

<template>
  <div v-if="mf">
    <div class="page-head">
      <h1>
        {{ mf.nr_inventar }} — {{ mf.denumire }}
        <span class="sub">{{ mf.categorie }} · {{ mf.loc }}</span>
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
        as="a"
        :href="fisaUrl"
        target="_blank"
        label="Fișa mijlocului fix"
        icon="pi pi-print"
      />
    </div>

    <div class="grid">
      <div class="card">
        <h2>Identificare</h2>
        <dl>
          <div><dt>Nr. inventar</dt><dd>{{ mf.nr_inventar }}</dd></div>
          <div><dt>Denumire</dt><dd>{{ mf.denumire }}</dd></div>
          <div><dt>Caracteristici</dt><dd>{{ mf.caracteristici || '—' }}</dd></div>
          <div><dt>Cod clasificare</dt><dd>{{ mf.cod_clasificare }}</dd></div>
          <div><dt>Grupa</dt><dd>{{ DENUMIRI_GRUPA_MF[mf.grupa as 1 | 2 | 3] }}</dd></div>
          <div><dt>Categorie</dt><dd>{{ mf.categorie }}</dd></div>
          <div><dt>Loc de dispunere</dt><dd>{{ mf.loc }}</dd></div>
          <div>
            <dt>Stare</dt>
            <dd>
              <Tag
                :value="DENUMIRI_STARI_MF[mf.stare_mf as 'in_functiune' | 'casat']"
                :severity="mf.stare_mf === 'in_functiune' ? 'success' : 'danger'"
              />
            </dd>
          </div>
        </dl>
      </div>
      <div class="card">
        <h2>Valori și amortizare</h2>
        <dl>
          <div><dt>Valoare de intrare</dt><dd>{{ fmtNum(mf.valoare_intrare, 2) }} lei</dd></div>
          <div><dt>Amortizare inițială (la înregistrare)</dt><dd>{{ fmtNum(mf.amortizare_initiala, 2) }} lei</dd></div>
          <div><dt>Amortizare cumulată</dt><dd>{{ fmtNum(mf.amortizare_cumulata, 2) }} lei</dd></div>
          <div><dt>Valoare rămasă</dt><dd>{{ fmtNum(mf.valoare_ramasa, 2) }} lei</dd></div>
          <div><dt>Durata normală</dt><dd>{{ mf.durata_ani }} ani ({{ mf.durata_luni }} luni)</dd></div>
          <div><dt>Cota anuală</dt><dd>{{ fmtNum(mf.cota_anuala, 2) }} %</dd></div>
          <div><dt>Amortizare lunară</dt><dd>{{ fmtNum(mf.amortizare_lunara, 4) }} lei</dd></div>
          <div><dt>Data punerii în funcțiune</dt><dd>{{ fmtData(mf.data_punere_functiune) }}</dd></div>
          <div v-if="mf.data_casare">
            <dt>Data casării</dt><dd>{{ fmtData(mf.data_casare) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
dl { margin: 0; display: grid; gap: 0.65rem; }
dl > div { display: grid; grid-template-columns: 12rem 1fr; gap: 0.5rem; }
dt { color: var(--app-muted); font-size: 0.85rem; }
dd { margin: 0; }
</style>
