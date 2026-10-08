<template>
    <q-page padding>
        <div class="q-pa-md">
            <q-table
                    title="Categorii repere"
                    :data="categorii"
                    :columns="columns"
                    row-key="id"
                    :filter="filter"
                    selection="single"
                    :selected.sync="selected"
                    :pagination.sync="pagination"
                    rows-per-page-label="Inregistrari pe pagina"

             >
             <template v-slot:top>
                    <q-btn  outline rounded  color="primary"  icon="add_box" label="Adauga" @click="opened=true" ></q-btn>
                    <q-btn class="on-right" icon="delete_sweep"  outline rounded  color="primary"  label="Sterge" @click="stergCateg" ></q-btn>
                    <q-space ></q-space>
                    <q-input borderless dense debounce="300" color="primary" v-model="filter" placeholder="Cauta">
                        <template v-slot:append>
                        <q-icon name="search" ></q-icon>
                        </template>
                    </q-input>
           </template>

                   <template v-slot:body="props">
                      <q-tr :props="props">
                       <q-td auto-width>
                          <q-checkbox  v-model="props.selected" ></q-checkbox>
                        </q-td>
                        <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                        <q-td key="denumire" :props="props">
                          {{ props.row.denumire }}
                                <q-popup-edit v-model="props.row.denumire" @save="editeaza(props.row.id,'denumire',props.row.denumire)">
                                  <q-input v-model="props.row.denumire" dense autofocus  ></q-input>
                                </q-popup-edit>
                        </q-td>
                        <q-td key="gestiune" :props="props">
                          {{ props.row.gestiune }}
                               <q-popup-edit buttons v-model="props.row.gestiune" @save="editeaza(props.row.id,'idgestiune',idgestiune)">
                                     <q-select v-model="props.row.gestiune" :options="gestiuni" @input="gestSelectata" label="Gestiune" />
                                </q-popup-edit>
                         </q-td>
                        <q-td key="cont" :props="props">
                          {{ props.row.cont }}

                         </q-td>
                        <q-td key="contcheltuiala" :props="props">
                          {{ props.row.contcheltuiala }}

                        </q-td>
                        <q-td key="tipmaterial" :props="props">
                          {{ props.row.tipmaterial }}
                                <q-popup-edit v-model="props.row.tipmaterial" @save="editeaza(props.row.id,'tipmaterial',props.row.tipmaterial)">
                                   
                                      <q-radio v-model="props.row.tipmaterial" val="M" label="Material" />
                                      <q-radio v-model="props.row.tipmaterial" val="OB" label="Obiect inventar" />
                                      <q-radio v-model="props.row.tipmaterial" val="MF" label="Mijloc fix" />

                                   
                                </q-popup-edit>
                        </q-td>
                      </q-tr>
                  </template>

            </q-table>

               <q-dialog v-model="opened"  transition-show="jump-down" transition-hide="jump-up">
                  <q-card class="q-pa-md" style="width: 400px; max-width: 90vw;padding:10">
                       <q-input v-model="denumire" label="Denumire" :rules="[val => !!val || 'Cimp obligatoriu!']" >
                         <q-tooltip>Cimp obligatoriu!</q-tooltip>
                        </q-input>

                        <q-select v-model="numegestiune" :options="gestiuni" @input="gestSelectata" label="Gestiune" />
                          <q-select
                            v-model="cont"
                            use-input
                            hide-selected
                            fill-input
                            input-debounce="0"
                            :options="conturianalitice"
                            @filter="filterFn"
                            label="Cont analitic"
                            hint="Tastati 2 caractere pentru a afisa lista cu optiuni"
                            
                          >
                            <template v-slot:no-option>
                              <q-item>
                                <q-item-section class="text-grey">
                                  Nicio optiune!
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                          <q-select
                            v-model="contcheltuiala"
                            use-input
                            hide-selected
                            fill-input
                            input-debounce="0"
                            :options="conturicheltuiala"
                            @filter="filterFn"
                            label="Cont cheltuiala"
                            hint="Tastati 2 caractere pentru a afisa lista cu optiuni"
                            
                          >
                            <template v-slot:no-option>
                              <q-item>
                                <q-item-section class="text-grey">
                                  Nicio optiune!
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>                    

                        <div class="q-mt-md q-gutter-sm">
                            <q-radio v-model="tipmaterial" val="M" label="Material" />
                            <q-radio v-model="tipmaterial" val="OB" label="Obiect inventar" />
                            <q-radio v-model="tipmaterial" val="MF" label="Mijloc fix" />

                       </div>
                        <div class="row justify-center q-mt-md">
                          <q-btn
                            color="primary"
                            icon="contact_mail"
                            dense
                            @click="categNoua"
                            label="Adauga"
                          />

                          <q-btn
                            color="primary"
                            class="q-ml-md"
                            icon="code"
                            dense
                            @click="reset"
                            label="Reset"
                          />

                      </div>
                  </q-card>
               </q-dialog>

        </div>
    </q-page>
</template>



<script>
import axios from 'axios';
var optiunianalitice = [
  
]

function removeByKey(array, params){
  array.some(function(item, index) {
    return (array[index][params.key] === params.value) ? !!(array.splice(index, 1)) : false;
  });
  return array;
}

