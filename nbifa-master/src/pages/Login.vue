<template>
  <q-page class="flex flex-center">
     <div  class="bg-grey-2" style=" padding: 25px">
         
      
         <q-input autofocus label="Utilizator" v-model="numeUser" :rules="[val => !!val || 'Cimp obligatoriu!']" />
        
   
        <q-input label="Parola" type="password" v-model="pass"  /> 
        
        
    <br/>
    <div class="row justify-center">
        <q-btn flat @click="autentificare">Autentificare</q-btn>
    </div>
         
    </div>
 </q-page>
</template>


<script>
import axios from 'axios'
export default {
    data(){
      return {
        numeUser:'',
        pass:''
      }


    },
  mounted(){
       console.log('Login form  mounted!',this.$root._route.path)
  },
    methods:{
      autentificare(){
        let sufix=this.$root._route.path==="/aky"?"loginaky":"login";
        axios.post(process.env.host+'user/'+sufix,{user:this.numeUser,parola:this.pass}).then(
            res => {
               console.log('Raspuns la autentificare ',res)
               this.$q.notify({
                 message:res.data.message,
                 timeout:1500,
                 position:'top',
                 color:'positive'
               });

               if(sufix==="loginaky")
                 this.$store.dispatch('akysignUserIn',res.data)
               else
                this.$store.dispatch('signUserIn',res.data)
            }
     ).catch(err=>{
       this.numeUser=''
       this.pass=''
       this.$q.notify({
                    color: 'negative',
                    timeout:1500,
                    position:'top',
                    icon: 'delete',
                    message: `User sau parola incorecte...`
                  })
       console.log('Eroare autentificare',err);
     });
       // this.$store.dispatch('signUserIn',this.numeUser)
      }
    }
  }

</script>
