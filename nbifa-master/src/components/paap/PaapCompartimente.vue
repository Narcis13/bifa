<template>
     <q-select style="min-width:200px;" @input="amSelectat" dense v-model="model" :options="options" label="Compartimente" />
</template>

<script>
import axios from 'axios'
export default {
   name:'PaapCompartimente',
   data(){
       return {
                model: null,
                options: [
                    

                ]
       }
   },
    created(){
     const token=this.$store.getters.akytoken;
     axios.get(process.env.host+'paap/toatecompartimentele',{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la toate compartimentele',res.data);
                //this.paap = [...res.data.proceduri];
                res.data.compartimente.map(c=>{
                    this.options.push({
                        id:c.id,
                        label:c.denumire,
                        value:c.id
                    })
                })
              }
            ).catch(err =>{})  
   },
   methods:{
       amSelectat(){
          this.$emit('selectie-coloana',{cimp:'id_compartiment',ce:'denumire',valoare:{label:this.model.label,value:this.model.value}})
        //  console.log('Art bug nou',{label:this.model,value:this.model})
       }
   }
}
</script>

<style>

</style>