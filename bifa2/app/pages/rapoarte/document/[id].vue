<script setup lang="ts">
definePageMeta({ layout: 'print' })
const route = useRoute()
const { data: doc, status, error } = await useFetch(() => `/api/documente/${route.params.id}`)
useHead({ title: computed(() => (doc.value ? `${doc.value.denumireScurta} ${doc.value.nrdoc}` : 'Document') + ' – BIFA') })
const { data: gestiune } = useFetch<GestiuneDetalii>(() => `/api/gestiuni/${doc.value?.idgestiune}`, { immediate: !!doc.value })

const unice = (vals: string[]) => [...new Set(vals)].join(' → ')
const filtre = computed(() => doc.value
  ? [
      { eticheta: 'Gestiunea', valoare: gestiune.value?.denumire ?? '' },
      { eticheta: 'Locul', valoare: unice(doc.value.linii.map(l => l.loc)) || '—' },
      { eticheta: 'Starea', valoare: unice(doc.value.linii.map(l => l.stare_material)) || '—' },
      { eticheta: 'Nr. intern', valoare: String(doc.value.id) },
    ]
  : [])
const comisieReceptie = computed(() => [gestiune.value?.r_membru1, gestiune.value?.r_membru2, gestiune.value?.r_membru3].filter((m): m is string => !!m))
const semnaturi = computed(() => doc.value?.tip === 'i'
  ? [
      { rol: 'Comisia de recepție, președinte', nume: gestiune.value?.r_presedinte },
      { rol: 'Membri', detalii: comisieReceptie.value },
      { rol: 'Primit în gestiune', nume: gestiune.value?.gestionar },
    ]
  : [
      { rol: 'Predat, gestionar', nume: gestiune.value?.gestionar },
      { rol: 'Primit', nume: '' },
      { rol: 'Verificat', nume: '' },
    ])
</script>

<template>
  <RaportPagina
    :titlu="doc ? doc.denumireTip : 'Document'"
    :subtitlu="doc ? `${doc.denumireScurta} nr. ${doc.nrdoc} din ${fmtData(doc.data)}${doc.stare !== 'activ' ? ' (INVALIDAT)' : ''}` : ''"
    :filtre="filtre"
    :se-incarca="status === 'pending'"
  >
    <Message
      v-if="error"
      severity="error"
    >
      {{ mesajEroare(error) }}
    </Message>
    <table
      v-else-if="doc?.linii.length"
      class="r-tabel"
    >
      <thead>
        <tr>
          <th>Nr. crt.</th>
          <th>Categoria</th>
          <th>Denumire</th>
          <th>U.M.</th>
          <th>Cant. debit</th>
          <th>Cant. credit</th>
          <th>Preț</th>
          <th>Debit</th>
          <th>Credit</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(l, i) in doc.linii"
          :key="l.id"
        >
          <td class="c">
            {{ i + 1 }}
          </td>
          <td>{{ l.categorie }}</td>
          <td>
            {{ l.material }}
            <div
              v-if="l.cod_import"
              style="font-size: 7.5pt; color: #5b6670"
            >
              cod {{ l.cod_import }}
            </div>
          </td>
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
            {{ fmtNum(l.pret, 4) }}
          </td>
          <td class="n">
            {{ fmtNum(l.debit) }}
          </td>
          <td class="n">
            {{ fmtNum(l.credit) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            colspan="7"
            class="n"
          >
            TOTAL
          </td>
          <td class="n">
            {{ fmtNum(doc.totalDebit) }}
          </td>
          <td class="n">
            {{ fmtNum(doc.totalCredit) }}
          </td>
        </tr>
      </tfoot>
    </table>
    <div
      v-else
      class="r-gol"
    >
      Documentul nu are linii.
    </div>
    <RaportSemnaturi :blocuri="semnaturi" />
  </RaportPagina>
</template>
