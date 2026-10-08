<template>
<div>
      <q-chip :key="item.data" v-for="item in state.itemi" color="primary" text-color="white" icon="event">
            {{item.data}} : {{item.suma}} lei
      </q-chip>
</div>

</template>

<script>
import { defineComponent, onMounted,inject,reactive } from 'vue'
import axios from 'axios'
import { date } from 'quasar'
const state = reactive(
  {
    itemi : []      
  }
  )
export default defineComponent({
    name:'AngTimeLine',
    props:['cine'],
    setup(p){

        console.log('Initializare AngTimeLine',p.cine.idAntet)
        const global=inject('global');
        const token=global.state.user.token;
       // let itemi=[];
        onMounted(() => {

                  axios.get(process.env.host+`angajamente/angajamentelaantet/${p.cine.idAntet}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

                  res => {
                  console.log('Raspuns la toate angajamentele pentru antet',res.data);
                  state.itemi=[];
                    res.data.anglaantet.map(a=>{
                          state.itemi.push({
                                data:date.formatDate(a.data_ang, 'DD/MM/YYYY'),
                                suma:a.suma
                          })
                    })
            
                  }
                  ).catch(err =>{})
                         console.log('mounted!')
                  })
       return {
          state
      }
    }
})
</script>