<template>
<q-page padding>
    <div class="flex flex-center column ">
        <div class="row q-pa-md">
          <q-select  @input="schimbTipMaterial" outlined v-model="tipmaterial" :options="tipurirepere" label="Tip material" /> 
          <div class="column q-pa-md">
                <q-toggle v-model="toatecategoriile" color="green" label="Toate categoriile"  />
                <q-select
                      outlined
                      v-if="!toatecategoriile"
                      v-model="categoriei"
                      dense
                      label="Categorie reper"
                      :options="categorii"
                      style="width: 175px; "
                >

                </q-select>

          </div>

          <div class="column q-pa-md">
                <q-toggle v-model="toatelocurile" color="green" label="Toate locurile"  />
                 <q-select
                     filled
                     v-if="!toatelocurile"
                     dense
                     v-model="locselectat"
                     use-input
                     hide-selected
                     fill-input
                     input-debounce="0"
                     label="Loc dispunere"
                     :options="locuriintrare"
                     @filter="filterIFn"
                      style="width: 175px;"
                    >
                                        <template v-slot:no-option>
                                          <q-item>
                                            <q-item-section class="text-grey">
                                              Niciun rezultat
                                            </q-item-section>
                                          </q-item>
                                        </template>
                                    </q-select>

          </div>

          <div class="column q-pa-md">
                <q-toggle v-model="toatestarile" color="green" label="Toate starile"  />
                <q-select v-if="!toatestarile" dense outlined v-model="staremateriali" :options="starimaterial" label="Stare material" style="width:175px;"/>

          </div>      
          <div class="column q-pa-md">
              <q-btn-dropdown  rounded color="secondary" label="Perioada" >
                    <!-- dropdown content goes here -->
                <q-card >
                  <q-card-section>
                      <q-input filled label="De la" v-model="datainceput" mask="date" :rules="['date']">
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy1" transition-show="scale" transition-hide="scale">
                              <q-date v-model="datainceput" @input="() => $refs.qDateProxy1.hide()" />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                      <q-input filled label="La" v-model="datasfirsit" mask="date" :rules="['date']">
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy2" transition-show="scale" transition-hide="scale">
                              <q-date v-model="datasfirsit" @input="() => $refs.qDateProxy2.hide()" />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                  </q-card-section>

                  <q-card-actions vertical>
                    <q-btn flat v-close-popup >Selecteaza</q-btn>

                  </q-card-actions>
                </q-card>
                  </q-btn-dropdown>
              <div class="q-pa-sm text-bold">
                   {{datainceput}} : {{datasfirsit}}
              </div>
          </div>  

        </div> 
        <!-- Aici vine divul cu butoanele -->
       <div class="q-pa-md flex flex-center column ">
            <q-btn-group rounded>
              <q-btn @click="genBalanta" color="amber" rounded glossy icon-right="update" label="BALANTA ANALITICA DE GESTIUNE" />
              <q-btn @click="genLI" color="amber" rounded glossy icon-right="update" label="LISTA DE INVENTARIERE" />
              <q-btn-dropdown  glossy rounded color="amber" label="Fisa de cont" >
                <q-card>
                  <q-card-section>
                     <div class="q-gutter-md row">
                            <q-select
                              filled
                              v-model="materialselectat"
                              use-input
                              hide-selected
                              fill-input
                              input-debounce="0"
                              :options="materialelegestiunii"
                              @filter="filterFn"
                              hint="Mininum 2 caractere pentru cautare..."
                              style="width: 250px; padding-bottom: 32px"
                            >
                              <template v-slot:no-option>
                                <q-item>
                                  <q-item-section class="text-grey">
                                    Niciun material gasit!
                                  </q-item-section>
                                </q-item>
                              </template>
                              <template v-slot:option="scope">
                                              <q-item
                                                v-bind="scope.itemProps"
                                                v-on="scope.itemEvents"
                                              >

                                                <q-item-section>
                                                  <q-item-label >{{ scope.opt.label }} ({{scope.opt.um}})</q-item-label>
                                                  <q-item-label >Cod: {{scope.opt.cod}}</q-item-label>
                                                  
                                                </q-item-section>
                                              </q-item>
                                  </template>
                            </q-select>
                          </div>
                  </q-card-section>
                  <q-card-actions vertical>
                    <q-btn flat v-close-popup @click="genFisaCont">Genereaza !</q-btn>
                   </q-card-actions>
                </q-card>
              </q-btn-dropdown>
            </q-btn-group>
       </div>
       
      <lista-inventar v-if="afisezListaInventariere" />
      <balanta v-if="afisezBalanta" :setdate="datebalanta" :total="totalstocfinal" :parametrii="parametrii_balanta"/>
      <fisa-cont v-if="afisezFisaCont" :setdate="datefisacont" :parametrii="parametrii_fisa"/>


    </div>
</q-page>
</template>

