<template>
   <div>

        <div class="row q-pa-sm" style="min-width:600px;">
              <q-table
                  dense
                  separator="cell"
                  :data="repere"
                  :columns="columns"
                  :filter="filter"
                  selection="single"
                    :pagination.sync="pagination"
                  :selected.sync="selected"
                  no-data-label="Niciun reper!"
                  row-key="nrcrt"

                >
                      <template v-slot:top>
                          <q-btn v-show="selected.length==1" class="on-right" icon="low_priority" flat dense color="primary"  label="Modifica" @click="modRow" />
                          <q-btn v-show="selected.length==1" class="on-right" icon="delete_sweep" flat dense color="primary"  label="Sterge" @click="removeRow" />
                          <q-space />
                          <q-input  dense debounce="300" color="primary" v-model="filter">
                            <template v-slot:append>
                              <q-icon name="search" />
                            </template>
                          </q-input>
                      </template>
                      <template v-slot:bottom-row>
                        <q-tr>
                          <q-td style="text-align: right;" colspan="100%">
                            Total {{valoaretotala}} lei
                          </q-td>
                        </q-tr>
                     </template>
              </q-table>        
        </div>
         
   </div>
    
</template>
<script>
export default {
     name:'Repere',
     props:['repere'],
     data () {
        return {
          filter:'',
          listarepere:this.repere,
            selected: [],
        pagination: {

                page: 1,
                rowsPerPage: 10
                // rowsNumber: xx if getting data from a server
             },
          columns: [
            { name: 'nrcrt', align: 'center', label: 'Nr. crt.', field: 'nrcrt' },
            { name: 'categ', label: 'Categoria', field: 'categ',align: 'left',style: 'width: 180px', },
            {
              name: 'denumire_reper',
              required: true,
               style: 'width: 220px',
              label: 'Denumire reper',
              align: 'left',
              field: 'denumire_reper',
              format: val => `${val}`,
              sortable: true
            },
            { name: 'um', align: 'center', label: 'U/M', field: 'um', sortable: true },
           // { name: 'stare', align: 'center', label: 'Stare', field: 'stare', sortable: true },
            { name: 'cantitate', label: 'Cantitate', field: 'cantitate', sortable: true ,align: 'right'},
            { name: 'pret', label: 'Pret', field: 'pret',align: 'right',style: 'width: 100px', },
            { name: 'valoare', label: 'Valoare', field: 'valoare',align: 'right',style: 'width: 125px', }
            
          ]
 

        }
  } ,
  computed:{

        valoaretotala(){
          let total=0;
          this.repere.map(reper=>{
            total+=parseFloat(reper.valoare)
          })
          return total.toFixed(4);
        }
  } ,
  methods:{
    modRow(){
       //console.log('Reper selectat ',this.selected)
       this.$emit('mod-linie',this.selected[0]);
       this.selected=[];

    },
    removeRow(){
      var that=this;

      console.log('sterg reper',this.repere,this.selected)
                                           this.repere.some(function(item, index) {
                                            return ( that.repere[index]["nrcrt"] === that.selected[0]['nrcrt']) ? !!( that.repere.splice(index, 1)) : false;
                                           }); 
                                           this.repere.map((item,index)=>{
                                                item.nrcrt=index+1
                                           })
                                           this.selected=[];
    }
  }        
}
</script>
