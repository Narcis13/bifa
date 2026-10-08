<template>
    <q-page padding class="row items-start">
          <q-card v-for="g in gestiuni" inline style="width: 200px" class="bg-secondary text-white q-ma-sm" :key="g.denumire">
            <q-card-section>
                <div class="text-h6">{{g.denumire}}</div>
                <div class="text-subtitle2">Utilizator implicit: {{g.username}}</div>
            </q-card-section>

            <q-card-section>
               Gestionar: {{ g.gestionar }}
            </q-card-section>

            <q-separator dark />

            <q-card-actions>
                <q-btn flat :key="g.denumire" @click="vreauDetalii(g.denumire)">Detalii</q-btn>
                <q-btn flat @click="stergGestiune(g.denumire)">Sterge</q-btn>
            </q-card-actions>

          </q-card>
          <q-btn
            round
            color="primary"
            @click="showDialog"
            class="fixed"
            icon="add"
            style="right: 48px; bottom: 64px"
          />
              <q-dialog v-model="confirm" persistent>
                <q-card>
                  <q-card-section class="row items-center">
                    <q-avatar icon="signal_wifi_off" color="primary" text-color="white" />
                    <span class="q-ml-sm">Sunteti sigur ca doriti stergerea?</span>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn flat label="Abandon" color="primary" v-close-popup />
                    <q-btn flat label="Sterge" color="primary" @click="sterg" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>

          <q-dialog v-model="opened"  transition-show="jump-down" transition-hide="jump-up">
              <q-card class="q-pa-md" style="width: 400px; max-width: 90vw;padding:10">

                     <q-input v-model="numegestiune" label="Denumire" :rules="[val => !!val || 'Cimp obligatoriu!']" >
                       <q-tooltip>Cimp obligatoriu!</q-tooltip>
                     </q-input>

                    <q-select v-model="cUser" :options="listaUtilizatori" @input="userSelectat" label="Utilizator implicit" />
                    <q-input v-model="gestionar" label="Gestionar"  />
                     <div class="q-pa-sm">
                               <q-tabs
                                  v-model="selectedTab"
                                  dense
                                  class="text-grey"
                                  active-color="primary"
                                  indicator-color="primary"
                                  align="justify"
                                  narrow-indicator
                                >
                                  <q-tab  name="receptie"  icon="mail" label="Comisia receptie" />
                                  <q-tab name="inventar"  icon="mail" label="Comisia inventariere" />
                                </q-tabs>

                                <q-separator />
                       
                                <q-tab-panels v-model="selectedTab" animated>
                                  <q-tab-panel name="receptie">
                                      <q-input v-model="r_p"  label="Presedinte" />
                                      <q-input v-model="r_m1"  label="Membru 1" />
                                      <q-input v-model="r_m2"  label="Membru 2" />
                                      <q-input v-model="r_m3"  label="Membru 3" />
                                  </q-tab-panel>
                                  <q-tab-panel name="inventar">
                                      <q-input v-model="i_p"  label="Presedinte" />
                                      <q-input v-model="i_m1"  label="Membru 1" />
                                      <q-input v-model="i_m2"  label="Membru 2" />
                                      <q-input v-model="i_m3"  label="Membru 3" />
                                  </q-tab-panel>
                                </q-tab-panels>
                          
                
                     </div>
                     <div class="row justify-center">
                      <q-btn
                        color="primary"
                        icon="contact_mail"
                        dense
                        @click="gestiuneNoua"
                        :label="numeButonDialog"
                      />

                      <q-btn
                        color="primary"
                        class="q-ml-md"
                        icon="code"
                        dense
                        @click="reset"
                        label="Reset"
                      />

                  </div>
              </q-card>
          </q-dialog>
    </q-page>
</template>
<script>
import axios from 'axios'
//import { uid, filter } from 'quasar'

function parseUsers () {
  return listaUtilizatori.map(user => {
    return {
      label: user.username,
      id:user.id,
      value: user.username
    }
  })
}

