<template>
     <q-select 
      clearable
      filled
      use-input
      hide-selected
      fill-input
      dense
      input-debounce="0"
      style="min-width:200px;padding-bottom: 16px"
      hint="Tasteaza primele 2 carcatere din cod"
      v-model="model" 
      :options="options"
      @filter="filterFn"
      @input="amSelectat"
       label="Cod CPV"
    >
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.label" />
              <q-item-label caption>{{ scope.opt.description }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              Nu am gasit niciun cod...
            </q-item-section>
          </q-item>
        </template>
     </q-select>
</template>

<script>
import axios from 'axios'
var coduri=[];
export default {
   name:'PaapProceduri',
   data(){
       return {
                model: null,
                options: [
                    
                ]
       }
   },
   created(){
      const token=this.$store.getters.akytoken;  
      axios.get(process.env.host+'paap/toatecodurilecpv',{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la toate codurile',res.data);
                //this.paap = [...res.data.proceduri];
                this.options=[];
                coduri=[];
                res.data.coduri.map(c=>{
                    this.options.push({
                        id:c.IDCod,
                        label:c.CodCPV,
                        value:c.IDCod,
                        description:c.descriere
                    })
                })
                coduri=[...this.options];


              }
            ).catch(err =>{})    

   },
   methods:{
      filterFn (val, update, abort) {
        if (val.length < 2) {
            abort()
            return
        }

      update(() => {
        const needle = val.toLowerCase()
        this.options = coduri.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
      })
    },
    amSelectat(){
        console.log('Codul selectat...',this.model)
        this.$emit('selectie-coloana',{cimp:'id_cod_cpv',ce:'CodCPV',valoare:this.model})
    }
   }

}
</script>

<style>

</style>