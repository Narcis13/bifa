<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-btn
          flat
          dense
          round
          @click="left = !left"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          BIFA Gestiune vers. 1.0 
          
        </q-toolbar-title>
        <q-btn v-if="!userAutentificat" icon="lock" flat dense @click="doLogin">Autentificare!</q-btn>
              <q-btn-dropdown
                  class="glossy"
                  color="purple"
                  v-if="userAutentificat"
                  :label="numeUtilizator+' '+gestiuneaCurenta"
                  @input="actUser"
                >
                  <div class="row no-wrap q-pa-md">
                    <div class="column">
                      <div class="text-h6 q-mb-md">Gestiuni operate</div>
                        <q-option-group
                          v-model="group"
                          :options="gestiuni"
                          color="primary"
                        />
                    </div>

                    <q-separator vertical inset class="q-mx-lg" />

                    <div class="column items-center">
                      <q-avatar size="72px">
                        <img src="~assets/user.svg">
                      </q-avatar>

                      <div class="text-subtitle1 q-mt-md q-mb-xs">{{numeUtilizator}} {{gestiuneaCurenta}}</div>

                      <q-btn
                        color="primary"
                        label="Inchide"
                        push
                        size="sm"
                        @click="inchideUser"
                        v-close-popup
                      />
                    </div>
                  </div>
                </q-btn-dropdown>
        <q-btn  v-if="userAutentificat" icon="backspace" flat  @click="doLogout"> Iesire!</q-btn>
      </q-toolbar>
    </q-header>

   <q-drawer :width="230" v-model="left" side="left" bordered>
    <Meniu :rol="rolUtilizator" :logat="userAutentificat"/>
      
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

      <q-footer elevated class="bg-grey-8 text-white">
        <q-toolbar>
          <q-toolbar-title>Din pasiune de: Narcis Brindusescu </q-toolbar-title>
        </q-toolbar>     
      </q-footer>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'
import Meniu from '../components/Meniu'

export default {
  name: 'MyLayout',
  components:{
    'Meniu':Meniu
  },
  data () {
    return {
      left: this.$q.platform.is.desktop,
      group: 'op1',
      gestiune:{id:0,denumire:''},
      options: [
        {
          label: 'GEstiunea 1',
          value: 'op1'
        },
        {
          label: 'GEstiunea 2',
          value: 'op2'
        },
        {
          label: 'GEstiunea 3',
          value: 'op3'
        }
      ]
    }
  },
  created(){
    console.log('BIFA app a fost creata la '+process.env.host)
  },
  computed:{
    userAutentificat(){
      return this.$store.getters.user !== null && this.$store.getters.user !== undefined
     //return false;
    },
    numeUtilizator(){
      return this.$store.getters.user
    },
    rolUtilizator(){
       return this.$store.getters.rol
     //return 'admin'
    },
    gestiuneaCurenta(){
       return this.gestiune.denumire
    },
    gestiuni(){
      if(this.$store.getters.gestiuni.length>0) {
        this.group=this.$store.getters.gestiuni[0].id
        this.gestiune = {id:this.$store.getters.gestiuni[0].id,denumire:this.$store.getters.gestiuni[0].denumire}
        this.$store.dispatch('schimbaGestiuneaCurenta',{id:this.$store.getters.gestiuni[0].id,denumire:this.$store.getters.gestiuni[0].denumire})
      //  this.$root.$emit('schimbgestiunea',this.$store.getters.gestiuni[0].id);
      }
       return this.$store.getters.gestiuni.map( item =>({

               label:item.denumire,
               value:item.id
       }))
      /*return [
        {
          label: 'GEstiunea 1',
          value: 'op1'
        },
        {
          label: 'GEstiunea 2',
          value: 'op2'
        },
        {
          label: 'GEstiunea 3',
          value: 'op3'
        }
      ]*/
    }
  },
  methods: {
    openURL,
    doLogin(){
     this.$router.push('/login');
    },
    doLogout(){
       this.$store.dispatch('schimbaGestiuneaCurenta',{id:0,denumire:''})
      this.$store.dispatch('logout');
    },
    inchideUser(){
         this.$root.$emit('schimbgestiunea',this.group);
    },
    actUser(p){
      console.log('actionez user',this.group,this.gestiuni);
      var that=this;
      this.gestiuni.map(item =>{
        if(item.value==that.group) {
          that.gestiune={id:item.value,denumire:item.label}
          
          }
      })
       this.$store.dispatch('schimbaGestiuneaCurenta',this.gestiune)
       
  
    }

  }
}
</script>

<style>
</style>