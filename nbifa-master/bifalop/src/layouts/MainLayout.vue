<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
         BIFA ALOP 
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1 "

    >
    <div class="column items-center">
       <q-input v-show="!global.state.user.autentificat" class="q-mt-md" v-model="username" filled dense label="Utilizator" />
       <q-input v-show="!global.state.user.autentificat" class="q-mt-md" v-model="password" filled dense type="password" label="Parola" />
        <q-btn v-show="!global.state.user.autentificat" class="q-ma-md col" outline rounded color="primary" label="Autentificare" @click="autentificare"/>
    
     <q-card class="col my-card" v-show="global.state.user.autentificat">
      <q-card-section>
        <div class="text-h6">{{global.state.user.nume}}</div>
        <div class="text-subtitle2">{{global.state.user.rol}}</div>
        <div class="text-subtitle2">{{global.state.user.compartiment}}</div>
      </q-card-section>

      <q-separator />

      <q-card-actions vertical>
        <q-btn to="/" flat @click="global.actions.deconectare">Deconectare!</q-btn>

      </q-card-actions>
    </q-card>

        <Meniu v-show="global.state.user.autentificat" class="q-mt-md col"/>
    </div>

    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'
import Meniu from 'components/Meniu.vue'


const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev'
  }
];

import { defineComponent, ref ,inject} from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
    Meniu
  },

  setup () {
    const leftDrawerOpen = ref(false)
    const username = ref("")
    const password = ref("")
    const global=inject('global');
    const $q = useQuasar()
    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      username,
      password,
      global,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      autentificare(){

        console.log(process.env.host);
          axios.post(process.env.host+'user/loginaky',{user:username.value,parola:password.value}).then(
                      res => {
                        console.log('Raspuns la autentificare ',res)
                        username.value=''
                        password.value=''
                        $q.notify({
                              message:res.data.message,
                              timeout:2000,
                              position:'top',
                              color:'positive'
                            }) 

                        global.actions.autentificare(res.data)
                      }
              ).catch(err=>{
                username.value=''
                password.value=''
                    $q.notify({
                              color: 'negative',
                              timeout:1500,
                              position:'top',
                              icon: 'delete',
                              message: `User sau parola incorecte...`
                            })
                console.log('Eroare autentificare',err);
              });

      }
    }
  }
})
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 250px
</style>