export default {
    data(){
        return {
            categorii:[],
            gestiuni:[],
            conturianalitice:optiunianalitice,
            conturicheltuiala:optiunianalitice,
            opened:false,
            denumire:'',
            numegestiune:'',
            idgestiune:0,
            cont:'',
            contcheltuiala:'',
            tipmaterial:'M',
            pagination: {
                sortBy: 'name',
                descending: false,
                page: 1,
                rowsPerPage: 12
                // rowsNumber: xx if getting data from a server
             },
            columns: [
                    {
                    name: 'id',
                    required: true,
                    label: 'ID',
                    align: 'left',
                    field: 'id',
                    sortable: true
                    },
                    { name: 'denumire', label: 'Denumire', field: 'denumire', sortable: true,align: 'left' },
                    { name: 'gestiune', label: 'Gestiune', field: 'gestiune', sortable: true ,align: 'left'},
                    { name: 'cont', label: 'Cont', field: 'cont',align: 'left' },
                    { name: 'contcheltuiala', label: 'Cont cheltuiala', field: 'contcheltuiala' ,align: 'left'},
                    { name: 'tipmaterial', label: 'Tip material', field: 'tipmaterial',align: 'left' }

                
                ],
                    filter: '',
                    selected: []
        }
    },
      created(){
     //console.log('Se creeaza Utilizatorii....')
     const token=this.$store.getters.token;

      axios.get(process.env.host+'categ/toate',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toate categoriile',res.data.categorii);
           this.categorii=[...res.data.categorii]
        }
      ).catch(err =>{})

      axios.get(process.env.host+'conturi/toatetoate',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toate conturile si analitice',res.data);
           this.conturianalitice = res.data.conturi.map((c)=>{
             return {
               label:c.cont+" "+c.denumire,
               value:c.id
             }
           })
           optiunianalitice=[...this.conturianalitice];
           this.conturicheltuiala=[...this.conturianalitice]
        }
      ).catch(err =>{})

      axios.get(process.env.host+'gest/toategestiunile',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
          this.gestiuni=res.data.gestiuni.map(gest => {
                                                            return {
                                                              label: gest.denumire,
                                                              id:gest.id,
                                                              value: gest.id
                                                            }
                                                          })
        }
      ).catch(err =>{})
  },
  computed: {
    tableClass () {
      if (this.dark) {
        return 'bg-black'
      }
    },
    passHasError(){
        return this.pass.length>0&&this.pass.length<5
      }
  },
  methods:{
        editeaza(id,cheie,valoarenoua){

              console.log('editez',id,cheie,valoarenoua)
              const token=this.$store.getters.token;
               var that = this;
              axios.put(process.env.host+`categ/${id}`,{[cheie]:valoarenoua}
                 ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {

                })
                
        },
        reset(){
          console.log('reset',this.cont)
            this.denumire='';
            this.numegestiune='';
            this.idgestiune=0;
            this.cont='';
            this.contcheltuiala='';
            this.tipmaterial='M';
        },
        gestSelectata(v){
          console.log(v);
         this.idgestiune=v.value
        },
        stergCateg(){
          if(this.selected.length==0){
                          this.$q.notify({
                          message:`Selectati o categorie!`,
                          timeout:1500,
                          position:'top',
                          color:'positive' 
                          })
                          return;
          }
           console.log('sterg',this.selected[0].id)
            const token=this.$store.getters.token;
            var that = this;
            axios.patch(process.env.host+`categ/${this.selected[0].id}`,{}
          ,{headers:{"Authorization" : `Bearer ${token}`}}).then(
                      res => {
                       
                       // that.categorii.filter(item => item.id!==that.selected[0].id)
                         that.categorii = removeByKey(that.categorii,{key:'id',value:that.selected[0].id});

                          this.$q.notify({
                          message:`Categoria selectata a fost invalidata!`,
                          timeout:1500,
                          position:'top',
                          color:'positive'
                })
                })


        },
        filterFn (val, update, abort) {
                if (val.length < 2) {
                  abort()
                  return
                }

                update(() => {
                  console.log('filtru',optiunianalitice,this.conturianalitice)
                  const needle = val.toLowerCase()
                  this.conturianalitice = optiunianalitice.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
                  this.conturicheltuiala = optiunianalitice.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
                })
         },
        categNoua(){
          const token=this.$store.getters.token;
          var that = this;

                axios.post(process.env.host+'categ/categorienoua',{
                "denumire":this.denumire,
                "idgestiune":this.idgestiune,
                "idcont":this.cont.value,
                "cont":this.cont.label,
                "idcontchelt":this.contcheltuiala.value,
                "contcheltuiala":this.contcheltuiala.label,
                "tipmaterial":this.tipmaterial,

                "stare":"activ"
              },{headers:{"Authorization" : `Bearer ${token}`}}).then(
                    res => {
                      console.log('raspuns insert categorie',res,that.numegestiune);
                        this.$q.notify({
                        message:`Categoria de repere ${that.denumire} a fost adaugata cu succes!`,
                        timeout:1500,
                        position:'top',
                        color:'positive'
              });

                that.categorii.unshift({
                  "id":res.data.id,
                  "denumire":that.denumire,
                  "idgestiune":that.idgestiune,
                  "cont":that.cont,
                  "contcheltuiala":that.contcheltuiala,
                  "tipmaterial":that.tipmaterial,
                  "gestiune":that.numegestiune.label,

                });

              that.reset();

              that.opened=false;
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
        }
  }
}
</script>
