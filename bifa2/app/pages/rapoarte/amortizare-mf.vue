<script setup lang="ts">
definePageMeta({ layout: 'print' })
useHead({ title: 'Situație amortizare lunară – BIFA' })

const route = useRoute()
const idgestiune = Number(route.query.idgestiune)
const an = Number(route.query.an)
const luna = Number(route.query.luna)
const idcateg = route.query.idcateg ? Number(route.query.idcateg) : undefined
const idloc = route.query.idloc ? Number(route.query.idloc) : undefined

const LUNI = ['', 'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']

const { data: gestiune } = useFetch(() => `/api/gestiuni/${idgestiune}`)
const { data, status, error } = await useFetch('/api/rapoarte/amortizare-mf', {
  query: { idgestiune, an, luna, idcateg, idloc },
  immediate: !!idgestiune && !!an && !!luna,
})

const filtr = computed(() => [
  { eticheta: 'Gestiunea', valoare: gestiune.value?.denumire ?? '' },
  { eticheta: 'Perioada', valoare: `${LUNI[luna] ?? luna} ${an}` },
])
</script>

<template>
  <RaportPagina
    titlu="Situația amortizării lunare a mijloacelor fixe"
    :subtitlu="`${LUNI[luna] ?? ''} ${an}`.trim()"
    :filtre="filtr"
    landscape
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="!an || !luna"
      severity="warn"
    >
      Alegeți luna din pagina Rapoarte sau Amortizare lunară.
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
          <th>Nr. inventar</th>
          <th>Denumire</th>
          <th>Clasificare</th>
          <th>Categorie</th>
          <th>Loc</th>
          <th>Val. intrare</th>
          <th>Amort. lunară plan</th>
          <th>Amort. luna curentă</th>
          <th>Amort. cumulată</th>
          <th>Val. rămasă</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="l in data.linii"
          :key="l.idmijloc"
        >
          <td>{{ l.nr_inventar }}</td>
          <td>{{ l.denumire }}</td>
          <td>{{ l.cod_clasificare }}</td>
          <td>{{ l.categorie }}</td>
          <td>{{ l.loc }}</td>
          <td class="n">
            {{ fmtNum(l.valoare_intrare, 2) }}
          </td>
          <td class="n">
            {{ fmtNum(l.amortizare_lunara, 4) }}
          </td>
          <td class="n">
            {{ fmtNum(l.suma, 4) }}
          </td>
          <td class="n">
            {{ fmtNum(l.amortizare_cumulata, 2) }}
          </td>
          <td class="n">
            {{ fmtNum(l.valoare_ramasa, 2) }}
          </td>
        </tr>
        <tr
          v-if="!data.linii.length"
          class="empty"
        >
          <td colspan="10">
            Nu există amortizări calculate pentru această lună. Generați-le din Mijloace fixe → Amortizare lunară.
          </td>
        </tr>
      </tbody>
      <tfoot v-if="data.linii.length">
        <tr class="sold">
          <td colspan="7">
            Total amortizare {{ LUNI[luna] }} {{ an }}
          </td>
          <td class="n">
            {{ fmtNum(data.total, 4) }}
          </td>
          <td colspan="2" />
        </tr>
      </tfoot>
    </table>
  </RaportPagina>
</template>