<script>
import axios from 'axios';
import { date } from 'quasar'
import BalantaAnalitica from '../components/Balanta'
import ListaInventariere from '../components/ListaInventariere'
import FisaCont from '../components/FisaCont'
var locuri=[],materiale=[];
export default {
    components:{
    'balanta':BalantaAnalitica,
    'lista-inventar':ListaInventariere,
    'fisa-cont':FisaCont

  },
  data () {
    return {
       tipurirepere:[{label:'MATERIALE', value:'M'}, {label:'OBIECTE INVENTAR',value:'OB'}, {label:'MIJLOACE FIXE',value:'MF'}],
        tipmaterial:{label:'MATERIALE', value:'M'},
        toatecategoriile:true,
        toatelocurile:true,
        afisezBalanta:false,
        afisezFisaCont:false,
        afisezListaInventariere:false,
        toatestarile:true,
        locselectat:null,
        categoriei:null,
        locuriintrare:[],
        materialelegestiunii:[],
        materialselectat:null,
        datainceput: '2020/04/01',
        datasfirsit:'2020/04/27',
        starimaterial:['NOU', 'FOLOSIT', 'CASARE'],
        staremateriali:'NOU',
        datebalanta:[] ,
        datefisacont:[],
        parametrii_balanta:{},
        parametrii_fisa:{},
        totalstocfinal:0
    }
  },
  created(){
      const token=this.$store.getters.token;
      var azi = new Date(); 
      var firstDay =  
                    new Date(azi.getFullYear(), azi.getMonth(), 1); 
                      
      var lastDay =  
                   new Date(azi.getFullYear(), azi.getMonth() + 1, 0); 

       this.datainceput=date.formatDate(firstDay, 'YYYY/MM/DD');
       this.datasfirsit=date.formatDate(lastDay, 'YYYY/MM/DD');               
       axios.get(process.env.host+'locuri/toatelocurile',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toate locurile',res.data.locuri);
           this.locuriintrare=[];
           locuri=[];
           res.data.locuri.map(loc=>{
             this.locuriintrare.push({
               id:loc.id,
               label:loc.denumire,
               value:loc.id
             })
           })
           locuri=[...this.locuriintrare];
           this.locselectat=this.locuriintrare[0];
        }
      ).catch(err =>{})

      //materiale
        axios.get(process.env.host+`materiale/toate/${this.$store.getters.gestiuneCurenta.id}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toate materialele',res.data);
           this.materialelegestiunii=[];
           materiale=[];
           res.data.materiale.map(m=>{
             this.materialelegestiunii.push({
               id:m.id,
               label:m.denumire,
               value:m.id,
               um:m.um,
               pretpredefinit:m.pretpredefinit,
               cod:m.cod_import,
               stoc:9999
             })
           })
          
           materiale=[...this.materialelegestiunii];

        }
      ).catch(err =>{})
      this.categoriiPerGestiunePerTip()
  },
  methods:{
    genLI(){
        this.afisezBalanta=false;
        this.afisezListaInventariere=true;
          this.afisezFisaCont=false;
    },
    genFisaCont(){
        var that=this; 
        this.afisezBalanta=false;
        this.afisezListaInventariere=false;
       
        console.log('Material selectat...',this.materialselectat);

        const token=this.$store.getters.token;
         let categorii=this.toatecategoriile? '*':this.categoriei.value;
         //tipmaterial
         let locuri=this.toatelocurile? '*':this.locselectat.value;
         let stari=this.toatestarile? '*':this.staremateriali;
         console.log('GENEREZ FISA CONT',categorii,this.tipmaterial.value,locuri,stari,this.datainceput,this.datasfirsit);
         var that=this; 
         this.parametrii_fisa={
            "tipmaterial":this.tipmaterial.value,
            denumiretipmaterial:this.tipmaterial.label,
            denumireloc:this.toatelocurile?'Toate Locurile':this.locselectat.label,
            denumirecategorie:this.toatecategoriile?'Toate Categoriile':this.categoriei.label,
             "datainceput":this.datainceput,
             "datasfirsit":this.datasfirsit,
             "idmaterial":this.materialselectat.value,
             "denumirematerial":this.materialselectat.label,
            "idgestiune":this.$store.getters.gestiuneCurenta.id,
            "gestiune":this.$store.getters.gestiuneCurenta.denumire,
            categorii,
            locuri,
            stari
        };
         
         axios.post(process.env.host+'balante/fisacont',this.parametrii_fisa,{headers:{"Authorization" : `Bearer ${token}`}}).then(
            res => {
               
                that.datefisacont=[];
                var si=parseFloat(res.data.sifc[0][0].stocinitial),vi=parseFloat(res.data.sifc[0][0].valoarestocinitial);
                
                that.datefisacont.push({
                  data:'<'+that.datainceput,
                  explicatii:'SOLD INITIAL',
                  um:'',
                  ci:'',
                  ce:'',
                  cs:parseFloat(res.data.sifc[0][0].stocinitial).toFixed(2),
                  vi:'',
                  ve:'',
                  vs:parseFloat(res.data.sifc[0][0].valoarestocinitial).toFixed(2)
                })
              
              res.data.tranzactii[0].map(t=>{
                 console.log('a sosist fisa de cont',si);
                 let c_d=parseFloat(t.cantitate_debit),c_c=parseFloat(t.cantitate_credit);
                 let v_d=parseFloat(t.debit),v_c=parseFloat(t.credit);
                si+=(c_d-c_c);
                vi+=(v_d-v_c);
                that.datefisacont.push({
                  data:date.formatDate(t.data, 'DD.MM.YYYY'),
                  explicatii:t.explicatii,
                  um:t.um,
                  ci:t.cantitate_debit,
                  ce:t.cantitate_credit,
                  cs:si.toFixed(2),
                  vi:parseFloat(t.debit).toFixed(2),
                  ve:parseFloat(t.credit).toFixed(2),
                  vs:vi.toFixed(2)
                })
              })

              that.datefisacont.push({
                  data:'<'+that.datasfirsit,
                  explicatii:'SOLD FINAL',
                  um:'',
                  ci:'',
                  ce:'',
                  cs:si.toFixed(2),
                  vi:'',
                  ve:'',
                  vs:vi.toFixed(2)
                })

              that.afisezFisaCont=true;// asta se muta cind vine raspunsul de la fisa cont
            }
         ).catch(err =>{
                  this.$q.notify({
                    color: 'negative',
                    timeout:1500,
                    position:'top',
                    icon: 'delete',
                    message: `EROARE GENERICA! `
                  })
        })
    },
    genBalanta(){
         const token=this.$store.getters.token;
         let categorii=this.toatecategoriile? '*':this.categoriei.value;
         //tipmaterial
         let locuri=this.toatelocurile? '*':this.locselectat.value;
         let stari=this.toatestarile? '*':this.staremateriali;
         console.log('GENEREZ BALANTA',categorii,this.tipmaterial.value,locuri,stari,this.datainceput,this.datasfirsit);
         var that=this; 
         this.parametrii_balanta={
            "tipmaterial":this.tipmaterial.value,
            denumiretipmaterial:this.tipmaterial.label,
            denumireloc:this.toatelocurile?'Toate Locurile':this.locselectat.label,
            denumirecategorie:this.toatecategoriile?'Toate Categoriile':this.categoriei.label,
             "datainceput":this.datainceput,
             "datasfirsit":this.datasfirsit,
            "idgestiune":this.$store.getters.gestiuneCurenta.id,
            "gestiune":this.$store.getters.gestiuneCurenta.denumire,
            categorii,
            locuri,
            stari
        };
         axios.post(process.env.host+'balante/balantanoua',this.parametrii_balanta,{headers:{"Authorization" : `Bearer ${token}`}}).then(
            res => {
              console.log('A sosit balanta...',that.datebalanta)
              that.datebalanta=[];
              let nrcrt=1,totalstoc=0;
              res.data.balanta[0].map((linie=>{
                that.datebalanta.push({
                    nrcrt,
                    id_reper:linie.id_reper,
                    denumire:linie.denumire,
                    um:linie.um,
                    stocinitial:linie.stocinitial,
                    ti:linie.ti,
                    te:linie.te,
                    stocfinal:linie.stocfinal,
                    valoarestocinitial:parseFloat(linie.valoarestocinitial).toFixed(2),
                     vi:parseFloat(linie.vi).toFixed(2),
                      ve:parseFloat(linie.ve).toFixed(2),
                       valoarestoc:parseFloat(linie.valoarestoc).toFixed(2),

                })
                 nrcrt++;
                 totalstoc+=parseFloat(linie.valoarestoc);
              }))
             that.afisezBalanta=true;
               this.afisezFisaCont=false;
             that.totalstocfinal=totalstoc.toFixed(2);
             console.log('A sosit balanta...',that.datebalanta)
             that.afisezListaInventariere=false;
            }
        ).catch(err =>{
                  this.$q.notify({
                    color: 'negative',
                    timeout:1500,
                    position:'top',
                    icon: 'delete',
                    message: `EROARE GENERICA! `
                  })
        })

    },
    categoriiPerGestiunePerTip(){
       const token=this.$store.getters.token;

       axios.get(process.env.host+`categ/categoriilegestiunii/${this.$store.getters.gestiuneCurenta.id}/${this.tipmaterial.value}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
          // console.log('Raspuns la toate locurile',res.data.locuri);
          // this.categorii=[...res.data.categorii]
          this.categorii=[];
           res.data.categorii.map(c=>{
             this.categorii.push({
               id:c.id,
               label:c.denumire,
               value:c.id
             })
           })
        }
      ).catch(err =>{})

      },
      filterFn(val, update, abort){
        if (val.length < 2) {
                  abort()
                  return
           }
          update(() => {
            const needle = val.toLowerCase()
            this.materialelegestiunii = materiale.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
          })
      },
     schimbTipMaterial(){
            console.log('schimb tip material', this.tipmaterial)
           this.categoriiPerGestiunePerTip();
  
      },
          filterIFn (val, update, abort) {
            if (val.length < 2) {
                      abort()
                      return
              }
              update(() => {
                const needle = val.toLowerCase()
                this.locuriintrare = locuri.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
              })
          }
  }
}
</script>


