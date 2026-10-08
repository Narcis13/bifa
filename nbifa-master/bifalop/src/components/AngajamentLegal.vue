<template>
<q-card style="width: 800px; max-width: 70vw;">
        <q-bar>
          <q-btn dense flat  :icon="panelActiv=='unul'?'list':'arrow_back'" @click="schimbaPanelActiv">
            <q-tooltip>{{panelActiv=='unul'?'Toate angajamentele legale':'Inapoi'}}</q-tooltip>
          </q-btn>
          <div>Angajamente legale</div>

          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
      <q-tab-panels v-model="panelActiv" animated class="shadow-2 rounded-borders">
        <q-tab-panel name="unul">
          <div class="text-subtitle1">Ang. bugetar nr. {{angBugetar.nrdoc}} din {{angBugetar.dataang}} - {{angBugetar.detalii}}</div>
          <div class="text-subtitle2"> Categoria: {{angBugetar.categorie}} Art. bug. {{angBugetar.artbug}} <span class="text-right">Suma disponibila: {{angBugetar.suma}}</span></div>
           <div class="q-pa-sm q-gutter-md row">
              <q-select
                label="Furnizor"
                v-model="furnizor"
                use-input
                :options="furnizori"
                @filter="filterFn"
                hint="Min 2 caractere pentru a cauta..."
                style="width: 200px; padding-bottom: 16px"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>

                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">

                    <q-item-section>
                      <q-item-label v-html="scope.opt.label" />
                      <q-item-label caption>CUI: {{ scope.opt.cui }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

              </q-select>

              <q-input  v-model="nrcontract" label="Nr. contract" stack-label  />

              <q-input style="width: 140px; padding-bottom: 16px" label="Data contract" stack-label v-model="deladata" mask="date" :rules="['date']">
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

             <q-input v-model.number="valoare" type="number" label="Valoare" stack-label  />

          </div>
         <div class="row items-center justify-center">
                        <q-btn @click="angLegalNou" label="Adauga" color="primary" flat />
         </div>
        </q-tab-panel>

        <q-tab-panel name="toate">
            <div class="q-pa-md">
              <q-table
               
                dense
                :filter="filter"
                :pagination="initialPagination"
                :rows="state.angajamente"
                v-model:selected="selected"
                :columns="columns"
                row-key="id"
                selection="single"
              >

                  <template v-slot:top>

                      <div class="flex" style="min-width:200px;max-height:100px;">
  
                          <q-btn  class="q-ma-sm"  round color="red" :disable="selected.length==0" icon="delete_forever" @click="stergAngajament">
                              <q-tooltip class="bg-accent">Sterge</q-tooltip>
                          </q-btn>

                      </div>

                

                    <q-space />
                    <q-input outlined dense debounce="300" color="primary" v-model="filter">
                      <template v-slot:append>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                </template>
              </q-table>
            </div>
        </q-tab-panel>

      </q-tab-panels>

 
                       
</q-card>
</template>

<script>
import { defineComponent,ref,computed,inject ,reactive} from 'vue'
import { date } from 'quasar'
import axios from 'axios'
import { useQuasar } from 'quasar'

const  initialPagination = {
       // sortBy: 'desc',
       // descending: false,
        page: 1,
        rowsPerPage: 10

      }

const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field:'id',
    sortable: true
  },
  { name: 'nr', align: 'center', label: 'Nr. contr.', field: 'numar', sortable: true },
  { name: 'data', label: 'Data contr.', field: 'dindata', sortable: true },
  { name: 'valoare', label: 'Valoare', field: 'valoare' },
  { name: 'partener', label: 'Partener', field: 'numepartener' ,align:'left'},
  { name: 'scop', label: 'Scop', field: 'detalii' ,align:'left'}
]

const rows = [
  
]

const state = reactive(
  {
    angajamente : []  
  }
  )

let totiFurnizorii = [

]

export default defineComponent({
    name:'AngajamentLegal',
    props:['ang_bugetar'],
    setup (props, { emit }) {
        const global=inject('global');
        const token=global.state.user.token;
        const compartiment=global.state.user.compartiment;
        let idcompartiment=compartiment=='SUPERVIZARE'? 0:global.state.user.nume_logare;
        const $q = useQuasar()
        let azi=new Date()
        let deladata=ref(date.formatDate(azi, 'YYYY/MM/DD'))
        /**
         * 
        incarc furnizorii

         */

        axios.get(process.env.host+`furnizori/toti/${idcompartiment}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

                    res => {
                    console.log('Raspuns la toti furnizorii',res.data);
                    totiFurnizorii=[];
                    res.data.furnizori.map(f=>{
                       totiFurnizorii.push({label:f.denumire,value:f.id,cui:f.codfiscal})
                    })
                
                    }
                ).catch(err =>{})

         function toateAngajamenteleLegale(){
                axios.get(process.env.host+`furnizori/toateangajamentele/${idcompartiment}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

                    res => {
                    console.log('Raspuns la toate angajamentele',res.data);
                     state.angajamente=[]
                    res.data.angajamente.map(a=>{
                      a.dindata=date.formatDate(a.dindata, 'DD/MM/YYYY')
                        state.angajamente.push(a)
                    })
                
                    }
                ).catch(err =>{})
        }

        toateAngajamenteleLegale();

       console.log('Prop ang legal',props.ang_bugetar)
       let furnizori=ref([])
       let  selected=ref([])
       let furnizor = ref(null)
       let nrcontract=ref("")
       let valoare=ref(0)
       let panelActiv = ref('unul')
        return {
            state,
            panelActiv,
            furnizori,
            furnizor,
            nrcontract,
            valoare,
            deladata,
            columns,
            rows,
            selected,
            filter:ref(''),
            initialPagination,
            angBugetar:props.ang_bugetar,
            filterFn (val, update, abort) {
                if (val.length < 2) {
                  abort()
                  return
                }

                update(() => {
                  const needle = val.toLowerCase()
                  console.log('toti furnizorii',totiFurnizorii)
                  furnizori.value = totiFurnizorii.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
                })
          },
            schimbaPanelActiv(){
               if(panelActiv.value=='unul'){
                    panelActiv.value='toate'

               }
                 
               else
                  panelActiv.value='unul'

            },
            stergAngajament(){
                 console.log(selected.value)
                 axios.post(process.env.host+'furnizori/stergangajament/'+selected.value[0].id,{
                        
                    },{headers:{"Authorization" : `Bearer ${token}`}}).then(res =>{
                       
                                     toateAngajamenteleLegale()
                      $q.notify({
                              message:"Angajament legal sters!",
                              timeout:2000,
                              position:'top',
                              color:'positive'})
                       
                    })
                    .catch(err=>{
                                    
                    })
            },
            angLegalNou(){
              console.log('Angajament legal nou!',props.ang_bugetar,deladata.value)
                   let anglegal={idAng:props.ang_bugetar.idAntet,numepartener:furnizor.value.label,furnizor:furnizor.value.value,nrcontract:nrcontract.value,valoare:valoare.value,datacontract:deladata.value,addedby:global.state.user.nume_logare};
                   axios.post(process.env.host+'furnizori/anglegalnou',anglegal,{headers:{"Authorization" : `Bearer ${token}`}}).then(res =>{

                      //  console.log('A sosit rasunsul de la furnizor nou...')
                        emit('anglegal-adaugat',{id:res.data.id})

                    })
                    .catch(err=>{
                                    
                    })
            }
        }
    }
})
</script>

<style scoped>

</style>