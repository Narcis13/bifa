<script setup lang="ts">
definePageMeta({ layout: 'print' })
useHead({ title: 'Balanța analitică – BIFA' })
const { apiQuery, filtre, perioada, gestiune, dirFin } = useRaport()
const { data, status, error } = await useFetch('/api/rapoarte/balanta', { query: apiQuery })
</script>

<template>
  <RaportPagina
    titlu="Balanța analitică de gestiune"
    :subtitlu="`Perioada ${perioada}`"
    :filtre="filtre"
    landscape
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="error"
      severity="error"
    >
      {{ mesajEroare(error) }}
    </Message>
    <table
      v-else-if="data?.linii.length"
      class="r-tabel"
    >
      <thead>
        <tr>
          <th rowspan="2">
            Nr. crt.
          </th>
          <th rowspan="2">
            Cod
          </th>
          <th rowspan="2">
            Denumire
          </th>
          <th rowspan="2">
            U.M.
          </th>
          <th colspan="4">
            Cantitativ
          </th>
          <th colspan="4">
            Valoric (lei)
          </th>
        </tr>
        <tr>
          <th>Stoc inițial</th>
          <th>Intrări</th>
          <th>Ieșiri</th>
          <th>Stoc final</th>
          <th>Sold inițial</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Sold final</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(l, i) in data.linii"
          :key="l.id_reper"
        >
          <td class="c">
            {{ i + 1 }}
          </td>
          <td class="c">
            {{ l.id_reper }}
          </td>
          <td>{{ l.denumire }}</td>
          <td class="c">
            {{ l.um }}
          </td>
          <td class="n">
            {{ fmtNum(l.stocinitial) }}
          </td>
          <td class="n">
            {{ fmtNum(l.ti) }}
          </td>
          <td class="n">
            {{ fmtNum(l.te) }}
          </td>
          <td class="n">
            {{ fmtNum(l.stocfinal) }}
          </td>
          <td class="n">
            {{ fmtNum(l.valoarestocinitial) }}
          </td>
          <td class="n">
            {{ fmtNum(l.vi) }}
          </td>
          <td class="n">
            {{ fmtNum(l.ve) }}
          </td>
          <td class="n">
            {{ fmtNum(l.valoarestoc) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            colspan="8"
            class="n"
          >
            TOTAL
          </td>
          <td class="n">
            {{ fmtNum(data.totaluri.valoarestocinitial) }}
          </td>
          <td class="n">
            {{ fmtNum(data.totaluri.vi) }}
          </td>
          <td class="n">
            {{ fmtNum(data.totaluri.ve) }}
          </td>
          <td class="n">
            {{ fmtNum(data.totaluri.valoarestoc) }}
          </td>
        </tr>
      </tfoot>
    </table>
    <div
      v-else
      class="r-gol"
    >
      Niciun material cu stoc în perioada și filtrele alese.
    </div>
    <RaportSemnaturi
      :blocuri="[
        { rol: 'Întocmit, gestionar', nume: gestiune?.gestionar },
        { rol: 'Verificat, director financiar-contabil', nume: dirFin },
      ]"
    />
  </RaportPagina>
</template>
