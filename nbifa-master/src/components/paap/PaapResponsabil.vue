<template>
     <q-input clearable @input="amScris" debounce="1000" filled style="min-width:200px;" v-model="model"  label="Responsabil" />
</template>

<script>
export default {
   name:'PaapResponsabil',
   data(){
       return {
                model: null
       }
   },
   methods:{
       amScris(){
          this.$emit('selectie-coloana',{cimp:'responsabil',ce:'responsabil',valoare:{label:this.model,value:this.model}})
          console.log('Responsabil nou',{label:this.model,value:this.model})
       }
   }
}
</script>

<style>

</style>