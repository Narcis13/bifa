<template>
<q-card style="width: 480px; max-width: 70vw;">
                     <q-card-section>
                          <div class="text-h6">Pozitie noua PAAP</div>
                       </q-card-section>

                        <q-card-section class="q-pt-none q-pa-md ">

                            <div class="row q-gutter-md">

                                <div class="col">
                                       <q-input filled v-model="deladata" mask="date" :rules="['date']">
                                        <template v-slot:append>
                                            <q-icon name="event" class="cursor-pointer">
                                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                                <q-date v-model="deladata">
                                                <div class="row items-center justify-end">
                                                    <q-btn v-close-popup label="Inchide" color="primary" flat />
                                                </div>
                                                </q-date>
                                            </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                        </q-input>
                                </div>

                                <div class="col">
                                      <q-input filled v-model="ladata" mask="date" :rules="['date']">
                                        <template v-slot:append>
                                            <q-icon name="event" class="cursor-pointer">
                                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                                <q-date v-model="ladata">
                                                <div class="row items-center justify-end">
                                                    <q-btn v-close-popup label="Inchide" color="primary" flat />
                                                </div>
                                                </q-date>
                                            </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                        </q-input>

                                </div>

                            </div>
                        </q-card-section>
                        <q-card-actions align="right" class="bg-white text-teal">
                          <q-btn flat label="Abandon" v-close-popup />
                          <q-space />
                          <q-btn :disable="!dateValide" flat label="OK" @click="inchide"  />
                        </q-card-actions>
</q-card>
</template>

<script>
import { defineComponent,ref,computed } from 'vue'
import { date } from 'quasar'
export default defineComponent({
    name:'DelaLa',
    setup (props, { emit }) {
       var azi = new Date(); 
       var firstDay =  
                    new Date(azi.getFullYear(), 0, 1); 
                      
       var lastDay =   azi; 
       let deladata=ref(date.formatDate(firstDay, 'YYYY/MM/DD'))
       let ladata=ref(date.formatDate(lastDay, 'YYYY/MM/DD'))

  

      
       
       let dateValide = computed(()=>{
            const diff = date.getDateDiff(ladata.value, deladata.value, 'days')
            return diff>0
       })

        return {
            deladata,
            ladata,
            dateValide,
            inchide(){
               emit('interval-selectat',{deladata:deladata.value,ladata:ladata.value})
            }
        }
    }
})
</script>

<style scoped>

</style>