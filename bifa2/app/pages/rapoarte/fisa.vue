<script setup lang="ts">
definePageMeta({ layout: 'print' })
useHead({ title: 'Fișa de cont – BIFA' })
const { q, apiQuery, filtre, perioada, gestiune, dirFin } = useRaport()
const { data, status, error } = await useFetch('/api/rapoarte/fisa', { query: apiQuery, immediate: !!q.value.idreper })
const titlu = computed(() => `Fișa de cont analitică${data.value?.material ? `: ${data.value.material.denumire}` : ''}`)
</script>

<template>
  <RaportPagina
    :titlu="titlu"
    :subtitlu="`Cod material ${q.idreper ?? '—'} · perioada ${perioada}`"
    :filtre="filtre"
    landscape
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="!q.idreper"
      severity="warn"
    >
      Alegeți un material din pagina Rapoarte.
    </Message>
    <Message
      v-else-if="error"
      severity="error"
    >
      {{ mesajEroare(error) }}
    </Message>
    <table
      v-else-if="data"
      class="r-tabel"
    >
      <thead>
        <tr>
          <th rowspan="2">
            Data
          </th>
          <th rowspan="2">
            Explicații
          </th>
          <th rowspan="2">
            U.M.
          </th>
          <th colspan="3">
            Cantitativ
          </th>
          <th colspan="3">
            Valoric (lei)
          </th>
        </tr>
        <tr>
          <th>Intrări</th>
          <th>Ieșiri</th>
          <th>Stoc</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Sold</th>
        </tr>
      </thead>
      <tbody>
        <tr class="sold">
          <td>înainte de {{ fmtData(q.datainceput) }}</td>
          <td>SOLD INIȚIAL</td>
          <td />
          <td />
          <td />
          <td class="n">
            {{ fmtNum(data.soldInitial.cantitate) }}
          </td>
          <td />
          <td />
          <td class="n">
            {{ fmtNum(data.soldInitial.valoare) }}
          </td>
        </tr>
        <tr
          v-for="(l, i) in data.linii"
          :key="i"
        >
          <td>{{ fmtData(l.data) }}</td>
          <td>{{ l.explicatii }}</td>
          <td class="c">
            {{ l.um }}
          </td>
          <td class="n">
            {{ fmtNum(l.cantitate_debit) }}
          </td>
          <td class="n">
            {{ fmtNum(l.cantitate_credit) }}
          </td>
          <td class="n">
            {{ fmtNum(l.sold_cantitate) }}
          </td>
          <td class="n">
            {{ fmtNum(l.debit) }}
          </td>
          <td class="n">
            {{ fmtNum(l.credit) }}
          </td>
          <td class="n">
            {{ fmtNum(l.sold_valoare) }}
          </td>
        </tr>
        <tr class="total">
          <td>{{ fmtData(q.datasfarsit) }}</td>
          <td>SOLD FINAL</td>
          <td />
          <td />
          <td />
          <td class="n">
            {{ fmtNum(data.soldFinal.cantitate) }}
          </td>
          <td />
          <td />
          <td class="n">
            {{ fmtNum(data.soldFinal.valoare) }}
          </td>
        </tr>
      </tbody>
    </table>
    <RaportSemnaturi
      :blocuri="[
        { rol: 'Întocmit, gestionar', nume: gestiune?.gestionar },
        { rol: 'Verificat, director financiar-contabil', nume: dirFin },
      ]"
    />
  </RaportPagina>
</template>
