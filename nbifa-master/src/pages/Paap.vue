<template>
<q-page padding>
    <div class="flex flex-center ">
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
        :columns="columns"
        selection="multiple"
          binary-state-sort
          ref="paaptable"
        :selected.sync="selected"
        >

        <template v-slot:top>
            <div class="q-pa-sm text-h4">PAAP</div>
            <div class="q-gutter-sm q-ml-xl">
                <q-radio @input="schimbaAn" left-label v-model="anselectat" :val="anante" :label="anante" />
                <q-radio @input="schimbaAn" left-label v-model="anselectat" :val="ancur" :label="ancur" />
                <q-radio @input="schimbaAn" left-label v-model="anselectat" :val="anpost" :label="anpost" />
     
            </div>
            <q-btn v-show="filtruAplicat" class="q-ml-xl"  outline rounded color="primary" label="nefiltrat" @click="stergFiltru" />
            <q-btn-dropdown v-show="!filtruAplicat" @hide="resetFiltre" icon="filter_list" class="q-ml-xl" outline rounded color="primary"  label="Filtreaza" >
              
              <div class="q-pa-md" style="width:600px;">

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                   <q-toggle v-model="toateArticolele" color="green" :label="toateArticolele?'Toate articolele bugetare':'Numai articolul bugetar'"    />
                            </div>

                            <div v-show="!toateArticolele" class="col">
                                  <paap-artbug  @selectie-coloana="alegFiltruArtBug" />
                            </div>

                        </div>

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                   <q-toggle v-model="toateValorile" color="green" :label="toateValorile?'Indiferent de valoare':'Interval valoare'"    />
                            </div>

                            <div v-show="!toateValorile" class="col">
                                      <q-range style="max-width:270px;" v-model="rangeValori" :min="0"  :max="250000" :step="1000" label color="purple" />
                            </div>

                        </div>

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                   <q-toggle v-model="toateProcedurile" color="green" :label="toateProcedurile?'Toate procedurile':'Numai procedura'"    />
                            </div>

                            <div v-show="!toateProcedurile" class="col">
                                  <paap-proceduri  @selectie-coloana="alegFiltruProceduri" />
                            </div>

                        </div> 

                        <div v-if="DeLaAchizitii" class="row q-gutter-md q-mt-xs">

                            <div class="col">
                                   <q-toggle v-model="toateCompartimentele" color="green" :label="toateCompartimentele?'Toate compartimentele':'Numai compartimentul'"    />
                            </div>

                            <div v-show="!toateCompartimentele" class="col">
                                  <paap-compartimente  @selectie-coloana="alegFiltruCompartimente" />
                            </div>

                        </div>        

                        <div class="row q-gutter-md q-mt-xs">

                            <div class="flex justify-end col">
                                   <q-btn outline color="primary" label="reset" @click="resetFiltre" />
                            </div>

                            <div  class="col">
                                <q-btn outline color="primary" label="Aplica!" @click="aplicFiltru" v-close-popup />
                            </div>

                        </div>   

              </div>

            </q-btn-dropdown>

            <q-btn-dropdown :disable="!eCevaSelectat" icon="description" outline rounded class="q-ml-xl" color="primary"  label="Actiuni..."  >
                <q-list style="min-width:300px">
                        <q-item   >
                          <q-item-section avatar>
                            <q-avatar icon="create" color="primary" text-color="white"></q-avatar>
                          </q-item-section>
                         
                            <div class="row">
                              <q-select style="min-width:250px;margin-right:15px;" @input="alegColDeEditat" filled v-model="colMultiEdit" :options="coloaneMultiEdit" label="Suprascrie valorile din coloana" />
                              <component @selectie-coloana="coloanaSelectata" v-show="amAlesOColoanaDeEditat"  v-bind:is="compMultiEdit" ></component>
                              <q-btn v-close-popup v-show="amAlesOColoanaDeEditat&&valoareNoua!==null" @click="aplicaModificari" style="min-width:60px;margin-left:15px;" round color="deep-orange" icon="check_circle">
                                 <q-tooltip content-class="bg-accent">Aplica elementelor selectate</q-tooltip>
                              </q-btn>
                            </div>
                         

                        </q-item>

                        <q-item :disable="ultimulAn" clickable v-close-popup @click="cloneazaSelectie">
                          <q-item-section avatar>
                            <q-avatar icon="content_copy" color="secondary" text-color="white"></q-avatar>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Cloneaza pentru PAAP anul urmator</q-item-label>
                            <q-item-label caption>Elementele selectate</q-item-label>
                          </q-item-section>

                        </q-item>
                        
                      <q-item clickable v-close-popup @click="confirm=true">
                          <q-item-section avatar>
                            <q-avatar icon="cancel_presentation" color="negative" text-color="white"></q-avatar>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Sterge</q-item-label>
                            <q-item-label caption>Elementele selectate</q-item-label>
                          </q-item-section>

                        </q-item>
                      </q-list>
            </q-btn-dropdown>

            <q-space />
            <q-input borderless dense debounce="300" color="primary" v-model="filter">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
        </template>

        <!--  Rinduri in grid editabile :style="{backgroundColor:props.row.to>0?'grey':'white'}" -->

                    <template v-slot:body="props">
                      <q-tr :style="{backgroundColor:props.row.to>0?'#f4e4ff':'white'}" :props="props">
                       <q-td auto-width>
                          <q-checkbox dense v-model="props.selected" ></q-checkbox>
                        </q-td>
                        <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                        <q-td key="articol" :props="props">
                             <span >{{ props.row.obiectachizitie_text }}</span> 

                                      <q-popup-edit @save="editezObiectAky(props.row.id_obiect_achizitie,props.row.obiectachizitie_text)"  v-model="props.row.obiectachizitie_text" title="Schimba obiect achizitie" buttons label-set="Modifica" label-cancel="Abandon">
                                          <q-input   type="textarea" v-model="props.row.obiectachizitie_text" dense autofocus />
                                      </q-popup-edit>

                        </q-td>
                        <q-td key="codcpv" :props="props">{{ props.row.CodCPV }}</q-td>
                        <q-td key="cantitate" :props="props">
                          {{ props.row.cantitate }}
              
              
                                      <q-popup-edit @save="editeaza(props.row.id,'cantitate',props.row.cantitate)" @hide="proteinRangeValidation" :validate="proteinRangeValidation" v-model="props.row.cantitate" title="Schimba cantitatea" buttons label-set="Modifica" label-cancel="Abandon">
                                          <q-input  :error="errorProtein"  :error-message="errorMessageProtein" type="number" v-model.number="props.row.cantitate" dense autofocus />
                                      </q-popup-edit>

                        </q-td>
                        <q-td key="valoare" :props="props">
                          {{ props.row.valoare }}

                                      <q-popup-edit @save="editeaza(props.row.id,'valoare',props.row.valoare)" @hide="proteinRangeValidation" :validate="proteinRangeValidation" v-model="props.row.valoare" title="Schimba valoarea" buttons label-set="Modifica" label-cancel="Abandon">
                                          <q-input  :error="errorProtein"  :error-message="errorMessageProtein" type="number" v-model.number="props.row.valoare" dense autofocus />
                                      </q-popup-edit>

                        </q-td>
                        <q-td key="procedura" :props="props">{{ props.row.procedura }}</q-td>
                        <q-td key="responsabil" :props="props">{{ props.row.responsabil }}</q-td>
                        <q-td key="compartiment" :props="props">{{ props.row.denumire }}</q-td>
                        <q-td key="artbug" :props="props">{{ props.row.artbug }}</q-td>
                        
                      </q-tr>
                  </template>

          <template v-slot:bottom>
           <div style="min-width: 80vw;" class="row justify-center text-h6">{{nrPozitii}} pozitii - Total valoare: {{sumaTotala}}</div> 
          </template>

        </q-table>

             <q-dialog v-model="confirm" persistent>
                <q-card>
                  <q-card-section class="row items-center">
                    <q-avatar icon="signal_wifi_off" color="primary" text-color="white" />
                    <span class="q-ml-sm">Sunteti sigur ca doriti stergerea?</span>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn flat label="Abandon" color="primary" v-close-popup />
                    <q-btn flat label="Sterge" color="primary" @click="stergeSelectie" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>

                  <q-dialog v-model="adaug_pozitie" persistent transition-show="scale" transition-hide="scale">
                     <paap-pozitie-add :anplan="anselectat" @pozitie-adaugata="pozitieAdaugata"/>
                  </q-dialog>
  </div>

    <q-page-sticky  position="bottom-right" :offset="[24, 24]">
            <q-btn fab   icon="add" color="accent"  @click="adaug_pozitie=true" />
    </q-page-sticky>
    <q-page-sticky  position="bottom-left" :offset="[24, 24]">
            <q-btn fab   icon="settings_backup_restore" color="accent"  @click="$router.push('/dashboard')" />
    </q-page-sticky>
