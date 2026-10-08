<script setup lang="ts">
import { loginSchema } from '#shared/schemas/auth'

definePageMeta({ layout: false })
useHead({ title: 'Autentificare – BIFA' })

const { login } = useSesiune()
const route = useRoute()
const form = reactive({ username: '', password: '' })
const eroare = ref('')
const seIncarca = ref(false)

async function trimite() {
  eroare.value = ''
  const r = loginSchema.safeParse(form)
  if (!r.success) {
    eroare.value = r.error.issues[0]!.message
    return
  }
  seIncarca.value = true
  try {
    await login(r.data.username, r.data.password)
    await navigateTo(typeof route.query.r === 'string' ? route.query.r : '/')
  }
  catch (e) {
    eroare.value = (e as { data?: { message?: string } }).data?.message ?? 'Autentificare eșuată.'
  }
  finally {
    seIncarca.value = false
  }
}
</script>

<template>
  <main class="login">
    <form
      class="login-card"
      @submit.prevent="trimite"
    >
      <div class="login-brand">
        <span class="brand-mark">B</span>
        <div>
          <h1>BIFA</h1>
          <p>Gestiune materiale</p>
        </div>
      </div>
      <label for="u">Utilizator</label>
      <InputText
        id="u"
        v-model="form.username"
        autocomplete="username"
        autofocus
        fluid
      />
      <label for="p">Parolă</label>
      <Password
        v-model="form.password"
        input-id="p"
        :feedback="false"
        toggle-mask
        autocomplete="current-password"
        fluid
      />
      <Message
        v-if="eroare"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ eroare }}
      </Message>
      <Button
        type="submit"
        label="Intră în aplicație"
        icon="pi pi-sign-in"
        :loading="seIncarca"
        fluid
      />
    </form>
  </main>
</template>
