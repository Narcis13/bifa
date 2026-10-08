<script setup lang="ts">
const { user, esteAdmin, gestiuni, idCurent, logout } = useSesiune()
const { tema, comuta } = useTema()
const route = useRoute()
const meniuDeschis = ref(false)
const meniuUser = ref()

const grupe = computed(() => MENIU
  .map(g => ({ ...g, items: g.items.filter(i => !i.admin || esteAdmin.value) }))
  .filter(g => g.items.length))

const activ = (to: string) => {
  const [p, q] = to.split('?')
  if (q) return route.path === p && route.fullPath.includes(q)
  return route.path === p || route.path.startsWith(`${p}/`)
}

const itemsUser = computed(() => [
  { label: user.value?.name || user.value?.username, disabled: true },
  { separator: true },
  { label: tema.value === 'dark' ? 'Temă luminoasă' : 'Temă întunecată', icon: tema.value === 'dark' ? 'pi pi-sun' : 'pi pi-moon', command: comuta },
  { label: 'Ieșire', icon: 'pi pi-sign-out', command: logout },
])

watch(() => route.fullPath, () => {
  meniuDeschis.value = false
})
</script>

<template>
  <div
    class="shell"
    :class="{ 'menu-open': meniuDeschis }"
  >
    <aside
      class="sidebar"
      aria-label="Meniu principal"
    >
      <NuxtLink
        to="/"
        class="brand"
      >
        <span class="brand-mark">B</span>
        <span>
          <strong>BIFA</strong>
          <small>Gestiune materiale</small>
        </span>
      </NuxtLink>
      <nav>
        <section
          v-for="g in grupe"
          :key="g.titlu"
        >
          <h2>{{ g.titlu }}</h2>
          <NuxtLink
            v-for="i in g.items"
            :key="i.to"
            :to="i.to"
            class="nav-link"
            :class="{ active: activ(i.to) }"
          >
            <i :class="i.icon" />
            <span>{{ i.label }}</span>
          </NuxtLink>
        </section>
      </nav>
    </aside>
    <div
      class="backdrop"
      @click="meniuDeschis = false"
    />
    <div class="main">
      <header class="topbar">
        <Button
          class="menu-toggle"
          icon="pi pi-bars"
          text
          rounded
          aria-label="Meniu"
          @click="meniuDeschis = !meniuDeschis"
        />
        <div class="gestiune-switch">
          <label for="gestiune-curenta">Gestiune</label>
          <Select
            v-model="idCurent"
            input-id="gestiune-curenta"
            :options="gestiuni"
            option-label="denumire"
            option-value="id"
            placeholder="Nicio gestiune"
            class="gestiune-select"
          />
        </div>
        <span class="spacer" />
        <Button
          :icon="tema === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
          text
          rounded
          :aria-label="tema === 'dark' ? 'Temă luminoasă' : 'Temă întunecată'"
          @click="comuta"
        />
        <Button
          text
          class="user-btn"
          aria-haspopup="true"
          aria-label="Meniu utilizator"
          @click="meniuUser.toggle($event)"
        >
          <Avatar
            :label="(user?.name || user?.username || '?').slice(0, 1).toUpperCase()"
            shape="circle"
          />
          <span class="user-name">{{ user?.name || user?.username }}</span>
          <i class="pi pi-angle-down" />
        </Button>
        <Menu
          ref="meniuUser"
          :model="itemsUser"
          popup
        />
      </header>
      <main class="content">
        <Message
          v-if="!gestiuni.length"
          severity="warn"
        >
          Nu aveți nicio gestiune atribuită. Contactați un administrator.
        </Message>
        <slot />
      </main>
    </div>
    <Toast />
    <ConfirmDialog />
  </div>
</template>
