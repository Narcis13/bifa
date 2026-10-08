import {reactive} from 'vue'

const state = reactive({
    user:{
        autentificat:false,
        nume:'',
        nume_logare:'',
        compartiment:null,
        rol:null,
        token:null,
        idcompartiment:0,
        idutilizator:0,
        sigiliu:null
    }
})

const actions = {
     autentificare(user){
         console.log('Autentificare: ',user)

         state.user.autentificat=true;
         state.user.token=user.token;
         state.user.nume=user.utilizator[0].obs;
         state.user.nume_logare=user.utilizator[0].username;
         state.user.rol=user.utilizator[0].rol;
         state.user.sigiliu=user.utilizator[0].sigiliu;
         state.user.compartiment=user.utilizator[0].denumire;
         state.user.idcompartiment=user.utilizator[0].idcompartiment;
         state.user.idutilizator=user.utilizator[0].id;
     },
     deconectare(){
        state.user.autentificat=false
     }
}

export default {
    state,
    actions
}