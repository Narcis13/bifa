<template>
    <q-page padding>
        <q-btn icon="add_circle" @click="opened=true" color="secondary" flat label="Adauga" class="q-mr-sm" />
        <q-table
            :data="tableData"
            :columns="columns"
            selection="single"
            :selected.sync="selectedSecond"
            row-key="id"
            color="secondary"
            title="Utilizatori"
            >
                <template slot="top-selection" slot-scope="props">
        
        
                    <div class="col" />
                    <q-btn color="negative" flat round icon="delete" @click="deleteRow" />
                </template>
        </q-table>
          <q-dialog v-model="opened"  transition-show="jump-down" transition-hide="jump-up">
            <q-card class="q-pa-md" style="width: 400px; max-width: 90vw;padding:10px">

                <q-input v-model="username" label="Utilizator" @keyup.enter="urmatorul('edParola')"/>

                <q-input ref="edParola" type="password" label="Parola" v-model="pass"  :rules="[value => value.length>4 || 'Parola trebuie sa aiba minim 5 caractere']" @keyup.enter="urmatorul('edRol')" /> 


                <q-input ref="edRol" v-model="rol" label="Rol"  @keyup.enter="urmatorul('edNume')" />

                <q-input ref="edNume" v-model="nume" label="Nume prenume" @keyup.enter="urmatorul('edEmail')"  />


                <q-input ref="edEmail" v-model="email" label="E-mail" type="email"  />


            <div class="row justify-center q-pa-md">
                <q-btn
                    color="primary"
                    icon="contact_mail"
                    
                    @click="adaugUser"
                    label="Salvez"
                />
            </div>

            </q-card>

        </q-dialog>
    </q-page>
</template>
<script>

import axios from 'axios'
export default {
  data () {
    return {
      tableData:[],
      opened:false,
      username:'',
      pass:'',
      email:'',
      rol:'',
      nume:'',
      columns: [
        {
          name: 'id',
          required: true,
          label: 'ID',
          align: 'left',
          field: 'id',
          sortable: true
        },
        { name: 'username', label: 'Nume utilizator', field: 'username', sortable: true,align: 'left' },
        { name: 'name', label: 'Nume si prenume', field: 'name', sortable: true },
        { name: 'email', label: 'Email', field: 'email' },
        { name: 'created_at', label: 'Creat la...', field: 'created_at' },
        { name: 'updated_at', label: 'Modificat la...', field: 'updated_at' },
        { name: 'rol', label: 'Rol', field: 'rol', sortable: true }
    
      ],
      filter: '',
      visibleColumns: ['desc', 'fat', 'carbs', 'protein', 'sodium', 'calcium', 'iron'],
      separator: 'horizontal',
      selection: 'single',
      selected: [
        // initial selection
        { name: 'Ice cream sandwich' }
      ],
     pagination: {
        page: 2
      },
      paginationControl: { rowsPerPage: 3, page: 1 },
      loading: false,
      dark: true,
      selectedSecond: [
        //{ name: 'Eclair' }
      ]
    }
  },
  watch: {
    'paginationControl.page' (page) {
      this.$q.notify({
        color: 'secondary',
        message: `Navigated to page ${page}`,
        actions: page < 4
          ? [{
            label: 'Go to last page',
            handler: () => {
              this.paginationControl.page = 4
            }
          }]
          : null
      })
    }
  },
  created(){
     //console.log('Se creeaza Utilizatorii....')
     const token=this.$store.getters.token;

      axios.get(process.env.host+'user/allusers',{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
           console.log('Rspuns la toti useriiii',this.tableData);
           this.tableData=[...res.data.utilizatori]
        }
      ).catch(err =>{})
  },
  computed: {
    tableClass () {
      if (this.dark) {
        return 'bg-black'
      }
    },
    passHasError(){
        return this.pass.length>0&&this.pass.length<5
      }
  },
  methods: {
    urmatorul(el){
      this.$refs[el].focus();
    },
    deleteRow () {
      console.log(this.selectedSecond[0].id);
      const token=this.$store.getters.token;
      var that = this;
      const id=this.selectedSecond[0].id;
      axios.delete(process.env.host+`user/${this.selectedSecond[0].id}`,{headers:{"Authorization" : `Bearer ${token}`}}).then(

        res => {
                 this.$q.notify({
                    color: 'secondary',
                    icon: 'delete',
                    message: `Utilizator sters!`
                  })
           that.tableData.some(function(item, index) {
               return ( that.tableData[index]["id"] === id) ? !!( that.tableData.splice(index, 1)) : false;
           });       
           //this.tableData=[...res.data.utilizatori]
        }
      ).catch(err =>{})

    },
    adaugUser(){
      const username=this.username;
      const token=this.$store.getters.token;
      var that = this;
      axios.post(process.env.host+'user/signup',{
         "username":this.username,
         "password":this.pass,
         "name":this.nume,
         "email":this.email,
         "stare":"activ",
        "rol":this.rol
      },{headers:{"Authorization" : `Bearer ${token}`}}).then(
            res => {
                 this.$q.notify({
                 message:`Utilizatorul ${username} a fost adaugat cu succes!`,
                 timeout:1500,
                 position:'top',
                 color:'positive'
      });
        that.tableData.unshift({
          "id":res.data.id,
         "username":that.username,
         "password":that.pass,
         "name":that.nume,
         "email":that.email,
         "rol":that.rol
        });

      that.username='';
      that.nume='';
      that.pass='';
      that.rol='';
      that.email='';

      that.opened=false;
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

    }

  }
}
</script>