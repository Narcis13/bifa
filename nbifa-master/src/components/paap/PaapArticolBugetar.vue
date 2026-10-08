<template>
     <q-select style="min-width:200px;" @input="amSelectat" dense v-model="model" :options="options" label="Articol Bugetar" />
</template>

<script>
export default {
   name:'PaapArticolBugetar',
   data(){
       return {
                model: null,
                options: [
                    '20.01.01',
                    '20.01.02',
                    '20.01.03',
                    '20.01.04',
                    '20.01.05',
                    '20.01.06',
                    '20.01.07',
                    '20.01.08',
                    '20.01.09',
                    '20.01.30',
                    '20.02',
                    '20.03.01',
                    '20.03.02',
                    '20.04.01',
                    '20.04.02',
                    '20.04.03',
                    '20.04.04',
                    '20.05.01',
                    '20.05.03',
                    '20.05.30',
                    '20.06.01',
                    '20.06.02',
                    '20.09',
                    '20.11',
                    '20.12',
                    '20.13',
                    '20.14',
                    '20.15',
                    '20.16',
                    '20.18',
                    '20.19',
                    '20.21',
                    '20.22',
                    '20.23',
                    '20.24.01',
                    '20.24.02',
                    '20.24.03',
                    '20.25',
                    '20.30.01',
                    '20.30.02',
                    '20.30.03',
                    '20.30.04',
                    '20.30.06',
                    '20.30.07',
                    '20.30.08',
                    '20.30.09',
                    '20.30.30',
                    '71.01.01',
                    '71.01.02',
                    '71.01.03',
                    '71.01.30',
                    '71.02.01'

                ]
       }
   },
   methods:{
       amSelectat(){
          this.$emit('selectie-coloana',{cimp:'artbug',ce:'artbug',valoare:{label:this.model,value:this.model}})
          console.log('Art bug nou',{label:this.model,value:this.model})
       }
   }
}
</script>

<style>

</style>