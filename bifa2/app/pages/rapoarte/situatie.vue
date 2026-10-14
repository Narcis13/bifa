<script setup lang="ts">
import { DENUMIRI_TIP_MATERIAL } from '#shared/schemas/common'

definePageMeta({ layout: 'print' })
useHead({ title: 'Situație repere – BIFA' })
const { apiQuery, q, perioada, gestiune } = useRaport()
const { data, status, error } = await useFetch('/api/rapoarte/situatie', { query: apiQuery })
/** Only gestiune + tip material: the table itself breaks down category, place and state. */
const filtre = computed(() => [
  { eticheta: 'Gestiunea', valoare: gestiune.value?.denumire ?? '' },
  { eticheta: 'Tip material', valoare: DENUMIRI_TIP_MATERIAL[q.value.tipMaterial] },
])
</script>

<template>
  <RaportPagina
    titlu="Situație repere"
    :subtitlu="`Stoc la ${fmtData(q.datasfarsit)} · perioada ${perioada}`"
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
          <th>Nr. crt.</th>
          <th>Cod</th>
          <th>Denumire</th>
          <th>U.M.</th>
          <th>Categorie</th>
          <th>Loc de dispunere</th>
          <th>Stare</th>
          <th>Cantitate</th>
          <th>Preț mediu</th>
          <th>Valoare (lei)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(l, i) in data.linii"
          :key="`${l.id_reper}-${l.id_categ}-${l.id_loc}-${l.stare_material}`"
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
          <td>{{ l.categorie }}</td>
          <td>{{ l.loc }}</td>
          <td class="c">
            {{ l.stare_material }}
          </td>
          <td class="n">
            {{ fmtNum(l.cantitate) }}
          </td>
          <td class="n">
            {{ fmtNum(l.pret, 4) }}
          </td>
          <td class="n">
            {{ fmtNum(l.valoare) }}
          </td>
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
            {{ fmtNum(data.totaluri.valoare) }}
          </td>
        </tr>
      </tfoot>
    </table>
    <div
      v-else
      class="r-gol"
    >
      Niciun reper cu stoc la data de sfârșit a perioadei.
    </div>
    <RaportSemnaturi
      :blocuri="[
        { rol: 'Întocmit, gestionar', nume: gestiune?.gestionar },
      ]"
    />
  </RaportPagina>
</template>
