<script setup lang="ts">
useHead({ title: 'BIFA – Gestiune materiale' })
const { user, gestiuneCurenta } = useSesiune()
const scurtaturi = MENIU.flatMap(g => g.items).filter(i => !i.admin)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>
        Bun venit, {{ user?.name || user?.username }}
        <span class="sub">Gestiunea curentă: <strong>{{ gestiuneCurenta?.denumire ?? '—' }}</strong></span>
      </h1>
    </div>
    <div class="tiles">
      <NuxtLink
        v-for="s in scurtaturi"
        :key="s.to"
        :to="s.to"
        class="card tile"
      >
        <i :class="s.icon" />
        <span>{{ s.label }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.tile { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; font-weight: 600; }
.tile:hover { border-color: var(--p-primary-color); }
.tile i { font-size: 1.4rem; color: var(--p-primary-color); }
</style>
