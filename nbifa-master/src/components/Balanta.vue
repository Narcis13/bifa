<template>
    <q-table
      dense
      separator="cell"
      title="Balanta analitica de gestiune"
      :data="setdate"
      :filter="filter"
      :columns="columns"
      :pagination.sync="pagination"
      row-key="id">

                 <template v-slot:top>

                          <q-btn class="on-right" icon="print" flat dense color="green"  label="Print" @click="raportPrintat" />
                          <q-btn class="on-right" icon="print" flat dense color="blue"  label="Lista inventariere" @click="raportLIPrintat" />
                          <q-space />
                          <q-input  dense debounce="300" color="primary" v-model="filter">
                            <template v-slot:append>
                              <q-icon name="search" />
                            </template>
                          </q-input>
                </template>
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td class="text-bold" style="text-align: right;" colspan="100%">
                            Total valoare stoc final: {{total}} lei 
                          </q-td>
                        </q-tr>
                     </template>
    </q-table>
</template>

<script>
import axios from 'axios';
export default {
     name:'BalantaAnalitica',
     props:['setdate','total','parametrii'],
 data () {
    return {
      filter:'',
      pagination: {

                page: 1,
                rowsPerPage: 12
                // rowsNumber: xx if getting data from a server
             },
      columns: [
            { name: 'nrcrt', align: 'center', label: 'Nr. crt.', field: 'nrcrt' },
            { name: 'id', label: 'ID', field: 'id_reper',align: 'left' },
            { name: 'denumire', align: 'left', label: 'Denumire', field: 'denumire' },
            { name: 'um', align: 'center', label: 'UM', field: 'um' },
            { name: 'si', align: 'right', label: 'Stoc initial', field: 'stocinitial' },
            { name: 'int', align: 'right', label: 'Intrari', field: 'ti' },
            { name: 'ies', align: 'right', label: 'Iesiri', field: 'te' },
            { name: 'sf', align: 'right', label: 'Stoc final', field: 'stocfinal' },
            { name: 'vi', align: 'right', label: 'Valoare initiala', field: 'valoarestocinitial' },
            { name: 'debit', align: 'right', label: 'Debit', field: 'vi' },
            { name: 'credit', align: 'right', label: 'Credit', field: 've' },
            { name: 'vf', align: 'right', label: 'Valoare finala', field: 'valoarestoc' }

      ]
    }
 },
 methods:{
   raportLIPrintat(){
     console.log('PRINT LISTA  INV!')

             const token=this.$store.getters.token;
          var that=this;
          axios.post(process.env.host+'balante/rapli',this.parametrii,{responseType:'blob',headers:{"Authorization" : `Bearer ${token}`}}).then(
             res => {
                  const file = new Blob([res.data], {
                            type: "text/html"
                          });

                // saveAs(file,'pdfNou.pdf');
                let newWindow = window.open('/','rapli')
                newWindow.onload = () => {
                        newWindow.location = URL.createObjectURL(file);
                        
                      };
                newWindow.document.title="Lista inventariere"     
              }
           ).catch(err=>{
                 //  console.log('Eroare.............',err.response.data.message)
                    this.$q.notify({
                        color: 'negative',
                        timeout:1500,
                        position:'top',
                        icon: 'delete',
                        message: `ATENTIE! `
                     })
             })
   },
   raportPrintat(){
     //
               const token=this.$store.getters.token;
          var that=this;
          axios.post(process.env.host+'balante/rapanalitica',this.parametrii,{responseType:'blob',headers:{"Authorization" : `Bearer ${token}`}}).then(
             res => {
                  const file = new Blob([res.data], {
                            type: "text/html"
                          });

                // saveAs(file,'pdfNou.pdf');
                let newWindow = window.open('/','balantaanalitica')
                newWindow.onload = () => {
                        newWindow.location = URL.createObjectURL(file);
                        
                      };
                newWindow.document.title="Balanta analitica"     
              }
           ).catch(err=>{
                 //  console.log('Eroare.............',err.response.data.message)
                    this.$q.notify({
                        color: 'negative',
                        timeout:1500,
                        position:'top',
                        icon: 'delete',
                        message: `ATENTIE! `
                     })
             })
   }
 }
}
</script>