</q-page>

</template>


<script>
import { date } from 'quasar'
import axios from 'axios'
import PaapProceduri from '../components/paap/PaapProceduri'
import PaapResponsabil from '../components/paap/PaapResponsabil'
import PaapArticolBugetar from '../components/paap/PaapArticolBugetar'
import PaapCodCPV from '../components/paap/PaapCodCPV'
import PozitiePAAPAdd from '../components/PozitiePAAPAdd'
import PaapCompartimente from '../components/paap/PaapCompartimente'

function removeByKey(array, params){
  array.some(function(item, index) {
    return (array[index][params.key] === params.value) ? !!(array.splice(index, 1)) : false;
  });
  return array;
}


export default {
  components:{
     'paap-proceduri':PaapProceduri,
     'paap-responsabil':PaapResponsabil,
     'paap-artbug':PaapArticolBugetar,
     'paap-codcpv':PaapCodCPV,
     'paap-pozitie-add':PozitiePAAPAdd,
     'paap-compartimente':PaapCompartimente
  },
  data () {
    return {
      paap:[],
      selected:[],
      filter:'',
      rangeValori: {
        min:0,
        max:250000
      },
      toateArticolele:true,
      toateValorile:true,
      toateProcedurile:true,
      toateCompartimentele:true,
      confirm:false,
      strFiltru:{
        artbug:'',
        proceduri:'',
        comp:'',
        range:''
      },
      filtruAplicat:false,
      errorProtein: false,
      adaug_pozitie:false,
      errorMessageProtein: '',
      valoareNoua:null,
      anselectat:(new Date()).getFullYear().toString(),
      ancur:(new Date()).getFullYear().toString(),
      anante:((new Date()).getFullYear()-1).toString(),
      anpost:((new Date()).getFullYear()+1).toString(),
      pagination: {
        rowsPerPage: 0
      },
      colMultiEdit:null,
      compMultiEdit:null, 
      coloaneMultiEdit:[
        {label:'Cod CPV',value:'CodCPV',comp:'paap-codcpv'},
        { label: 'Procedura', value: 'procedura',comp:'paap-proceduri'},
        { label: 'Responsabil', value: 'responsabil',comp:'paap-responsabil' },
        { label: 'Articol Bugetar', value: 'artbug',comp:'paap-artbug'}
      ],
      columns: [
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
        { name: 'codcpv', align: 'center', label: 'Cod CPV', field: 'CodCPV', sortable: true },
        { name: 'cantitate', align:'right',label: 'Cantitate', field: 'cantitate', sortable: true },
        { name: 'valoare', align:'right',label: 'Valoare estimata', field: 'valoare', sortable: true },
        { name: 'procedura', label: 'Procedura', field: 'procedura',align: 'center', sortable: true ,style: 'max-width: 150px',},
        { name: 'responsabil', label: 'Responsabil', field: 'responsabil',align: 'left' },
        { name: 'compartiment', label: 'Compartiment', align: 'center',field: 'denumire', sortable: true},
        { name: 'artbug', label: 'Art. Bug.', field: 'artbug', sortable: true }
      ]
    }
  },
 
    mounted(){
           if(this.DeLaAchizitii) {
             this.coloaneMultiEdit.push({ label: 'Compartiment', value: 'denumire',comp:'paap-compartimente'}) // de modificat daca merge
           }
         },
 
  computed:{
      DeLaAchizitii(){
           return this.$store.getters.akyroluserlogat==="Achizitii"
       },
    ultimulAn(){
           return this.anselectat==this.anpost
    },
    nrPozitii(){
       return this.paap.length;
    },
    sumaTotala(){
     // console.log('sumaTotala ',this.paap[0].valoare)
     let total=0;
     this.paap.map(p=>{
       total+=parseFloat(p.valoare)
     })
       return total.toFixed(2);
    },
    eCevaSelectat(){
      return this.selected.length>0
    },
    amAlesOColoanaDeEditat(){
      return this.colMultiEdit!==null
    },
      /*compMultiEdit(){
        console.log('....',this.coloaneMultiEdit.comp)
         return this.colMultiEdit.comp
      }*/
  },
  methods: {
      resetFiltre(){
        this.toateArticolele=true;
        this.toateCompartimentele=true;
        this.toateValorile=true;
        this.toateProcedurile=true;
      },
      aplicFiltru(){
        console.log('Aplica filtru...',this.toateValorile,this.rangeValori)
         this.filtruAplicat=true;
          const token=this.$store.getters.akytoken;
          let filtru_valori="";
          let filtru_initial=`paap.stare='activ' and paap.anplan=${this.anselectat}`
          if(!this.DeLaAchizitii) this.strFiltru.comp=` and paap.id_compartiment=${this.$store.getters.idcompartimentakyuserlogat}`;
          if(!this.toateValorile) filtru_valori=` and paap.valoare>=${this.rangeValori.min} and paap.valoare<=${this.rangeValori.max}`; 
          let filtru_cumulat=filtru_initial+this.strFiltru.artbug+this.strFiltru.proceduri+filtru_valori+this.strFiltru.comp;
          axios.post(process.env.host+'paap/paapfiltrat',{filtru:filtru_cumulat,an:this.anselectat},{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la  paap filtrat',res);
                this.paap=[];
                this.paap = [...res.data.paap];
              }
            ).catch(err =>{})  
         //si multe altele...

      },
      stergFiltru(){
        this.filtruAplicat=false;
        this.strFiltru={
                      artbug:'',
                      proceduri:'',
                      comp:'',
                      range:''
         };
        this.paapCompAn(this.anselectat)

      },
      pozitieAdaugata(){
         console.log('receptionat eveniment pozitie-adaugata')
         this.adaug_pozitie=false;
         this.paapCompAn(this.anselectat);
         this.$refs['paaptable'].scrollTo(0);
      },
      proteinRangeValidation (val) {
        if (val < 1 ) {
          this.errorProtein = true
          this.errorMessageProtein = 'Valoarea introdusa nu poate fi negativa'
          return false
        }
        this.errorProtein = false
        this.errorMessageProtein = ''
        return true
      },
      editezObiectAky(id,text){
              console.log('editez obiect aky ',id,text)
              const token=this.$store.getters.token;
               axios.put(process.env.host+`paap/updateobiectaky/${id}`,{'text':text}
                 ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {

                })
        
      },
      editeaza(id,cheie,valoarenoua){

              console.log('editez ',id,cheie,valoarenoua)
              const token=this.$store.getters.token;
               var that = this;
               axios.put(process.env.host+`paap/atomicupdate/${id}`,{[cheie]:valoarenoua}
                 ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {

                })
                
        },
      schimbaAn(value){
       // console.log('Noul an ',value)
          this.selected=[];
          if(this.filtruAplicat){
            this.filtruAplicat=false;
            this.strFiltru={
                          artbug:'',
                          proceduri:'',
                          comp:'',
                          range:''
            };
          }

          this.paapCompAn(value)
      },
      alegFiltruArtBug(v){
           this.strFiltru.artbug=` and paap.artbug='${v.valoare.value}'` ;
      },
      alegFiltruProceduri(v){
           this.strFiltru.proceduri=` and paap.id_procedura=${v.valoare.value}` ;
      },
      alegFiltruCompartimente(v){
          this.strFiltru.comp=` and paap.id_compartiment=${v.valoare.value}` ;             
      },
      coloanaSelectata(v){
       //  NUY MERGE LA FILTRARE
        this.valoareNoua=v;


      },
      alegColDeEditat(){
       //  console.log('Am ales ',this.colMultiEdit);

        this.compMultiEdit=this.colMultiEdit.comp;
      },
      stergeSelectie(){
              let iduri=[],fromuri=[];
              let that=this;
              this.selected.map(el =>{
                iduri.push(el.id)
                fromuri.push(el.from)
                })
              console.log('sterg ',iduri)
              const token=this.$store.getters.token;
              let id=999;
              axios.put(process.env.host+`paap/invalideazapozitieplan/${id}`,{iduri,fromuri}
                 ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {
                          // aici o sa bag codul prin care actualizez gridul
                              this.$q.notify({
                                message:`Stergere reusita!`,
                                timeout:1500,
                                position:'top',
                                color:'positive'
                                })
                               iduri.map(id=>{that.paap = removeByKey(that.paap,{key:'id',value:id})}) 
                               
                               that.selected=[];
                      })

      },
      cloneazaSelectie(){

              let iduri=[];
              let that=this;
              this.selected.map(el => iduri.push(el.id))
              console.log('clonez ',this.selected)
              const token=this.$store.getters.token; 
              axios.post(process.env.host+'paap/cloneazapozitii',{
                    tranzactii:this.selected
              },{headers:{"Authorization" : `Bearer ${token}`}}).then(res =>{
                           this.$q.notify({
                                message:`Clonare pozitii PAAP reusita!`,
                                timeout:2000,
                                position:'top',
                                color:'positive'
                                })

                               this.selected=[];
                  
              }).catch(err=>{
                
              })

      },
      aplicaModificari(){
        console.log('Valoare noua ....',this.valoareNoua);
         this.colMultiEdit=null;
         let that=this;
         let iduri=[];
         this.selected.map(el => iduri.push(el.id))
         const token=this.$store.getters.akytoken;
         function eSelectat(id){
           let exista=false;
           
           that.selected.map(el=>{
            
             if(el.id==id) exista=true;

           })
           return exista;
         }
         //aici aplic modificari

         // aici update request
         let id=999;
         axios.put(process.env.host+`paap/${id}`,{[this.valoareNoua.cimp]:this.valoareNoua,iduri}
                 ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {
                          // aici o sa bag codul prin care actualizez gridul
                              this.$q.notify({
                                message:`Actualizare reusita!`,
                                timeout:1500,
                                position:'top',
                                color:'positive'
                                })

                              this.paap.map(poz_paap=>{

                              if(eSelectat(poz_paap.id)){
                                poz_paap[that.valoareNoua.ce]=that.valoareNoua.valoare.label;
                              }
                              })

                               this.selected=[];
                      })




      },
      paapCompAn(an){
          const token=this.$store.getters.akytoken;
          const rol = this.$store.getters.akyroluserlogat;
          const id_comp = this.$store.getters.idcompartimentakyuserlogat;
        console.log('PAAP Comp An',rol,id_comp);
          let idc = (rol==="Achizitii")? 0:id_comp;
          axios.get(process.env.host+'paap/paapintegral/'+idc+'/'+an,{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la tot paap-ul',res);
                this.paap=[];
                this.paap = [...res.data.paap];
              }
            ).catch(err =>{})  
            }
  },
  created(){
      this.paapCompAn(this.ancur)
  }
}
</script>

<style lang="sass">
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
