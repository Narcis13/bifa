<template>
     <q-card  style="width: 1200px; height:800px;max-width: 80vw;max-height: 80vh;">
                      
                          
                     <div class="column">
                          <div class="row q-mt-md" style="height:90%;">
                            
                            <div class="col-5 q-pa-sm">
                                <q-table
                                
                                      class="my-sticky-virtscroll-table"
                                      :filter="filter"
                                      dense
                                      wrap-cells
                                      virtual-scroll
                                      :pagination.sync="pagination"
                                      :rows-per-page-options="[0]"
                                      :virtual-scroll-sticky-size-start="48"
                                      row-key="id"
                                      separator="cell"
                                      title="PAAP"
                                      :data="paap"
                                      :columns="coloane_paap"
                                      selection="single"
                                      @selection="pozPAAPSelectat"
                                        binary-state-sort
                                        ref="paaptable"
                                      :selected.sync="selected"
                                >
                                <template v-slot:top>
                                  <div class="text-h6">PAAP</div>
                                  <q-space />
                                      <q-input borderless dense debounce="300" color="primary" v-model="filter">
                                        <template v-slot:append>
                                          <q-icon name="search" />
                                        </template>
                                      </q-input>
                                </template>
                                </q-table>
                            </div>

                            <div id="drrr" class="col-7 q-pa-sm coloana-dreapta">

                              <div class="row ">
                                    <q-input class="q-mt-md" stack-label  label="Data achizitie" dense filled v-model="data_referat" mask="date" :rules="['date']">
                                        <template v-slot:append>
                                          <q-icon name="event" class="cursor-pointer">
                                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                              <q-date v-model="data_referat">
                                                <div class="row items-center justify-end">
                                                  <q-btn v-close-popup label="Inchide" color="primary" flat />
                                                </div>
                                              </q-date>
                                            </q-popup-proxy>
                                          </q-icon>
                                        </template>
                                  </q-input>

                                  <q-input class="q-ml-xl" style="width:300px;" dense stack-label filled v-model="obiect_achizitie" label="Obiect achizitie" />

                              </div>

                              <div class="q-mt-xs q-mb-xs q-pa-xs">
                                        <q-input
                                          v-model="justificare"
                                          label="Justificarea necesitatii"
                                          filled
                                          style="height:70px"
                                          type="textarea"
                                        />
                              </div>

                              <q-separator inset />

                              <div class="row">
                                    <div style="height:100px" class="drop col-6 shadow-1 q-pa-sm q-mt-md ">
                                          <div><span class="text-bold">Denumire reper: </span> {{linieRN.denumire}}</div>
                                          <div><span class="text-bold">Cod CPV: </span> {{linieRN.codcpv}} </div>
                                    </div>
                                    <div class="col-6 q-pa-sm q-mt-sm" >
                                        <q-input
                                          v-model="linieRN.detalii_tehnice"
                                          label="Detalii tehnice"
                                          filled
                                          style="height:100px"
                                          type="textarea"
                                        />
                                    </div>
                              </div>

                              <div class="row q-mt-sm justify-between">
                                    <q-input v-model.number="linieRN.cantitate" type="number" filled dense label="Cantitate" error-message="Cantitate invalida!"  :error="!cantitateValida"/>
                                    <q-input v-model.number="linieRN.pret" type="number" filled dense label="Pret" error-message="N/A!"  :error="false"/>
                                    <q-input class="q-mr-sm" readonly v-model.number="valoareLinieRN" type="number" filled dense label="Valoare" error-message="N/A!"  :error="false"/>
                              </div>

                              <div class="row justify-center q-mt-sm q-mb-md">
                                  <q-btn :disable="!informatiiComplete" @click="adaugLinieRN" flat label="Adauga!"   />
                              </div>

                              <q-separator inset />

                              <div class="q-pa-xs q-mt-sm">
                                <q-table
                                    :id="uuid"
                                    dense
                                    :data="liniiRN"
                                    :pagination.sync="pagination_repere"
                                    wrap-cells
                                    separator="cell"
                                    :columns="columns"
                                     selection="single"
                                     :selected.sync="repere_selectate"
                                     no-data-label="Niciun reper!"
                                    row-key="idpozPAAP"
                                  >
                                    <template v-slot:top>
                                        
                                        <q-btn v-show="repere_selectate.length==1" class="on-right" icon="delete_sweep" flat dense color="primary"  label="Sterge" @click="removeRow" />
                                        
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

                          </div>


                        <div class="row justify-center">
                          <q-btn flat label="Abandon" v-close-popup />
                         
                          <q-btn @click="salveaza" flat label="Salveaza!" :disable="!documentValid"  />
                        </div>
              </div>
                        
     </q-card>
