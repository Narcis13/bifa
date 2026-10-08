

const knex =require('../../db.js');
/*const User = require("../models/user");*/



module.exports.toate = (req, res, next) => {
 console.log('sunt in controllerul materiale actiunea toate....')
 knex.column(['materiale.id','materiale.denumire','materiale.cod_import','materiale.um','materiale.pretpredefinit',{gestiune:'gestiuni.denumire'},{user:'utilizatori.name'},'materiale.datacreere','materiale.datamodificare'])
 .select().from('materiale')
 .innerJoin('gestiuni','materiale.idgestiune','gestiuni.id')
 .innerJoin('utilizatori','utilizatori.id','materiale.iduser').where({'materiale.stare': 'ACTIV','materiale.idgestiune':req.params.idgest}).then((rows)=>{
   return res.status(200).json({
    message: "Toate materialele",
    materiale:rows
  });
 }).catch(err =>{})
 
};

module.exports.ultimulcod = (req,res,next)=>{
let sql=`
SELECT * FROM bifa.materiale where stare='activ' and idgestiune=? order by id desc limit 1;
`
console.log('Ultimul cod!',req.params.idgest)

knex.raw(sql,[req.params.idgest]).then(
  r=>{
   // console.log("Raspuns de la query stoc pret mediu",r)
   return res.status(200).json({
    message: "Ultimul cod",
    coduri:r
   
  });
  }
).catch(err =>{console.log(err)})
}

module.exports.materialnou = (req,res,next) =>{
  console.log('sunt in comntrolerul matriale actiunea material nou',req.body)
  if(req.body.denumire===""){
    return res.status(401).json({
      message: "Cimpuri vide!"
    })
  }

  knex('materiale').insert({
    denumire:req.body.denumire,
    um:req.body.um,
    cod_import:req.body.cod_import,
    pretpredefinit:req.body.pretpredefinit,
    idgestiune:req.body.idgestiune,
    iduser:req.body.iduser,
    stare:req.body.stare,
        
    datacreere:knex.fn.now(),//new Date().toISOString(),
    datamodificare:knex.fn.now()//new Date().toISOString()

    
}).then((d)=>{
  console.log('Material adaugat',d)
  return res.status(200).json({
    message: "Material adaugat!",
    id:d[0]
  })
}).catch(err =>{ console.log(err)})
};

module.exports.sterg_material = (req, res, next) => {
  console.log('sunt in controllerul materiale actiunea STERGERE....',req.params.id)
  knex('materiale').where({
    id: req.params.id
  }).update({

    stare:'INACTIV'
  })
  .then(()=>{
    return res.status(200).json({
      message: "Reper inactivat!"
    });
  
  }).catch(err =>{})
};

module.exports.update = (req, res, next) => {
  const cimp=Object.keys(req.body)[0];
  const valoare = req.body[cimp];
  console.log('sunt in controllerul materiale actiunea UPDATE BUCATELE....',req.params.idmaterial,cimp,valoare)
  knex('materiale').where({
    id: req.params.idmaterial
  }).update({
         
    datamodificare:knex.fn.now(),
    [cimp]:valoare
  })
  .then(()=>{
    return res.status(200).json({
      message: "Actualizare reusita"
    });
  
  }).catch(err =>{})

};