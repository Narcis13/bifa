
const jwt =require("jsonwebtoken");
const knex =require('../../db.js');
const knexaky =require('../../dbaky.js');
/*const User = require("../models/user");*/

module.exports.user_signup = (req, res, next) => {
  // inregistrez utilizatori noi
  if(req.body.username===""||req.body.password===""||req.body.rol===""){
    return res.status(401).json({
      message: "Cimpuri vide!"
    })
  }

  knex('utilizatori').where({
    username : req.body.username
  }).then((rows)=>{
      if(rows.length>0) return res.status(401).json({
                                                      message: "Acest nume este deja folosit!"
                                                    })
      else {
        knex('utilizatori').insert({
          username:req.body.username,
          password:req.body.password,
          name:req.body.name,
          email:req.body.email,
          created_at:knex.fn.now(),//new Date().toISOString(),
          updated_at:knex.fn.now(),//new Date().toISOString(),
          stare:req.body.stare,
          rol:req.body.rol
      }).then((d)=>{
        console.log('User adaugat ',d)
        return res.status(200).json({
          message: "Utilizator adaugat!",
          id:d[0]
        })
      }).catch(err =>{})
      }                                              
  }).catch(err =>{})


};

module.exports.user_loginaky = (req, res, next) => {
  console.log('sunt in controllerul users actiunea loginAKY....',req.body)
  knexaky.select(['authentication.id', 'authentication.username', 'authentication.rol' ,'authentication.sigiliu','authentication.obs', 'compartimente.denumire',{idcompartiment:'compartimente.id'} ])
  .from('authentication')
  .innerJoin('compartimente','compartimente.idsef','authentication.id')
  .where({
    username: req.body.user
  })
  .then((rows)=>{
    console.log('rows dfrom adata authentication',rows)
    if(rows.length==1){


      const token = jwt.sign(
        {
          nume:  req.body.user,
          parola: req.body.parola
        },
       'ROSES',
        {
          expiresIn: "2h"
        }
      );
       
      return res.status(200).json({
        message: "Logat cu succes in aplicatia BIFA AKY",
        token,
        utilizator:rows
      })

    }
    else
    return res.status(401).json({
      message: "Auth failed"
    });
  
  }).catch(err =>{console.log(err)})


}

module.exports.user_login = (req, res, next) => {
  console.log('sunt in controllerul users actiunea login....')
  knex('utilizatori').where({
    username: req.body.user,
    password:  req.body.parola
  }).select()
  .then((rows)=>{
    if(rows.length==1){
      const token = jwt.sign(
        {
          nume:  req.body.user,
          parola: req.body.parola
        },
       'ROSES',
        {
          expiresIn: "2h"
        }
      );

      knex('gestiuni').where({
        userid: rows[0].id

      }).select()
      .then(r=>{
          //asta se copiaza in callbackul de la al doilea request rows[0].id
          return res.status(200).json({
            message: "Logat cu succes",
            token,
            rol:rows[0].rol,
            gestiuni:r,
            nume: req.body.user,
            nume_real:rows[0].name,
            iduser:rows[0].id
          })

      }).catch(err =>{})
    

    }
    else
    return res.status(401).json({
      message: "Auth failed"
    });
  
  }).catch(err =>{console.log(err)})
  }

  

  module.exports.user_delete = (req, res, next) => {
  console.log('sunt in controllerul users actiunea delete....',req.params.userId)
  knex('utilizatori').where({
    id: req.params.userId
  }).del()
  .then(()=>{
    return res.status(200).json({
      message: "Utilizator sters"
    });
  
  }).catch(err =>{})
};

module.exports.all_users = (req, res, next) => {
 console.log('sunt in controllerul users actiunea all_users....')
 knex('utilizatori').then((rows)=>{
   return res.status(200).json({
    message: "Toti utilizatorii",
    utilizatori:rows
  });
 }).catch(err =>{})
 
};