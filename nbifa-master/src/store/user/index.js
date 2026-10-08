export default {
    state: {
      user: null,
      akyuser:null,
      iduser:0,
      token:null,
      rol:null,
      numereal:'',
      gestiuni:null,
      document_in_lucru:false,
      gestiuneCurenta:{id:0,denumire:''}
    },
    mutations: {
      registerUserForMeetup (state, payload) {
        const id = payload.id
        if (state.user.registeredMeetups.findIndex(meetup => meetup.id === id) >= 0) {
          return
        }
        state.user.registeredMeetups.push(id)
        state.user.fbKeys[id] = payload.fbKey
      },
      unregisterUserFromMeetup (state, payload) {
        const registeredMeetups = state.user.registeredMeetups
        registeredMeetups.splice(registeredMeetups.findIndex(meetup => meetup.id === payload), 1)
        Reflect.deleteProperty(state.user.fbKeys, payload)
      },
      setUser (state, payload) {
        if(payload){
          state.user = payload.nume;
          state.iduser=payload.iduser;
          state.token = payload.token;
          state.rol = payload.rol;
          state.numereal=payload.nume_real;
          state.gestiuni = payload.gestiuni;
        }
        else
        {
          state.user = null;
          state.iduser=0;
          state.token = null;
          state.rol = null;
          state.numereal='';
          state.gestiuni =null;
        }
   
      },
      setAkyUser(state,payload){
          if(payload)
             state.akyuser=payload
          else
             state.akyuser=null;   
      },
      setGestiuneCurenta (state,payload){
        state.gestiuneCurenta = payload;
      },
      setDocumentInLucru(state,payload){
        state.document_in_lucru=payload;
      }
    },
    actions: {
      registerUserForMeetup ({commit, getters}, payload) {
        commit('setLoading', true)
        const user = getters.user
        firebase.database().ref('/users/' + user.id).child('/registrations/')
          .push(payload)
          .then(data => {
            commit('setLoading', false)
            commit('registerUserForMeetup', {id: payload, fbKey: data.key})
          })
          .catch(error => {
            console.log(error)
            commit('setLoading', false)
          })
      },
      unregisterUserFromMeetup ({commit, getters}, payload) {
        commit('setLoading', true)
        const user = getters.user
        if (!user.fbKeys) {
          return
        }
        const fbKey = user.fbKeys[payload]
        firebase.database().ref('/users/' + user.id + '/registrations/').child(fbKey)
          .remove()
          .then(() => {
            commit('setLoading', false)
            commit('unregisterUserFromMeetup', payload)
          })
          .catch(error => {
            console.log(error)
            commit('setLoading', false)
          })
      },
      signUserUp ({commit}, payload) {
        commit('setLoading', true)
        commit('clearError')
        firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
          .then(
            user => {
              commit('setLoading', false)
              const newUser = {
                id: user.uid,
                registeredMeetups: [],
                fbKeys: {}
              }
              commit('setUser', newUser)
            }
          )
          .catch(
            error => {
              commit('setLoading', false)
              commit('setError', error)
              console.log(error)
            }
          )
      },
      signUserIn ({commit}, payload) {
        console.log('se ruleaza actiunea signUserIn...',payload);
        commit('setUser', payload);
        this.$router.push('/');
      },
      akysignUserIn ({commit}, payload) {
        console.log('se ruleaza actiunea akysignUserIn...',payload);
        commit('setAkyUser', payload);
        this.$router.push('/dashboard');
      },
      schimbaGestiuneaCurenta ({commit}, payload) {
        console.log('se ruleaza actiunea schimbaGestiuneaCurenta...',payload);
        commit('setGestiuneCurenta', payload);
        
      },
      comutaDocumentInLucru ({commit}, payload) {
        commit('setDocumentInLucru', payload);
      },
      autoSignIn ({commit}, payload) {
        commit('setUser', {
          id: payload.uid,
          registeredMeetups: [],
          fbKeys: {}
        })
      },
      fetchUserData ({commit, getters}) {
        commit('setLoading', true)
        firebase.database().ref('/users/' + getters.user.id + '/registrations/').once('value')
          .then(data => {
            const dataPairs = data.val()
            let registeredMeetups = []
            let swappedPairs = {}
            for (let key in dataPairs) {
              registeredMeetups.push(dataPairs[key])
              swappedPairs[dataPairs[key]] = key
            }
            const updatedUser = {
              id: getters.user.id,
              registeredMeetups: registeredMeetups,
              fbKeys: swappedPairs
            }
            commit('setLoading', false)
            commit('setUser', updatedUser)
          })
          .catch(error => {
            console.log(error)
            commit('setLoading', false)
          })
      },
      logout ({commit}) {
        console.log('Log out!');
        commit('setUser', null);
        this.$router.push('/login');
      },
      akylogout ({commit}) {
        console.log('Log out din BIFA AKY!');
        commit('setAkyUser', null);
        this.$router.push('/aky');
      }
    },
    getters: {
      user (state) {
        return state.user
      },
      akyuserlogat (state){
       // return state.akyuser[0].username
       return state.akyuser? state.akyuser.utilizator[0].username:"Nimeni";
      },
      akyroluserlogat(state){
        return state.akyuser? state.akyuser.utilizator[0].rol:"Niciunul";
      },
      compartimentakyuserlogat (state){
        // return state.akyuser[0].username
        return state.akyuser? state.akyuser.utilizator[0].denumire:"Niciunul";
       },
       idcompartimentakyuserlogat (state){
        // return state.akyuser[0].username
        return state.akyuser? state.akyuser.utilizator[0].idcompartiment:"Niciunul";
       },
      userid(state){
          return state.iduser
      },
      rol(state){
        return state.rol
      },
      token(state){
        return state.token
      },
      akytoken(state){
        return state.akyuser? state.akyuser.token:null;
      },      
      gestiuni(state){
        return state.gestiuni
      },
      gestiuneCurenta(state){
        return state.gestiuneCurenta
      },
      documentInLucru(state){
          return state.document_in_lucru
      },
      numeReal(state){
        return state.numereal
      }
  }
}