export default {
  data () {
    return {
      confirm: false,
      idGestiuneCurenta:0,
      modificare:false,
      selectedTab:'receptie',
      cUser:'',
      numegestiune:'',
      gestionar:'',
      terms:'',
      r_p:'',
      r_m1:'',
      r_m2:'',
      r_m3:'',
      i_p:'',
      i_m1:'',
      i_m2:'',
      i_m3:'',
      userId:0,
      gestiuni:[],
      listaUtilizatori:[],
      opened:false,
      lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
    }
  },
  created(){
     console.log('Gestiune curenta',this.$store.getters.gestiuneCurenta)
     const token=this.$store.getters.token;

      axios.get(process.env.host+'gest/toategestiunile',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toate gestiunile',this.gestiuni);
           this.gestiuni=[...res.data.gestiuni]
        }
      ).catch(err =>{})

     axios.get(process.env.host+'user/allusers',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
          
           this.listaUtilizatori=res.data.utilizatori.map(user => {
                                                            return {
                                                              label: user.username,
                                                              id:user.id,
                                                              value: user.id
                                                            }
                                                          })
        }
      ).catch(err =>{})
  },
  computed:{
       numeButonDialog(){
         return this.modificare ? 'MODIFICA' : 'ADAUGA'
       }
  },
  methods:{
    showDialog(){
       this.reset();
       this.opened=true;
    },
    sterg(id){
        console.log('sterg efectiv id ',this.idGestiuneCurenta);
        const token=this.$store.getters.token;
        var that = this;
              axios.delete(process.env.host+`gest/${this.idGestiuneCurenta}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

                res => {
                        this.$q.notify({
                            color: 'secondary',
                            icon: 'delete',
                            message: `Gestiune stearsa!`
                          })
                  that.gestiuni.some(function(item, index) {
                      return ( that.gestiuni[index]["id"] === that.idGestiuneCurenta) ? !!( that.gestiuni.splice(index, 1)) : false;
                  });       
                  //this.tableData=[...res.data.utilizatori]
                }
              ).catch(err =>{})
    },
    stergGestiune(t){
       // console.log('detalii',t);
       //this.modificare=true;
        this.gestiuni.map(item =>{
          if (item.denumire==t){
            this.idGestiuneCurenta = item.id
            this.confirm=true;
            //  console.log('sterg gestiunea '+item.id,t);
          }
        })
        
    },
    vreauDetalii(t){
       // console.log('detalii',t);
       this.modificare=true;
        this.gestiuni.map(item =>{
          if (item.denumire==t){
            this.idGestiuneCurenta=item.id;
            this.numegestiune=item.denumire;
            this.gestionar = item.gestionar;
            this.r_p=item.r_presedinte;
            this.r_m1=item.r_membru1;
            this.r_m2=item.r_membru2;
            this.r_m3=item.r_membru3;
            this.i_p=item.i_presedinte;
            this.i_m1=item.i_membru1;
            this.i_m2=item.i_membru2;
            this.i_m3=item.i_membru3;
            this.cUser=item.username;
            this.userId=item.userid;
          }
        })
         this.opened=true;
    },
    userSelectat(value){
           console.log(value.value)
           this.userId=value.value
    },
    gestiuneNoua(){
     // alert('Gestiune Noua')

      const numegestiune=this.numegestiune;
      const token=this.$store.getters.token;
      var that = this;
      if(this.modificare){
           console.log('e de fapt modificare',this.idGestiuneCurenta);
           this.modificare=false;
                 axios.patch(process.env.host+`gest/${this.idGestiuneCurenta}`,{
                  "denumire":this.numegestiune,
                  "userid":this.userId,
                  "gestionar":this.gestionar,
                  "r_presedinte":this.r_p,
                  "r_membru1":this.r_m1,
                  "r_membru2":this.r_m2,
                  "r_membru3":this.r_m3,
                  "i_presedinte":this.i_p,
                  "i_membru1":this.i_m1,
                  "i_membru2":this.i_m2,
                  "i_membru3":this.i_m3,
                  "stare":"activ"
                },{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {
                        that.opened=false;

                        that.gestiuni.map(item=>{

                              if(item.id==that.idGestiuneCurenta){
                                  item.denumire=that.numegestiune;
                                  item.gestionar=that.gestionar;
                                  item.userid=that.userId;
                                  item.username=that.cUser.label;
                                  item.r_presedinte=that.r_p;
                                  item.r_memebri1=that.r_m1;
                                  item.r_membru2=that.r_m2;
                                  item.r_membru3=that.r_m3;
                                  item.i_presedinte=that.i_p;
                                  item.i_memebru1=that.i_m1;
                                  item.i_memebru2=that.i_m2;
                                  item.i_memebru3=that.i_m3;
                              }
                        })

                          this.$q.notify({
                          message:`Gestiunea ${numegestiune} a fost actualizata cu succes!`,
                          timeout:1500,
                          position:'top',
                          color:'positive'
                })
                })
                
             }
       else {
      axios.post(process.env.host+'gest/gestiunenoua',{
         "denumire":this.numegestiune,
         "userid":this.userId,
         "gestionar":this.gestionar,
         "r_presedinte":this.r_p,
         "r_membru1":this.r_m1,
         "r_membru2":this.r_m2,
         "r_membru3":this.r_m3,
         "i_presedinte":this.i_p,
         "i_membru1":this.i_m1,
         "i_membru2":this.i_m2,
         "i_membru3":this.i_m3,
         "stare":"activ"
      },{headers:{"Authorization" : `Bearer ${token}`}}).then(
            res => {
                 this.$q.notify({
                 message:`Gestiunea ${numegestiune} a fost adaugata cu succes!`,
                 timeout:1500,
                 position:'top',
                 color:'positive'
      });
        that.gestiuni.unshift({
          "id":res.data.id,
          "denumire":that.numegestiune,
          "userid":that.userId,
          "username":that.cUser.label,
          "gestionar":that.gestionar,
          "r_presedinte":that.r_p,
          "r_membru1":that.r_m1,
          "r_membru2":that.r_m2,
          "r_membru3":that.r_m3,
          "i_presedinte":that.i_p,
          "i_membru1":that.i_m1,
          "i_membru2":that.i_m2,
          "i_membru3":that.i_m3,
        });

          that.numegestiune='';
          that.gestionar='';
          that.userId=0;
          that.r_p='';
          that.r_m1='';
          that.r_m2='';
          that.r_m3='';
          that.i_p='';
          that.i_m1='';
          that.i_m2='';
          that.i_m3='';

      that.opened=false;
            }
     ).catch(err=>{
       console.log('Eroare.............',err.response.data.message)
       this.$q.notify({
                    color: 'negative',
                    timeout:1500,
                    position:'top',
                    icon: 'delete',
                    message: `ATENTIE! ${err.response.data.message}`
                  })
     });}
    },
    selected (item) {
    //  this.$q.notify(`id selectat "${item.id}"`)
         this.userId=item.id;
    },
     reset(){
            console.log('RESET');
            this.modificare=false;
            this.selectedTab = 'receptie'
            this.numegestiune='';
            this.userId=0;
            this.cUser='';
            this.r_p='';
            this.r_m1='';
            this.r_m2='';
            this.r_m3='';
            this.i_p='';
            this.i_m1='';
            this.i_m2='';
            this.i_m3='';
            this.terms='';
    },
    search(terms, done){
      //console.log('terms ',terms, this.listaUtilizatori,filter(terms, {field: 'username', list: this.listaUtilizatori}));
   
        done(filter(terms, {field: 'value', list: this.listaUtilizatori}))
       
    }
  }
}
</script>
<style>
 
</style>

