const knex =require('../../db.js');
/*const User = require("../models/user");*/

module.exports.toate_locurile = (req, res, next) => {
    console.log('sunt in controllerul locuri actiunea toate_locurile....')
    knex('locuri').where('stare', 'ACTIV').orderBy(['prioritate', { column: 'denumire', order: 'asc' }]).then((rows)=>{
      return res.status(200).json({
       message: "Toate locurile",
       locuri:rows
     });
    }).catch(err =>{})
}


module.exports.update_loc = (req, res, next) => {
  console.log('sunt in controllerul locuri actiunea UPDATE....',req.params.idloc)
  knex('locuri').where({
    id: req.params.idloc
  }).update({

    stare:'INACTIV'
  })
  .then(()=>{
    return res.status(200).json({
      message: "Loc de dispunere inactivat!"
    });
  
  }).catch(err =>{})
};





module.exports.locnou = (req,res,next) =>{

  console.log('sunt in comntrolerul loc actiunea loc nou')

  if(req.body.denumire===""){
    return res.status(401).json({
      message: "Cimpuri vide!"
    })
  }

  knex('locuri').where({
    denumire : req.body.denumire
  }).then((rows)=>{
      if(rows.length>0) return res.status(401).json({
                                                      message: "Acest nume este deja folosit!"
                                                    })
      else {
        knex('locuri').insert({
          denumire:req.body.denumire,
          stare:'ACTIV',
          prioritate:1
          
      }).then((d)=>{
        console.log('Loc adaugat ',d)
        return res.status(200).json({
          message: "Loc de  dispunere adaugat!",
          id:d[0]
        })
      }).catch(err =>{})
      }                                              
  }).catch(err =>{})
}