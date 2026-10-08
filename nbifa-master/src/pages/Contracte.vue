<template>
<q-page padding>
     <div class="row justify-center ">
         Contracte
     </div>


    <q-dialog v-model="adaug_contract" persistent transition-show="scale" transition-hide="scale">
        <contracte-noi  />
    </q-dialog>


    <q-page-sticky  position="bottom-right" :offset="[24, 24]">
            <q-btn fab   icon="add" color="accent"  @click="adaug_contract=true" />
    </q-page-sticky>
    <q-page-sticky  position="bottom-left" :offset="[24, 24]">
            <q-btn fab   icon="settings_backup_restore" color="accent"  @click="$router.push('/dashboard')" />
    </q-page-sticky>
</q-page>     
</template>

<script>
import ContracteNoi from '../components/ContracteNoi'

export default {
components:{
    'contracte-noi':ContracteNoi

}    ,
data(){
    return {
        adaug_contract:false
    }
}
}
</script>

<style>

</style>