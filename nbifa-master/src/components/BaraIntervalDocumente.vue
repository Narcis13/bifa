<template>
    <div class="row q-pa-md">
    <q-btn-group rounded>
      <q-btn rounded color="primary" label="Luna aceasta" @click="SchimbaInterval(0)"></q-btn>

      <q-btn rounded color="primary" label="Luna trecuta" @click="SchimbaInterval(1)"></q-btn>
      
      <q-btn rounded color="primary" label="Anul acesta" @click="SchimbaInterval(2)"></q-btn>

      <q-btn-dropdown  rounded color="primary" label="Alta perioada" >
        <!-- dropdown content goes here -->
    <q-card >
      <q-card-section>
          <q-input filled label="De la" v-model="datainceput" mask="date" :rules="['date']">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy1" transition-show="scale" transition-hide="scale">
                  <q-date v-model="datainceput" @input="() => $refs.qDateProxy1.hide()" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input filled label="La" v-model="datasfirsit" mask="date" :rules="['date']">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy2" transition-show="scale" transition-hide="scale">
                  <q-date v-model="datasfirsit" @input="() => $refs.qDateProxy2.hide()" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
      </q-card-section>

      <q-card-actions vertical>
        <q-btn flat v-close-popup @click="SchimbaInterval(-1)">Selecteaza</q-btn>

      </q-card-actions>
    </q-card>
      </q-btn-dropdown>
    </q-btn-group>
    <div class="q-pa-sm text-bold">
      {{datainceput}} : {{datasfirsit}}
    </div>
  </div>
</template>

<script>
import { date } from 'quasar'
//import {saveAs} from 'file-saver'
import axios from 'axios'
export default {
    name:'BaraIntervalDocumente',
    props:['docs'],
    data(){
        return {
            datainceput: '2019/02/01',
            datasfirsit:'2019/02/01',
            listadocumente:this.docs,
        }
    },
    created(){
     this.$root.$on('schimbgestiunea',this.schimbaGestiunea)
     this.SchimbaInterval(0)  ;

     //this.DocumenteInInterval();

    },
    methods:{
      test(){
        alert('Metoda test implementata in comp Bara Interval!')
      },
      schimbaGestiunea(id){
        this.SchimbaInterval(0,id)  ;

      },
      raportUnDocument(id){
             window.open(process.env.host+'rapoarte/undocument/'+id,'_blank');
      },
      modificaUnDocument(id){
          
      },
      raportToateDocumentele(idgest,numegest){
          const token=this.$store.getters.token;
          var that=this;
          axios.post(process.env.host+'rapoarte/documenteinterval',{
              "inceput":this.datainceput,
              "sfirsit":this.datasfirsit,
              "idgestiune":idgest,
              "numegest":numegest

           },{responseType:'blob',headers:{"Authorization" : `Bearer ${token}`}}).then(
             res => {
                 // aici raspuns de la documente
                 //console.log('BLOB',res)
                  const file = new Blob([res.data], {
                            type: "application/pdf"
                          });

                // saveAs(file,'pdfNou.pdf');
                let newWindow = window.open('/','documenteInterval')
                newWindow.onload = () => {
                        newWindow.location = URL.createObjectURL(file);
                        
                      };
                newWindow.document.title="Situatie documente in interval"      
              }
           ).catch(err=>{
                 //  console.log('Eroare.............',err.response.data.message)
                    this.$q.notify({
                        color: 'negative',
                        timeout:1500,
                        position:'top',
                        icon: 'delete',
                        message: `ATENTIE! `
                     })
             })
      },
      DocumenteInInterval(idgest){
          const token=this.$store.getters.token;
          var that=this;
          axios.post(process.env.host+'documente/documenteinterval',{
              "inceput":this.datainceput,
              "sfirsit":this.datasfirsit,
              "idgestiune":idgest

           },{headers:{"Authorization" : `Bearer ${token}`}}).then(
             res => {
                 // aici raspuns de la documente

                 for(var i=0;i<res.data.documente.length;i++){
                   res.data.documente[i].data=date.formatDate(res.data.documente[i].data, 'YYYY/MM/DD');
                 }
                 console.log('Raspuns la documente in interval',res);
                 this.$emit("new-data", res.data.documente);
               //  that.docs=[...res.data.documente]
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
             })
      },
      SchimbaInterval(p,idgest){
         var azi = new Date(); 
         idgest=idgest||this.$store.getters.gestiuneCurenta.id
         //custom period
        if(p==-1){
           this.DocumenteInInterval(idgest);
           return;
          
        }

        // 0 -> luna curenta  
        if(p==0) {
                var firstDay =  
                    new Date(azi.getFullYear(), azi.getMonth(), 1); 
                      
                var lastDay =  
                   new Date(azi.getFullYear(), azi.getMonth() + 1, 0); 
        }

         // 1 -> luna trecuta
        if(p==1){
                var firstDay =  
                    new Date(azi.getFullYear(), azi.getMonth()-1, 1); 
                      
                var lastDay =  
                   new Date(azi.getFullYear(), azi.getMonth(), 0); 

        }

        //2 -> anul acesta
        if(p==2){

               var firstDay =  
                    new Date(azi.getFullYear(), 0, 1); 
                      
                var lastDay =   azi; 
        }

       this.datainceput=date.formatDate(firstDay, 'YYYY/MM/DD');
       this.datasfirsit=date.formatDate(lastDay, 'YYYY/MM/DD');    

       this.DocumenteInInterval(idgest);

      }
    }
}
</script>
