<template>
     <q-select style="min-width:200px;" @input="amSelectat" v-model="model" :options="options" label="Proceduri" />
</template>

<script>
import axios from 'axios'
export default {
   name:'PaapProceduri',
   props:['selectie'],
   data(){
       return {
                model: null,
                options: [
                    
                ]
       }
   },
   created(){
     const token=this.$store.getters.akytoken;
     axios.get(process.env.host+'paap/toateprocedurile',{headers:{"Authorization" : `Bearer ${token}`}}).then(

              res => {
                console.log('Rspuns la toate procedurile',res.data);
                //this.paap = [...res.data.proceduri];
                res.data.proceduri.map(p=>{
                    this.options.push({
                        id:p.id,
                        label:p.procedura,
                        value:p.id
                    })
                })
              }
            ).catch(err =>{})  
   },
   methods:{
       amSelectat(){
           this.$emit('selectie-coloana',{cimp:'id_procedura',ce:'procedura',valoare:this.model})
         //  this.selectie=this.model
       }
   }
}
</script>

<style>

</style>