<template>
<q-card style="width: 360px; max-width: 70vw;">
        <q-card-section>
             <div class="text-h6">Vizat pentru CFPP angajament</div>
         </q-card-section>
         <q-card-section>
                        <div class="text-subtitle">Angajamentul nr. {{care.nrdoc}} din {{care.dataang}}</div>
                        <div class="text-subtitle">Sursa finantare {{care.numecap}}</div>
                        <div class="text-subtitle2">Art. bug. {{care.artbug}}</div>
                        <div class="text-subtitle2">Detalii: {{care.detalii}}</div>
                        <div class="text-subtitle2">Suma: {{care.suma}} lei</div>
         </q-card-section>
<q-separator  inset />
<q-card-section>
    <div class="q-pa-md">
            <q-input
                v-model="cod"

                placeholder="Cod:"
                hint="Cod angajament CAB"
            >
                <template v-slot:append>
                <q-btn round color="green" icon="search" @click="cautCod"/>
                </template>
      </q-input>
    </div>

</q-card-section>
      

         <q-card-actions align="right" class="bg-white text-teal">
                          <q-btn flat label="Abandon" v-close-popup />
                          <q-space />
                          <q-btn :disable="!codValid" flat label="Vizat" @click="vizeaza"  />
         </q-card-actions>
</q-card>                      
</template>

<script >
import { defineComponent ,ref,computed,inject} from 'vue'
import axios from 'axios'
export default defineComponent({
    name:'VizaAngajament',
    props:['care'],
    setup (p, { emit }) {
        let cod=ref('')
         console.log('Componenta Vizat CFPP ',p.care)

        const global=inject('global');
        const token=global.state.user.token;

       let codValid = computed(()=>{
           return cod.value.length>5
       })

        return {
            cod,
        codValid,
        cautCod(){
            console.log('Caut cod...')
            
                  axios.get(process.env.host+`angajamente/codviza/${p.care.artbug}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

                  res => {
                  console.log('Raspuns la cod angajament... ',res.data.coduri[0][0].codang);
                  
                      cod.value=res.data.coduri[0][0].codang;
                  }
                  ).catch(err =>{})
 
        },
        vizeaza(){
            let date_viza={
                codang:cod.value,
                idAntet:p.care.idAntet,
                registru:{
                    userid:global.state.user.idutilizator,
                    nume:global.state.user.nume,
                    nrviza:0,
                    nrvizac:global.state.user.sigiliu,
                    dataviza:new Date(),
                    document:'Ang. bug. nr. '+p.care.nrdoc,
                    explicatii:p.care.detalii,
                    valoare:p.care.suma,
                    stare:'activ',
                    compartiment:p.care.compartiment
                }
            }


            console.log('Vizez!', p.care,date_viza)
                  axios.post(process.env.host+'angajamente/angvizat',date_viza,{headers:{"Authorization" : `Bearer ${token}`}}).then(res =>{

                           console.log('A venit raspuns de la vizat ',res.data)
                           emit('angajament-vizat',{nrviza:res.data.id})

                                }).catch(err=>{
                                                            
                                })
        }
        }
    }
})
</script>

<style scoped>

</style>