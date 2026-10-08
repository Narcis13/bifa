<template>
<q-page padding >
     <div class="q-pa-md" style="max-width:300px">
            <q-list bordered separator>

                    <q-slide-item  v-for="l in locuri" :key="l.id" @left="onLeft(l.id,$event)" @right="onRight" left-color="red">
                        <template v-slot:left>
                            <div class="row items-center">
                                <q-icon left name="delete" /> Sterge!
                            </div>
                        </template>

                        <q-item>
                          <q-item-section>{{l.denumire}}</q-item-section>
                          <q-item-section v-if="l.nou" side >
                                <q-badge color="orange" text-color="black" label="NOU!" />
                          </q-item-section>
                        </q-item>
                    </q-slide-item>

                    

    </q-list>
    <q-btn
            round
            color="primary"
         
            class="fixed"
            icon="add"
            style="right: 48px; bottom: 64px"
    >
            <q-popup-edit v-model="numenou" content-class="bg-accent text-white" buttons @save="adLoc">
                <q-input dark color="white" v-model="numenou" dense autofocus counter >
                    <template v-slot:append>
                            <q-icon name="edit" />
                    </template>
                </q-input>
            </q-popup-edit>
    </q-btn>
     </div>
</q-page>
   
</template>
<script>
import axios from 'axios'

export default {
  data(){
      return {
         locuri:[],
         numenou:''
      }
  },
  created(){
    const token=this.$store.getters.token;

      axios.get(process.env.host+'locuri/toatelocurile',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Raspuns la toate locurile',res);
           this.locuri=[...res.data.locuri]
        }
      ).catch(err =>{})
  },
  methods: {
    adLoc(){
       // alert('adaug loc')
       const numenou=this.numenou;
         const token=this.$store.getters.token;
         var that = this;

          axios.post(process.env.host+'locuri/locnou',{
            "denumire":this.numenou,
            "stare":'ACTIV',
            "prioritate":1
      },{headers:{"Authorization" : `Bearer ${token}`}}).then(
            res => {
              console.log('Am primit idul,',res.data,numenou)
                 this.$q.notify({
                 message:`Locul ${numenou} a fost adaugat cu succes!`,
                 timeout:1500,
                 position:'top',
                 color:'positive'
      });

           let locNou={
           id:res.data.id ,
           denumire:numenou,
           stare:'ACTIV',
           nou:true,
           prioritate:1
          }
         that.locuri.unshift(locNou);
         that.numenou='';

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



    },  
    onLeft (k,{reset}) {
      console.log('asta primesc la on Left',k,reset)
      this.$q.notify('Loc de dispunere sters cu succes')
      this.finalize(reset,k)
    },

    onRight ({ reset }) {
      this.$q.notify('Right action triggered. Resetting in 1 second.')
      this.finalize(reset)
    },

    finalize (reset,id) {
      var that=this;
       const token=this.$store.getters.token;
      this.timer = setTimeout(() => {
        reset()
         axios.patch(process.env.host+`locuri/${id}`,{},{headers:{"Authorization" : `Bearer ${token}`}}).then(
                res => {
                                     that.locuri.some(function(item, index) {
                                            return ( that.locuri[index]["id"] === id) ? !!( that.locuri.splice(index, 1)) : false;
                                           });   
                   })

      }, 1000)
    }
  },

  beforeDestroy () {
    clearTimeout(this.timer)
  }
}
</script>