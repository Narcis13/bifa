<script setup lang="ts">
definePageMeta({ layout: 'print' })
useHead({ title: 'Lista de inventariere – BIFA' })
const { apiQuery, filtre, perioada, gestiune, dirFin } = useRaport()
const { data, status, error } = await useFetch('/api/rapoarte/inventar', { query: apiQuery })
const membri = computed(() => [gestiune.value?.i_membru1, gestiune.value?.i_membru2, gestiune.value?.i_membru3].filter((m): m is string => !!m))
</script>

<template>
  <RaportPagina
    titlu="Lista de inventariere"
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
            Cantități
          </th>
          <th colspan="4">
            Valoare contabilă (lei)
          </th>
        </tr>
        <tr>
          <th>Stoc faptic</th>
          <th>Stoc scriptic</th>
          <th>Dif. plus</th>
          <th>Dif. minus</th>
          <th>Preț unitar</th>
          <th>Valoare</th>
          <th>Dif. plus</th>
          <th>Dif. minus</th>
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
          <td />
          <td class="n">
            {{ fmtNum(l.stocfinal) }}
          </td>
          <td />
          <td />
          <td class="n">
            {{ fmtNum(l.pret, 4) }}
          </td>
          <td class="n">
            {{ fmtNum(l.valoarestoc) }}
          </td>
          <td />
          <td />
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            colspan="9"
            class="n"
          >
            TOTAL
          </td>
          <td class="n">
            {{ fmtNum(data.totaluri.valoarestoc) }}
          </td>
          <td />
          <td />
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
        { rol: 'Comisia de inventariere, președinte', nume: gestiune?.i_presedinte },
        { rol: 'Membri', detalii: membri },
        { rol: 'Gestionar', nume: gestiune?.gestionar },
        { rol: 'Contabilitate', nume: dirFin },
      ]"
    />
    <p class="r-declaratie">
      Bunurile materiale arătate în prezenta listă de inventariere au fost constatate ca existente de către comisie
      în prezența mea. Am / nu am obiecții în legătură cu cele constatate și confirm că bunurile materiale sunt în
      păstrarea mea.
      <br><br>
      Gestionar {{ gestiune?.gestionar ?? '______________________' }}, semnătura ______________
    </p>
  </RaportPagina>
</template>
