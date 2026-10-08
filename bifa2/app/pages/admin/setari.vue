<script setup lang="ts">
import { setariSchema } from '#shared/schemas/setari'

definePageMeta({ admin: true })
useHead({ title: 'Configurare – BIFA' })

const notify = useNotify()

const { data: setari, refresh } = await useFetch('/api/setari')
const form = reactive({
  institutie: setari.value?.institutie ?? '',
  grad_dir_fin_con: setari.value?.grad_dir_fin_con ?? '',
  nume_dir_fin_con: setari.value?.nume_dir_fin_con ?? '',
  grad_comandant: setari.value?.grad_comandant ?? '',
  nume_comandant: setari.value?.nume_comandant ?? '',
})
const erori = ref<Record<string, string>>({})
const salvare = ref(false)

async function salveaza() {
  const r = setariSchema.safeParse(form)
  if (!r.success) {
    erori.value = Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))
    return
  }
  erori.value = {}
  salvare.value = true
  try {
    await $fetch('/api/setari', { method: 'PUT', body: r.data })
    notify.ok('Configurarea a fost salvată.')
    await refresh()
  }
  catch (e) {
    notify.err(e)
  }
  finally {
    salvare.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Configurare <span class="sub">Datele instituției și semnatarii care apar în antetul rapoartelor</span></h1>
    </div>
    <form
      class="card form-setari"
      @submit.prevent="salveaza"
    >
      <div class="form-grid">
        <div class="field field-wide">
          <label for="s-inst">Instituția</label>
          <InputText
            id="s-inst"
            v-model="form.institutie"
            :invalid="!!erori.institutie"
          />
          <small
            v-if="erori.institutie"
            class="err"
          >{{ erori.institutie }}</small>
        </div>

        <h3 class="field-wide sectiune">
          Director financiar-contabil
        </h3>
        <div class="field">
          <label for="s-gdf">Grad</label>
          <InputText
            id="s-gdf"
            v-model="form.grad_dir_fin_con"
            :invalid="!!erori.grad_dir_fin_con"
          />
          <small
            v-if="erori.grad_dir_fin_con"
            class="err"
          >{{ erori.grad_dir_fin_con }}</small>
        </div>
        <div class="field">
          <label for="s-ndf">Nume</label>
          <InputText
            id="s-ndf"
            v-model="form.nume_dir_fin_con"
            :invalid="!!erori.nume_dir_fin_con"
          />
          <small
            v-if="erori.nume_dir_fin_con"
            class="err"
          >{{ erori.nume_dir_fin_con }}</small>
        </div>

        <h3 class="field-wide sectiune">
          Comandant
        </h3>
        <div class="field">
          <label for="s-gc">Grad</label>
          <InputText
            id="s-gc"
            v-model="form.grad_comandant"
            :invalid="!!erori.grad_comandant"
          />
          <small
            v-if="erori.grad_comandant"
            class="err"
          >{{ erori.grad_comandant }}</small>
        </div>
        <div class="field">
          <label for="s-nc">Nume</label>
          <InputText
            id="s-nc"
            v-model="form.nume_comandant"
            :invalid="!!erori.nume_comandant"
          />
          <small
            v-if="erori.nume_comandant"
            class="err"
          >{{ erori.nume_comandant }}</small>
        </div>
      </div>
      <div class="actiuni">
        <Button
          type="submit"
          label="Salvează"
          icon="pi pi-check"
          :loading="salvare"
        />
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-setari {
  max-width: 760px;
}
.sectiune {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 0.25rem;
}
.actiuni {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
