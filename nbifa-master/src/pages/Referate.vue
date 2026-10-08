<template>
<q-page padding>
     <div class="row justify-center q-mt-md">
     
         <q-table
                :data="rows"
                :columns="columns"
                row-key="id"
                :pagination.sync="pagination"
                hide-pagination
                selection="single"
                :selected.sync="selected"
        >
                    <template v-slot:top>
                          
                          <div class="text-body1 text-weight-bold">Referate de necesitate</div>
                          
                          <q-space />
                          <q-btn v-show="selected.length>0" class="on-right" icon="print" flat dense color="green"  label="PRINT" @click="printRN" />
                    </template>

        <template v-slot:body="props">
                <q-tr :props="props">
                <q-td auto-width>
                     <q-checkbox  v-model="props.selected" ></q-checkbox>
                </q-td>
                <q-td key="id" :props="props">
                    {{ props.row.id }}
                </q-td>
                <q-td key="data" :props="props">
                 
                    {{ props.row.data }}
                  
                </q-td>
                <q-td key="obiect_achizitie" :props="props">
                   
                    {{ props.row.obiect_achizitie }}
                    
                </q-td>
                <q-td key="valoare" :props="props">
                   
                    {{ props.row.valoare }}
                 
                </q-td>
                <q-td key="compartiment" :props="props">
                  
                    {{ props.row.compartiment }}
                   
                </q-td>
                <q-td key="stare" :props="props">
                    <q-badge color="purple">
                    {{ props.row.stare }}
                    </q-badge>
                </q-td>
                <q-td key="data_modificare" :props="props">
                  
                    {{ props.row.data_modificare }}
                  
                </q-td>

                </q-tr>
      </template>
        </q-table>
     </div>

        <div class="row justify-center q-mt-md">
            <q-pagination
                v-model="pagination.page"
                color="grey-8"
                :max="pagesNumber"
                size="sm"
            />
        </div>

    <q-dialog v-model="adaug_referat" persistent transition-show="scale" transition-hide="scale">
        <ref-necesitate-add  @referat-nou="toateReferatele"/>
    </q-dialog>


    <q-page-sticky  position="bottom-right" :offset="[24, 24]">
            <q-btn fab   icon="add" color="accent"  @click="adaug_referat=true" />
    </q-page-sticky>
    <q-page-sticky  position="bottom-left" :offset="[24, 24]">
            <q-btn fab   icon="settings_backup_restore" color="accent"  @click="$router.push('/dashboard')" />
    </q-page-sticky>
</q-page>
</template>


<script>
import { date } from 'quasar'
import axios from 'axios'
import ReferatNecesitateAdd from '../components/ReferatNecesitateAdd'
export default {
    components:{
        'ref-necesitate-add':ReferatNecesitateAdd
    },
    data(){
        return {
            adaug_referat:false,
            pagination: {

                page: 1,
                rowsPerPage: 10
                // rowsNumber: xx if getting data from a server
            },
            selected:[],
            columns: [
                {
                name: 'id',
              
                label: 'ID',
                align: 'left',
                field:'id',
                sortable: true
                },
                { name: 'data', align: 'center', label: 'Data', field: 'data', sortable: true },
                { name: 'obiect_achizitie', align: 'left',label: 'Obiect achizitie', field: 'obiect_achizitie', sortable: true },
                { name: 'valoare', label: 'Valoare', field: 'valoare',align:'right' },
                { name: 'compartiment', label: 'Compartiment', field: 'compartiment',align:'left' },
                 { name: 'stare', label: 'Stare', field: 'stare',align:'left' },
                  { name: 'data_modificare', label: 'Data modificare', field: 'data_modificare',align:'left' }
            ],

            rows: []
        }
    },
    computed: {
        pagesNumber () {
            return Math.ceil(this.rows.length / this.pagination.rowsPerPage)
        }
  },
  created(){
      console.log('Pagina principala Referate a fost creata!')
      this.toateReferatele();
  } ,
  methods:{
      printRN(){
          console.log('Urmeaza sa printez RN',this.selected[0])
           window.open(process.env.host+'rapoarte/unreferat/'+this.selected[0].id,'_blank');
      },
      toateReferatele(){
          console.log('toate referatele...')
          this.adaug_referat=false;

          const token=this.$store.getters.akytoken;
          const rol = this.$store.getters.akyroluserlogat;
          const id_comp = this.$store.getters.idcompartimentakyuserlogat;
   
          let idc = (rol==="Achizitii")? 0:id_comp;
          this.rows=[];
          axios.get(process.env.host+'rn/toatereferatele/'+idc,{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Raspuns la toate referatele',res.data);
                //this.paap = [...res.data.proceduri];
                res.data.referate.map(p=>{
                    this.rows.push({
                        id:p.id,
                        data:date.formatDate(p.data, 'DD/MM/YYYY'),
                        obiect_achizitie:p.obiect_achizitie,
                        valoare:p.valoare,
                        data_modificare:date.formatDate(p.data, 'DD/MM/YYYY H:mm'),
                        compartiment:p.denumire,
                        stare:p.stare

                    })
                })
              }
            ).catch(err =>{})  
      }
  }
}
</script>