<script setup lang="ts">
/** A4 report page: toolbar (back / print), institution header, title, filters, content, signatures. */
defineProps<{
  titlu: string
  subtitlu?: string
  filtre?: { eticheta: string, valoare: string }[]
  landscape?: boolean
  seIncarca?: boolean
}>()

const { data: setari } = useFetch<{ institutie: string }>('/api/setari')
const router = useRouter()
const tipareste = () => window.print()
const inapoi = () => (window.history.length > 1 ? router.back() : navigateTo('/rapoarte'))
</script>

<template>
  <div>
    <div class="print-toolbar">
      <span class="titlu-bara">{{ titlu }}</span>
      <Button
        label="Înapoi"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        @click="inapoi"
      />
      <Button
        label="Tipărește"
        icon="pi pi-print"
        :disabled="seIncarca"
        @click="tipareste"
      />
    </div>
    <article
      class="a4"
      :class="{ landscape }"
    >
      <header class="r-antet">
        <div class="stanga">
          <div>România</div>
          <div>Ministerul Apărării Naționale</div>
          <div>{{ setari?.institutie }}</div>
        </div>
        <div class="dreapta">
          <div>Neclasificat</div>
          <div>Exemplar nr. ___</div>
        </div>
      </header>
      <div class="r-titlu">
        <h1>{{ titlu }}</h1>
        <p v-if="subtitlu">
          {{ subtitlu }}
        </p>
      </div>
      <div
        v-if="filtre?.length"
        class="r-filtre"
      >
        <span
          v-for="f in filtre"
          :key="f.eticheta"
        >{{ f.eticheta }}: <b>{{ f.valoare }}</b></span>
      </div>
      <div
        v-if="seIncarca"
        class="r-gol"
      >
        Se încarcă…
      </div>
      <slot v-else />
    </article>
  </div>
</template>
