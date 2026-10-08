<template>
     <q-card style="width: 640px; max-width: 80vw;">
                        <q-card-section>
                          <div class="text-h6">Pozitie noua PAAP</div>
                        </q-card-section>

                        <q-card-section class="q-pt-none q-pa-md ">

                         <div class="row q-gutter-md">

                            <div class="col">
                                <q-input v-model="pozitie.obiect_achizitie"  label="Obiect achizitie" autogrow outlined  />
                            </div>

                            <div class="col">
                                <cod-cpv @selectie-coloana="coloanaSelectata" />

                            </div>

                        </div>

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                 <q-input v-model.number="pozitie.cantitate" type="number" outlined  label="Cantitate"  />
                            </div>

                            <div class="col">
                                <q-input v-model.number="pozitie.valoare" type="number" outlined  label="Valoare"  />
                            </div>

                        </div>

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                <proceduri @selectie-coloana="coloanaSelectata" />
                            </div>

                            <div class="col">
                                <q-input v-model="pozitie.responsabil" outlined  label="Responsabil"  />
                            </div>

                        </div>

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                <articole-bugetare @selectie-coloana="coloanaSelectata" />
                            </div>

                            <div class="col">
                                <compartimente v-show="DeLaAchizitii" @selectie-coloana="coloanaSelectata" />
                            </div>

                        </div>

                        </q-card-section>

                        <q-card-actions align="right" class="bg-white text-teal">
                          <q-btn flat label="Abandon" v-close-popup />
                          <q-space />
                          <q-btn flat label="ADAUGA" :disable="!ToateCompletate" @click="adauga"  />
                        </q-card-actions>
     </q-card>
</template>
<script>
import axios from 'axios'
import PaapCodCPV from '../components/paap/PaapCodCPV'
import PaapProceduri from '../components/paap/PaapProceduri'
import PaapArticolBugetar from '../components/paap/PaapArticolBugetar'
import PaapCompartimente from '../components/paap/PaapCompartimente'
export default {
    name:'PozitiePAAPAdd',
    props:['anplan'],
    components:{
       'cod-cpv':PaapCodCPV,
       'proceduri':PaapProceduri,
       'articole-bugetare':PaapArticolBugetar,
       'compartimente':PaapCompartimente
    },
    data: function () {
        return {
           pozitie:{
               obiect_achizitie:'',
               cantitate:0,
               valoare:0,
               responsabil:'',
               id_cod_cpv:0,
               id_procedura:0,
               id_compartiment:this.$store.getters.idcompartimentakyuserlogat,
               artbug:'',
               anplan:parseInt(this.anplan)
           }
        }
    },
    created(){
      console.log('Componentul PozitiePAAPAdd a fost creat !',this.anplan)
    },
    computed:{
       DeLaAchizitii(){
           return this.$store.getters.akyroluserlogat==="Achizitii"
       } ,
       ToateCompletate(){
           return this.pozitie.obiect_achizitie!==''&&this.pozitie.responsabil!==''&&this.pozitie.artbug!==''&&this.pozitie.id_cod_cpv>0&&this.pozitie.id_procedura>0&&this.pozitie.id_compartiment>0
       }
    },
    methods:{
        coloanaSelectata(v){
           console.log('Am selectat',v)
           this.pozitie[v.cimp]=v.valoare.value;
        },
        adauga(){
          console.log('Adaug pozitie',this.pozitie)  
          const token=this.$store.getters.token;
          var that = this;
          axios.post(process.env.host+'paap/pozitienoua',this.pozitie,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                    res => {
                      console.log('raspuns insert pozitie noua',res);
                      this.$emit('pozitie-adaugata',{})
                        this.$q.notify({
                        message:`Pozitie  adaugata cu succes!`,
                        timeout:1500,
                        position:'top',
                        color:'positive'
                     });

                     // de insearat si in date....
                     console.log(" this.$emit('pozitie-adaugata',{})")
                      
                
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
            });
                

        },
        urmatorul(el){
         this.$refs[el].focus();
        }
    }
}

</script>
<style  scoped>

  
</style>