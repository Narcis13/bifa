const knex =require('../../db.js');
/*const User = require("../models/user");*/

module.exports.toate_gestiunile = (req, res, next) => {
    console.log('sunt in controllerul gestiune actiunea toate_gestiunile....')
    /*
    knex.select(['gestiuni.id', 'gestiuni.denumire', 'gestiuni.r_presedinte', 'gestiuni.i_presedinte' ,'utilizatori.username'])
.from('gestiuni')
.innerJoin('utilizatori','utilizatori.id','gestiuni.userid')
    */ 
   knex.select(['gestiuni.id', 'gestiuni.denumire', 'gestiuni.userid' ,'gestiuni.r_presedinte', 'gestiuni.i_presedinte' ,'gestiuni.r_membru1','gestiuni.r_membru2','gestiuni.r_membru3','gestiuni.i_membru1','gestiuni.i_membru2','gestiuni.i_membru3','utilizatori.username','gestiuni.gestionar'])
   .from('gestiuni')
   .innerJoin('utilizatori','utilizatori.id','gestiuni.userid').orderBy('gestiuni.denumire').then((rows)=>{
      return res.status(200).json({
       message: "Toate gestiunile",
       gestiuni:rows
     });
    }).catch(err =>{})
}


module.exports.sterg_gestiune = (req, res, next) => {
  console.log('sunt in controllerul gestiuni actiunea delete....',req.params.userId)
  knex('gestiuni').where({
    id: req.params.idgest
  }).del()
  .then(()=>{
    return res.status(200).json({
      message: "Gestiune stearsa!"
    });
  
  }).catch(err =>{})
};

module.exports.update_gestiune = (req, res, next) => {
  console.log('sunt in controllerul gestiuni actiunea UPDATE....',req.params.idgest)
  knex('gestiuni').where({
    id: req.params.idgest
  }).update({
    denumire:req.body.denumire,
    userid:req.body.userid,
    gestionar:req.body.gestionar,
    r_presedinte:req.body.r_presedinte,
    r_membru1:req.body.r_membru1,
    r_membru2:req.body.r_membru2,
    r_membru3:req.body.r_membru3,
    i_presedinte:req.body.i_presedinte,
    i_membru1:req.body.i_membru1,
    i_membru2:req.body.i_membru2,
    i_membru3:req.body.i_membru3,          
    updated_at:new Date().toISOString(),
    stare:req.body.stare
  })
  .then(()=>{
    return res.status(200).json({
      message: "Gestiune actualizata!"
    });
  
  }).catch(err =>{})
};



module.exports.gestiunenoua = (req,res,next) =>{

  console.log('sunt in comntrolerul gestiune actiunea gestiune noua')

  if(req.body.denumire===""||req.body.userid==0){
    return res.status(401).json({
      message: "Cimpuri vide!"
    })
  }

  knex('gestiuni').where({
    denumire : req.body.denumire
  }).then((rows)=>{
      if(rows.length>0) return res.status(401).json({
                                                      message: "Acest nume este deja folosit!"
                                                    })
      else {
        knex('gestiuni').insert({
          denumire:req.body.denumire,
          userid:req.body.userid,
          gestionar:req.body.gestionar,
          r_presedinte:req.body.r_presedinte,
          r_membru1:req.body.r_membru1,
          r_membru2:req.body.r_membru2,
          r_membru3:req.body.r_membru3,
          i_presedinte:req.body.i_presedinte,
          i_membru1:req.body.i_membru1,
          i_membru2:req.body.i_membru2,
          i_membru3:req.body.i_membru3,          
          created_at:knex.fn.now(),//new Date().toISOString(),
          updated_at:knex.fn.now(),//new Date().toISOString(),
          stare:req.body.stare
          
      }).then((d)=>{
        console.log('Gestiune adaugata ',d)
        return res.status(200).json({
          message: "Gestiune adaugata!",
          id:d[0]
        })
      }).catch(err =>{})
      }                                              
  }).catch(err =>{})
}