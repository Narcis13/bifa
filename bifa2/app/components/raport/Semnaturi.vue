<script setup lang="ts">
/** Signature blocks: role, name (optional) and a signature line. */
defineProps<{ blocuri: { rol: string, nume?: string | null, detalii?: string[] }[] }>()
</script>

<template>
  <section class="r-semnaturi">
    <div
      v-for="b in blocuri"
      :key="b.rol"
      class="bloc"
    >
      <div class="rol">
        {{ b.rol }}
      </div>
      <div
        v-if="b.nume"
        class="nume"
      >
        {{ b.nume }}
      </div>
      <div
        v-for="d in b.detalii ?? []"
        :key="d"
        class="nume"
      >
        {{ d }}
      </div>
      <div class="linie">
        semnătura
      </div>
    </div>
  </section>
</template>
