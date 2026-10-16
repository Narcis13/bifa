<script setup lang="ts">
import { DENUMIRI_GRUPA_MF, DENUMIRI_STARI_MF } from '#shared/schemas/mijloace-fixe'

definePageMeta({ layout: 'print' })
useHead({ title: 'Fișa mijlocului fix – BIFA' })

const route = useRoute()
const idgestiune = Number(route.query.idgestiune)
const idmijloc = Number(route.query.idmijloc)

const { data: gestiune } = useFetch(() => `/api/gestiuni/${idgestiune}`)
const { data, status, error } = await useFetch('/api/rapoarte/fisa-mf', {
  query: { idgestiune, idmijloc },
  immediate: !!idgestiune && !!idmijloc,
})

const ETICHETE = { i: 'Intrare', e: 'Casare', t: 'Transfer' } as const
const filtr = computed(() => [
  { eticheta: 'Gestiunea', valoare: gestiune.value?.denumire ?? '' },
  { eticheta: 'Nr. inventar', valoare: data.value?.mijloc.nr_inventar ?? '' },
  { eticheta: 'Stare', valoare: data.value ? DENUMIRI_STARI_MF[data.value.mijloc.stare_mf as 'in_functiune' | 'casat'] : '' },
])
const titlu = computed(() => `Fișa mijlocului fix${data.value ? `: ${data.value.mijloc.denumire}` : ''}`)
const valoareDupaInitiala = computed(() => {
  if (!data.value) return '0'
  return Dec.toFixed(Dec.sub(Dec.from(data.value.mijloc.valoare_intrare), Dec.from(data.value.mijloc.amortizare_initiala)), 4)
})
</script>

<template>
  <RaportPagina
    :titlu="titlu"
    :subtitlu="data ? `Nr. inventar ${data.mijloc.nr_inventar} · clasificare ${data.mijloc.cod_clasificare}` : undefined"
    :filtre="filtr"
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="!idmijloc"
      severity="warn"
    >
      Alegeți un mijloc fix din Registru MF sau din pagina Rapoarte.
    </Message>
    <Message
      v-else-if="error"
      severity="error"
    >
      {{ mesajEroare(error) }}
    </Message>
    <template v-else-if="data">
      <table class="r-tabel meta">
        <tbody>
          <tr>
            <th>Denumire</th>
            <td>{{ data.mijloc.denumire }}</td>
            <th>Grupa</th>
            <td>{{ DENUMIRI_GRUPA_MF[data.mijloc.grupa as 1 | 2 | 3] }}</td>
          </tr>
          <tr>
            <th>Caracteristici</th>
            <td colspan="3">
              {{ data.mijloc.caracteristici || '—' }}
            </td>
          </tr>
          <tr>
            <th>Categorie</th>
            <td>{{ data.mijloc.categorie }}</td>
            <th>Loc dispunere</th>
            <td>{{ data.mijloc.loc }}</td>
          </tr>
          <tr>
            <th>Valoare de intrare</th>
            <td class="n">
              {{ fmtNum(data.mijloc.valoare_intrare, 2) }}
            </td>
            <th>Data punerii în funcțiune</th>
            <td>{{ fmtData(data.mijloc.data_punere_functiune) }}</td>
          </tr>
          <tr>
            <th>Durata normală</th>
            <td>{{ data.mijloc.durata_ani }} ani</td>
            <th>Cota anuală</th>
            <td>{{ fmtNum(data.mijloc.cota_anuala, 2) }} %</td>
          </tr>
          <tr>
            <th>Amortizare lunară</th>
            <td class="n">
              {{ fmtNum(data.mijloc.amortizare_lunara, 4) }}
            </td>
            <th>Amortizare cumulată</th>
            <td class="n">
              {{ fmtNum(data.mijloc.amortizare_cumulata, 2) }}
            </td>
          </tr>
          <tr>
            <th>Amortizare la înregistrare</th>
            <td class="n">
              {{ fmtNum(data.mijloc.amortizare_initiala, 2) }}
            </td>
            <th>Valoare rămasă</th>
            <td class="n">
              {{ fmtNum(data.mijloc.valoare_ramasa, 2) }}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 class="sect">
        Mișcări
      </h2>
      <table class="r-tabel">
        <thead>
          <tr>
            <th>Data</th>
            <th>Document</th>
            <th>Operațiune</th>
            <th>Din loc</th>
            <th>În loc</th>
            <th>Valoare</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(m, i) in data.miscari"
            :key="i"
          >
            <td>{{ fmtData(m.data) }}</td>
            <td>{{ m.denumireScurta }} {{ m.nrdoc }}</td>
            <td>{{ ETICHETE[m.tip as 'i' | 'e' | 't'] }}</td>
            <td>{{ m.loc_sursa || '—' }}</td>
            <td>{{ m.loc_destinatie || '—' }}</td>
            <td class="n">
              {{ fmtNum(m.valoare, 2) }}
            </td>
          </tr>
          <tr v-if="!data.miscari.length">
            <td
              colspan="6"
              class="empty"
            >
              Nu există mișcări.
            </td>
          </tr>
        </tbody>
      </table>

      <h2 class="sect">
        Amortizare liniară
      </h2>
      <table class="r-tabel">
        <thead>
          <tr>
            <th>An</th>
            <th>Luna</th>
            <th>Suma</th>
            <th>Cumulată</th>
            <th>Valoare rămasă</th>
            <th>Data calcul</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="Number(data.mijloc.amortizare_initiala) > 0"
            class="sold"
          >
            <td colspan="2">
              La înregistrare
            </td>
            <td class="n">
              {{ fmtNum(data.mijloc.amortizare_initiala, 4) }}
            </td>
            <td class="n">
              {{ fmtNum(data.mijloc.amortizare_initiala, 4) }}
            </td>
            <td class="n">
              {{ fmtNum(valoareDupaInitiala, 4) }}
            </td>
            <td>{{ fmtData(data.mijloc.data_punere_functiune) }}</td>
          </tr>
          <tr
            v-for="(a, i) in data.amortizari"
            :key="i"
          >
            <td>{{ a.an }}</td>
            <td>{{ String(a.luna).padStart(2, '0') }}</td>
            <td class="n">
              {{ fmtNum(a.suma, 4) }}
            </td>
            <td class="n">
              {{ fmtNum(a.cumulata, 4) }}
            </td>
            <td class="n">
              {{ fmtNum(a.valoare_ramasa, 4) }}
            </td>
            <td>{{ fmtData(a.data_calcul) }}</td>
          </tr>
          <tr v-if="!data.amortizari.length && Number(data.mijloc.amortizare_initiala) === 0">
            <td
              colspan="6"
              class="empty"
            >
              Nu există amortizări calculate.
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </RaportPagina>
</template>

<style scoped>
.meta th { width: 12rem; text-align: left; background: var(--app-bg, #f5f5f5); }
.sect { margin: 1.25rem 0 0.5rem; font-size: 1rem; }
.empty { text-align: center; color: var(--app-muted); }
</style>
