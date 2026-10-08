<script setup lang="ts">
definePageMeta({ layout: 'print' })
useHead({ title: 'Registru documente – BIFA' })
const route = useRoute()
const { idCurent } = useSesiune()
const q = computed(() => ({
  idgestiune: Number(route.query.idgestiune ?? idCurent.value),
  inceput: String(route.query.inceput ?? route.query.datainceput ?? isoData(new Date())),
  sfarsit: String(route.query.sfarsit ?? route.query.datasfarsit ?? isoData(new Date())),
  stare: 'activ' as const,
}))
const { data, status, error } = await useFetch('/api/documente', { query: q })
const { data: gestiune } = useFetch<GestiuneDetalii>(() => `/api/gestiuni/${q.value.idgestiune}`)
const { data: setari } = useFetch<Setari>('/api/setari')
const dirFin = computed(() => [setari.value?.grad_dir_fin_con, setari.value?.nume_dir_fin_con].filter(Boolean).join(' '))
// chronological order for the registry
const documente = computed(() => [...(data.value?.documente ?? [])].sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id))
</script>

<template>
  <RaportPagina
    titlu="Registrul documentelor justificative"
    :subtitlu="`Perioada ${fmtData(q.inceput)} – ${fmtData(q.sfarsit)}`"
    :filtre="[{ eticheta: 'Gestiunea', valoare: gestiune?.denumire ?? '' }]"
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="error"
      severity="error"
    >
      {{ mesajEroare(error) }}
    </Message>
    <table
      v-else-if="documente.length"
      class="r-tabel"
    >
      <thead>
        <tr>
          <th>Nr. crt.</th>
          <th>Tip document</th>
          <th>Număr</th>
          <th>Data</th>
          <th>Debit (lei)</th>
          <th>Credit (lei)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(d, i) in documente"
          :key="d.id"
        >
          <td class="c">
            {{ i + 1 }}
          </td>
          <td>{{ d.denumireTip }}</td>
          <td>{{ d.nrdoc }}</td>
          <td class="c">
            {{ fmtData(d.data) }}
          </td>
          <td class="n">
            {{ fmtNum(d.debit) }}
          </td>
          <td class="n">
            {{ fmtNum(d.credit) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            colspan="4"
            class="n"
          >
            TOTAL
          </td>
          <td class="n">
            {{ fmtNum(data?.totaluri.debit) }}
          </td>
          <td class="n">
            {{ fmtNum(data?.totaluri.credit) }}
          </td>
        </tr>
      </tfoot>
    </table>
    <div
      v-else
      class="r-gol"
    >
      Niciun document în perioada aleasă.
    </div>
    <RaportSemnaturi
      :blocuri="[
        { rol: 'Întocmit, gestionar', nume: gestiune?.gestionar },
        { rol: 'Verificat, director financiar-contabil', nume: dirFin },
      ]"
    />
  </RaportPagina>
</template>
