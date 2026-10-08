<template>
     <q-btn icon="add_box" color="secondary" flat label="Adauga" class="q-mr-sm" @click="adMaterial">
           <q-menu>
                    
                    <div class="column no-wrap q-pa-md" style="min-width:300px">
                        <q-input autofocus ref="edNume" v-model="nume_material" label="Denumire"  @keyup.enter="urmatorul('edUM')" />
                        <q-input ref="edUM" v-model="um_material" label="UM" @keyup.enter="urmatorul('edPret')"  />
                        <q-input ref="edPret" v-model.number="pret_predefinit" label="Pret predefinit" type="number"   />
                        <q-input  v-model="cod_material" label="Cod"  >
                                          <template v-slot:append>
                                              <q-btn round color="green" icon="search" dense @click="aflaUltimulCod"/>
                                           </template>
                        </q-input>
                        <q-btn
                            color="primary"
                            @click="adauga"
                            label="Salveaza!"
                            push
                            size="sm"
                            v-close-popup
                        />
                    </div>
             
                  
              </q-menu>
     
     </q-btn>

</template>

<script>
import axios from 'axios'
export default {
    name:'MaterialAdd',
    props: ['data','mat'],
    data: function () {
        return {
           nume_material:"",
           pret_predefinit:1,
           um_material:"buc",
           cod_material:" ",
           materiale:this.data
        }
    },
    created(){
      console.log('Componentul MaterialAdd a fost creat cu mat',this.mat)
    },
    methods:{
      adMaterial(){
console.log('ADAUG MATERIAL!',this.mat);
      },
        adauga(){
          const token=this.$store.getters.token;
          var that = this;

                axios.post(process.env.host+'materiale/materialnou',{
                "denumire":this.nume_material,
                "um":this.um_material,
                "cod_import":this.cod_material,
                "pretpredefinit":this.pret_predefinit,
                "idgestiune":this.$store.getters.gestiuneCurenta.id,
                "iduser":this.$store.getters.userid,
                "stare":"activ"
              },{headers:{"Authorization" : `Bearer ${token}`}}).then(
                    res => {
                      console.log('raspuns insert material',res);
                        this.$q.notify({
                        message:`Reperul ${that.nume_material} a fost adaugat cu succes!`,
                        timeout:1500,
                        position:'top',
                        color:'positive'
              });
                let mat_nou = {id:res.data.id,denumire:this.nume_material,cod_import:this.cod_material,um:this.um_material,pretpredefinit:this.pret_predefinit,user:this.$store.getters.numeReal,gestiune:this.$store.getters.gestiuneCurenta.denumire,datacreere:new Date().toISOString(),datamodificare:new Date().toISOString(),eNou:true};
                this.$emit('materialnou',mat_nou);
                this.$root.$emit('materialadaugat',mat_nou);
                that.data.unshift(mat_nou);
                that.nume_material="";
                that.pret_predefinit=1
                that.um_material="buc";
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

          // this.materiale.push({denumire:this.nume_material,um:this.um_material,pretpredefinit:this.pret_predefinit})


             //  this.$q.notify({color:'secondary',message:'Material adaugat cu succes',position:'top'})
        },
        aflaUltimulCod(){
          const token=this.$store.getters.token;

        axios.get(process.env.host+`materiale/ultimulcod/${this.$store.getters.gestiuneCurenta.id}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

          res => {
             console.log('Rspuns la ultimul cod',res.data);
             this.cod_material=res.data.coduri[0][0].cod_import;
            // this.materiale=[...res.data.materiale]
          }
        ).catch(err =>{})
        },
        urmatorul(el){
         this.$refs[el].focus();
        }
    }
}

</script>