</template>
<script>
import axios from 'axios'
import { date } from 'quasar'
import {
        uid
    } from 'quasar'
export default {
    name:'ReferatNecesitateAdd',
    props:['mod'],
    
    data: function () {
        return {
           data_referat: date.formatDate(new Date(), 'YYYY/MM/DD'),
           uuid:'',
          pagination_repere: {

                page: 1,
                rowsPerPage: 10
                // rowsNumber: xx if getting data from a server
          },
           obiect_achizitie:'',
           justificare:'Asigurarea derularii optime a activitatilor institutiei',
          cantitate_maxima:1,
           model:0,
           paap:[],
           liniiRN:[],
           linieRN:{
             idpozPAAP:0,
             denumire:'',
             codcpv:'',
            detalii_tehnice:'',
             cantitate:1,
             pret:0

           },
           selected:[],
           repere_selectate:[],
           filter:'',
           coloane_paap:[
             {
                name: 'id',
                label: '#',
                field: 'id'
              },
              {
                name: 'articol',
                required: true,
                label: 'Obiectul achizitiei',
                align: 'left',
                style: 'max-width: 300px',
                field: 'obiectachizitie_text',
                format: val => `${val}`,
                sortable: true
              },

              { name: 'cantitate', align:'right',label: 'Cantitate', field: 'cant_ramasa', sortable: true }
           ],
          pagination: {
             rowsPerPage: 0
          },
           columns: [
              {
                name: 'denumire',
                required: true,
                label: 'Denumire',
                align: 'left',
                field: 'denumire',
                sortable: true
              },
              { name: 'codcpv', align: 'center', label: 'CodCPV', field: 'codcpv', sortable: true },
              { name: 'detalii', label: 'Detalii', field: 'detalii_tehnice', sortable: true,align: 'left' },
              { name: 'cantitate', label: 'Cantitate', field: 'cantitate' ,align: 'right'},
              { name: 'pret', label: 'Pret', field: 'pret',align: 'right' },
              { name: 'valoare', label: 'Valoare', field: 'valoare',align: 'right'}

            ]

        }
    },
    created(){
      console.log('Componentul ReferatNecesitateAdd a fost creat !',this)
          this.uuid = uid();
          const token=this.$store.getters.akytoken;
          const rol = this.$store.getters.akyroluserlogat;
          const id_comp = this.$store.getters.idcompartimentakyuserlogat;
          let an=(new Date()).getFullYear().toString();
        console.log('PAAP Comp An',rol,id_comp);
          let idc = (rol==="Achizitii")? 0:id_comp;
          axios.get(process.env.host+'paap/paapsolduri/'+idc+'/'+an,{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la  paap cu solduri',res);
                this.paap=[];
                this.paap = [...res.data.paap[0]];
              }
            ).catch(err =>{})  
    },
    computed:{
      valoareLinieRN(){
        return this.linieRN.cantitate*this.linieRN.pret;
      },
      cantitateValida(){
         return this.linieRN.cantitate!==''&&this.linieRN.cantitate>0&&this.linieRN.cantitate<=this.cantitate_maxima
      },
      informatiiComplete(){
        return this.linieRN.detalii_tehnice.length>6&&this.linieRN.codcpv!=''&&this.linieRN.denumire!=''&&this.valoareLinieRN>0&&this.cantitateValida
      },
      documentValid(){
        return this.obiect_achizitie.length>5&&this.liniiRN.length>0
      },
      valoaretotala(){
          let total=0;
          this.liniiRN.map(linie=>{
            total+=linie.valoare;
          })
          return total.toFixed(2);
        }
    },
    mounted(){
  
    },
    methods:{
            pozPAAPSelectat(detalii){
              console.log('Am selectat din PAAP',detalii);
              this.linieRN.denumire=detalii.rows[0].obiectachizitie_text;
              this.linieRN.codcpv=detalii.rows[0].CodCPV;
              this.linieRN.idpozPAAP=detalii.rows[0].id;
              this.cantitate_maxima=detalii.rows[0].cant_ramasa;
            },
            removeRow(){
                   var that=this;
                        this.liniiRN.some(function(item, index) {
                                            return ( that.liniiRN[index]["idpozPAAP"] === that.repere_selectate[0]['idpozPAAP']) ? !!( that.liniiRN.splice(index, 1)) : false;
                                           }); 

                                           this.repere_selectate=[];
            },
            salveaza(){
              const token=this.$store.getters.akytoken;
              var that=this;
              let data = date.extractDate(this.data_referat, 'YYYY/MM/DD');
              let datacorecta=date.formatDate(data, 'YYYY-MM-DD');
              console.log('Data doc', datacorecta,this.$store.getters.idcompartimentakyuserlogat);  
                axios.post(process.env.host+'rn/antetnou',{
                      "data":datacorecta,
                      "obiect_achizitie":this.obiect_achizitie,
                      "valoare":this.valoaretotala,
                      "justificare":this.justificare,
                      "id_compartiment":this.$store.getters.idcompartimentakyuserlogat

                  },{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {
                         console.log('Raspuns de la antet nou',res.data)
                         axios.post(process.env.host+'rn/detaliinoi',{
                                tranzactii:that.liniiRN,
                                idAntet:res.data.id
                                  },{headers:{"Authorization" : `Bearer ${token}`}}).then(res =>{
                                              this.$q.notify({
                                                              message:`Referat necesitate adaugat cu succes!`,
                                                              timeout:1500,
                                                              position:'top',
                                                              color:'positive'
                                              })
                                              // curatenie dupa ce salvam RN-ul
                                              that.liniiRN=[];
                                              that.obiectachizitie_text="";
                                              console.log('ajung fix aici inainte de a emite event referat-nou')
                                              that.$emit("referat-nou", {nimic:'interesant'});

                                  }).catch(err=>{
                                    
                                  })
                        
                      }).catch(err=>{
                        console.log('Eroare.............',err)
                        this.$q.notify({
                              color: 'negative',
                              timeout:1500,
                              position:'top',
                              icon: 'delete',
                              message: `ATENTIE! `
                            })
                });

            },
            adaugLinieRN(){

            this.liniiRN.push({
                  idpozPAAP:this.linieRN.idpozPAAP,
                  denumire: this.linieRN.denumire,
                  codcpv:  this.linieRN.codcpv,
                  detalii_tehnice:this.linieRN.detalii_tehnice,
                  cantitate:this.linieRN.cantitate,
                  pret: this.linieRN.pret,
                  valoare:this.valoareLinieRN
              })

              this.resetLinieRN();
            },
            resetLinieRN(){
              this.cantitate_maxima=1;
              this.linieRN.denumire="";
              this.linieRN.codcpv="";
              this.linieRN.cantitate=1;
              this.linieRN.idpozPAAP=0;
              this.linieRN.pret=0;
              this.linieRN.detalii_tehnice="";
              this.selected=[];
            }

    }
}

</script>

<style lang="sass" scoped>
.coloana-dreapta 
  border-left: 1px solid grey


.my-sticky-virtscroll-table
  /* height or max-height is important */
  height: 720px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th /* bg color is important for th; just specify one */
    background-color: #fff

  thead tr th
    position: sticky
    z-index: 1
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
  thead tr:first-child th
    top: 0
</style>